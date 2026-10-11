import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";
import { apiUrl, ids, publishableKey, recordFetch, visitorStorage, visitorToken } from "./helpers/arky-fixtures.mjs";

const STORE_ID = "7d4b2e90-5c16-4a83-bf07-3e9a1c6d8f25";
const conversationId = "7c2e9a41-5b3d-4f86-a1e0-3d4c2b9f6e18";
const messageId = "2a6d8f13-9c47-4e05-b1a8-6f3e0c2d7b95";
const promptId = "8b3e5d71-2c96-4f04-a7d1-9e2c4b6a8f30";
const addressId = "4b6d8f0a-2e3a-4b7d-9f1c-3e5a7b9d1f2a";
const supportToken = "s".repeat(64);

function support() {
  return createAdmin({ baseUrl: "https://support-contract.test", apiToken: "arky_api_support" }).support;
}

function storefront() {
  return createStorefront(publishableKey, { apiUrl, locale: "bs", sessionStorage: visitorStorage() });
}

function storefrontConversation(status = { type: "flow", step_key: "start" }) {
  return { id: conversationId, language: "bs", status, created_at: 1, updated_at: 1 };
}

test("the conversation inbox keeps native multi-status filters, the contact filter and its opaque continuation", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: "next:+/=" }));
  const filters = {
    store_id: STORE_ID,
    statuses: ["flow", "team"],
    contact: "email",
    customer_id: ids.customer,
    assigned_account_id: ids.account,
    query: "refund",
    sort_field: "created_at",
    sort_direction: "asc",
    limit: 0,
  };
  const first = await support().conversation.find(filters);
  assert.deepEqual(first.items, []);
  await support().conversation.find({ ...filters, cursor: first.cursor });
  assert.equal(calls.length, 2);
  for (const call of calls) {
    assert.equal(call.method, "GET");
    assert.equal(call.body, null);
    assert.equal(call.path, `/v1/stores/${STORE_ID}/conversations`);
    for (const removed of ["status", "store_id", "channel_id", "channel_type"]) assert.equal(removed in call.query, false, removed);
    assert.deepEqual(JSON.parse(call.query.statuses), filters.statuses);
    for (const [key, value] of Object.entries(filters).filter(([key]) => key !== "statuses" && key !== "store_id")) {
      assert.equal(call.query[key], String(value), key);
    }
  }
  assert.equal(calls[1].query.cursor, "next:+/=");
  for (const removed of ["findConversations", "findAgents", "getConversation", "getConversationMessage", "sendConversationMessage", "channel", "ai"]) {
    assert.equal(removed in support(), false, removed);
  }
});

test("support flows send their filters before paging", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: "next:+/=" }));
  const params = { store_id: STORE_ID, key: "welcome", query: "Bravo", sort_field: "updated_at", sort_direction: "asc", limit: 1 };
  const first = await support().flow.find(params);
  await support().flow.find({ ...params, cursor: first.cursor });
  const [initial, continued] = calls;
  assert.equal(initial.path, `/v1/stores/${STORE_ID}/support-flows`);
  assert.equal("store_id" in initial.query, false);
  for (const [key, value] of Object.entries(params).filter(([key]) => key !== "store_id")) {
    assert.equal(initial.query[key], String(value), key);
    assert.equal(continued.query[key], String(value), key);
  }
  assert.equal(continued.query.cursor, "next:+/=");
  assert.equal(calls.length, 2);
  assert.ok(calls.every((call) => call.method === "GET" && call.body === null));
});

test("conversation history pages its messages with the empty-page continuation, reads one message exactly and links attachments", async (context) => {
  const conversation = {
    id: conversationId,
    store_id: STORE_ID,
    customer_id: ids.customer,
    assigned_account_id: null,
    status: { type: "team" },
    chat: { language: "bs" },
    email: null,
    flow: null,
    next_message_sequence: 2,
    created_at: 0,
    updated_at: 2,
  };
  const message = { id: messageId, store_id: STORE_ID, conversation_id: conversationId, sequence: 1, type: { type: "customer_chat", text: "Help" }, created_at: 0, updated_at: 2 };
  const calls = recordFetch(context, (_call, count) => count === 1
    ? conversation
    : count === 2 ? { items: [], cursor: "older:+/=" }
    : count === 3 ? { items: [message], cursor: null }
    : count === 4 ? message : { url: "https://files.example.test/a", expires_at: 9 });
  const api = support().conversation;
  assert.deepEqual(await api.get({ store_id: STORE_ID, conversation_id: conversationId }), conversation);
  const first = await api.findMessages({ store_id: STORE_ID, conversation_id: conversationId, limit: 1 });
  assert.deepEqual(first, { items: [], cursor: "older:+/=" });
  assert.deepEqual(await api.findMessages({ store_id: STORE_ID, conversation_id: conversationId, limit: 1, cursor: first.cursor }), { items: [message], cursor: null });
  assert.deepEqual(await api.getMessage({ store_id: STORE_ID, conversation_id: conversationId, message_id: messageId }), message);
  assert.deepEqual(await api.attachmentLink({ store_id: STORE_ID, conversation_id: conversationId, message_id: messageId, sha256: "e".repeat(64) }), { url: "https://files.example.test/a", expires_at: 9 });
  assert.equal(calls.length, 5);
  assert.ok(calls.every((call) => call.method === "GET" && call.body === null));
  const base = `/v1/stores/${STORE_ID}/conversations/${conversationId}`;
  assert.deepEqual(calls.map(({ path, query }) => [path, query]), [
    [base, {}],
    [`${base}/messages`, { limit: "1" }],
    [`${base}/messages`, { limit: "1", cursor: "older:+/=" }],
    [`${base}/messages/${messageId}`, {}],
    [`${base}/messages/${messageId}/attachments/${"e".repeat(64)}`, {}],
  ]);
});

test("support writes carry the app-picked id or the conversation version", async (context) => {
  const calls = recordFetch(context, (call) => call.method === "DELETE" ? { deleted: true } : { id: "record" });
  const api = support();
  const flowId = "3f8a1c62-9d4e-4b07-a5c3-8e1d6f2b9a40";
  const steps = {
    start: { type: "chat_choice", text: { en: "How can we help?" }, buttons: [{ label: { en: "Talk to a person" }, next_step_key: "contact" }] },
    contact: { type: "collect_email_contact", text: { en: "Your email?" }, subject: { en: "Chat follow-up" }, initial_sending_address_id: addressId, next_step_key: "team" },
    team: { type: "hand_to_team" },
  };
  await api.flow.create({ store_id: STORE_ID, id: flowId, key: "welcome", start_step_key: "start", steps });
  await api.flow.update({ store_id: STORE_ID, id: flowId, expected_updated_at: 3, key: "hello", start_step_key: "start", steps });
  await api.flow.delete({ store_id: STORE_ID, id: flowId, expected_updated_at: 4 });
  await api.conversation.selectSendingAddress({ store_id: STORE_ID, conversation_id: conversationId, expected_updated_at: 6, sending_address_id: addressId });
  await api.conversation.resolve({ store_id: STORE_ID, conversation_id: conversationId, expected_updated_at: 7 });
  await api.conversation.assign({ store_id: STORE_ID, conversation_id: conversationId, expected_updated_at: 8, account_id: null });
  const base = `/v1/stores/${STORE_ID}/conversations/${conversationId}`;
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["POST", `/v1/stores/${STORE_ID}/support-flows`, {}, { id: flowId, key: "welcome", start_step_key: "start", steps }],
    ["PUT", `/v1/stores/${STORE_ID}/support-flows/${flowId}`, {}, { expected_updated_at: 3, key: "hello", start_step_key: "start", steps }],
    ["DELETE", `/v1/stores/${STORE_ID}/support-flows/${flowId}`, { expected_updated_at: "4" }, null],
    ["POST", `${base}/select-sending-address`, {}, { expected_updated_at: 6, sending_address_id: addressId }],
    ["POST", `${base}/resolve`, {}, { expected_updated_at: 7 }],
    ["POST", `${base}/assign`, {}, { expected_updated_at: 8, account_id: null }],
  ]);
  await assert.rejects(async () => api.flow.create({ store_id: STORE_ID, id: "welcome", key: "welcome", start_step_key: "start", steps }), TypeError);
  assert.equal(calls.length, 6);
});

test("an account reply is one write of the app-picked message id, its text and its delivery", async (context) => {
  const answer = { conversation: { id: conversationId }, message: { id: messageId } };
  const calls = recordFetch(context, () => answer);
  const admin = createAdmin({ baseUrl: apiUrl, apiToken: "arky_api_support" });
  assert.equal("sendConversationMessage" in admin.support.conversation, false);
  assert.deepEqual(await admin.support.conversation.reply({ store_id: ids.store, conversation_id: conversationId, id: messageId, expected_updated_at: 4, text: "I can help from here.", delivery: "chat_and_email", resolve: false }), answer);
  await admin.support.conversation.reply({ store_id: ids.store, conversation_id: conversationId, id: promptId, expected_updated_at: 5, text: "Done.", delivery: "email" });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/stores/${ids.store}/conversations/${conversationId}/messages`, { id: messageId, expected_updated_at: 4, text: "I can help from here.", delivery: "chat_and_email", resolve: false }],
    ["POST", `/v1/stores/${ids.store}/conversations/${conversationId}/messages`, { id: promptId, expected_updated_at: 5, text: "Done.", delivery: "email" }],
  ]);
  await assert.rejects(async () => admin.support.conversation.reply({ store_id: ids.store, conversation_id: conversationId, id: "reply-1", expected_updated_at: 4, text: "x", delivery: "chat", resolve: true }), {
    name: "TypeError",
    message: "The conversation message id must be a canonical UUID v4 picked by the app",
  });
  assert.equal(calls.length, 2);
});

test("storefront support starts with an app-picked id, explicit language and an optional flow key, and sends its token only in the header", async (context) => {
  const started = { conversation: storefrontConversation(), messages: [], support_token: supportToken };
  const calls = recordFetch(context, (call) => call.method === "POST" ? started : storefrontConversation());
  const client = storefront();
  assert.deepEqual(await client.support.conversation.start({ id: conversationId, language: "bs" }), started);
  await client.support.conversation.start({ id: conversationId, language: "en", flow_key: "returns" });
  const read = await client.support.conversation.get({ conversation_id: conversationId, support_token: supportToken });
  assert.deepEqual(read, storefrontConversation());
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", "/v1/storefront/conversations", { id: conversationId, language: "bs" }],
    ["POST", "/v1/storefront/conversations", { id: conversationId, language: "en", flow_key: "returns" }],
    ["GET", `/v1/storefront/conversations/${conversationId}`, null],
  ]);
  assert.equal(calls[2].headers.get("x-arky-support-token"), supportToken);
  assert.equal(calls[2].headers.get("authorization"), `Bearer ${visitorToken}`);
  assert.equal(calls[2].href.includes(supportToken), false);
  assert.equal(calls[0].headers.get("x-arky-support-token"), null);
  assert.equal(calls[0].headers.get("x-arky-locale"), "bs");
  await assert.rejects(client.support.conversation.start({ id: "chat-1", language: "bs" }), TypeError);
  assert.equal(calls.length, 3);
  for (const removed of ["startConversation", "getConversation", "sendMessage", "getMessage"]) assert.equal(removed in client.support, false, removed);
});

test("a storefront chat message is one write with the app-picked id, the input and the answered prompt, and returns the flow's reply", async (context) => {
  const reply = {
    conversation: storefrontConversation({ type: "flow", step_key: "contact" }),
    messages: [
      { id: messageId, conversation_id: conversationId, sequence: 2, type: { type: "customer_chat", text: "Talk to a person" }, created_at: 2, updated_at: 2 },
      { id: "flow-reply", conversation_id: conversationId, sequence: 3, type: { type: "flow_question", text: "Your email?", input_type: "email" }, created_at: 2, updated_at: 2 },
    ],
  };
  const calls = recordFetch(context, (call) => call.method === "POST" ? reply : call.path.endsWith("/messages") ? { items: reply.messages, cursor: null } : reply.messages[1]);
  const client = storefront().support.conversation;
  assert.deepEqual(await client.sendMessage({ conversation_id: conversationId, support_token: supportToken, id: messageId, input: { type: "button", label: "Talk to a person" }, prompt_message_id: promptId }), reply);
  await client.sendMessage({ conversation_id: conversationId, support_token: supportToken, id: promptId, input: { type: "text", text: "buyer@example.test" } });
  assert.deepEqual(await client.findMessages({ conversation_id: conversationId, support_token: supportToken, limit: 20, cursor: "older" }), { items: reply.messages, cursor: null });
  assert.deepEqual(await client.getMessage({ conversation_id: conversationId, support_token: supportToken, message_id: "flow-reply" }), reply.messages[1]);
  const base = `/v1/storefront/conversations/${conversationId}`;
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["POST", `${base}/messages`, {}, { id: messageId, input: { type: "button", label: "Talk to a person" }, prompt_message_id: promptId }],
    ["POST", `${base}/messages`, {}, { id: promptId, input: { type: "text", text: "buyer@example.test" } }],
    ["GET", `${base}/messages`, { limit: "20", cursor: "older" }, null],
    ["GET", `${base}/messages/flow-reply`, {}, null],
  ]);
  for (const call of calls) {
    assert.equal(call.headers.get("x-arky-support-token"), supportToken);
    assert.equal(call.headers.get("authorization"), `Bearer ${visitorToken}`);
  }
});

test("the support token travels only in its header, a caller copy is replaced, and a missing token or message id is refused before any request", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: null }));
  const client = storefront().support.conversation;
  await client.findMessages(
    { conversation_id: conversationId, support_token: supportToken, limit: 20, cursor: "older" },
    { headers: { "X-ARKY-SUPPORT-TOKEN": "forged" } },
  );
  assert.equal(calls[0].path, `/v1/storefront/conversations/${conversationId}/messages`);
  assert.deepEqual(calls[0].query, { limit: "20", cursor: "older" });
  assert.equal(calls[0].headers.get("x-arky-support-token"), supportToken);
  await assert.rejects(client.get({ conversation_id: conversationId, support_token: "" }), /needs the token its start returned/);
  await assert.rejects(client.getMessage({ conversation_id: conversationId, message_id: messageId, support_token: "" }), /needs the token its start returned/);
  await assert.rejects(client.findMessages({ conversation_id: conversationId, support_token: "" }), /needs the token its start returned/);
  await assert.rejects(client.sendMessage({ conversation_id: conversationId, support_token: supportToken, id: "message-1", input: { type: "text", text: "x" } }), {
    name: "TypeError",
    message: "The conversation message id must be a canonical UUID v4 picked by the app",
  });
  await assert.rejects(client.sendMessage({ conversation_id: conversationId, support_token: "", id: messageId, input: { type: "text", text: "x" } }), /needs the token its start returned/);
  assert.equal(calls.length, 1);
});
