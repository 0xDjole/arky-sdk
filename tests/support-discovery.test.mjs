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
const templateId = "5e1a9c37-4b28-4d60-8f13-2c7a6e0b9d45";
const returnsAddressId = "8e0a2c4e-6b7d-4f9a-b1c3-5d7f9b1d3f5a";
const reply = { email_template_id: templateId, sending_address_id: addressId, from_name: "Support", reply_to: { type: "address", email_address_id: addressId } };
const contact = { email: "buyer@example.test", language: "bs" };

function support() {
  return createAdmin({ apiUrl: "https://support-contract.test", secretKey: "arky_api_support" }).support;
}

function storefront() {
  return createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, locale: "bs", sessionStorage: visitorStorage() });
}

function storefrontConversation(state = "flow") {
  return { id: conversationId, language: "bs", state, created_at: 1, updated_at: 1 };
}

test("staff starts an email conversation for a contact with a reply selection and retained caller-picked IDs", async (context) => {
  const answer = {
    conversation: { id: conversationId, state: { type: "waiting_for_team", flow: null }, type: { type: "email", email: { contact, subject: "Delivery", reply } } },
    message: { id: messageId },
  };
  const calls = recordFetch(context, () => answer);
  const params = { store_id: STORE_ID, id: conversationId, message_id: messageId, customer_id: ids.customer, contact, subject: "Delivery", reply, text: "We can help." };
  assert.deepEqual(await support().conversation.startEmail(params), answer);
  assert.deepEqual(await support().conversation.startEmail(params), answer);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].path, `/v1/stores/${STORE_ID}/conversations`);
  const { store_id, ...body } = params;
  assert.deepEqual(calls[0].body, body);
  assert.deepEqual(calls[1].body, body);
  for (const removed of ["email", "language", "sending_address_id", "email_template_id"]) assert.equal(removed in calls[0].body, false, removed);
});

test("staff choose the conversation's reply email, and a reply sends its own text without a template", async (context) => {
  const answer = { conversation: { id: conversationId }, message: { id: messageId } };
  const calls = recordFetch(context, (call) => call.path.endsWith("/reply-email") ? { id: conversationId } : answer);
  const api = support().conversation;
  const other = { ...reply, from_name: "Returns", reply_to: { type: "address", email_address_id: returnsAddressId } };
  assert.deepEqual(await api.selectReplyEmail({ store_id: STORE_ID, conversation_id: conversationId, expected_reply: reply, reply: other }), { id: conversationId });
  await api.reply({ store_id: STORE_ID, conversation_id: conversationId, id: promptId, expected_updated_at: 6, text: "Your parcel ships today.", delivery: "email" });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/stores/${STORE_ID}/conversations/${conversationId}/reply-email`, { expected_reply: reply, reply: other }],
    ["POST", `/v1/stores/${STORE_ID}/conversations/${conversationId}/messages`, { id: promptId, expected_updated_at: 6, text: "Your parcel ships today.", delivery: "email" }],
  ]);
  assert.equal("expected_updated_at" in calls[0].body, false);
  assert.equal("selectSendingAddress" in api, false);
});

test("staff show or hide a received email in the chat with the message version they read", async (context) => {
  const message = { id: messageId, store_id: STORE_ID, conversation_id: conversationId, sequence: 3, type: { type: "received_email", visible_in_chat: true }, created_at: 1, updated_at: 7 };
  const calls = recordFetch(context, () => message);
  const api = support().conversation;
  assert.deepEqual(await api.changeChatVisibility({ store_id: STORE_ID, conversation_id: conversationId, message_id: messageId, expected_updated_at: 6, visible_in_chat: true }), message);
  await api.changeChatVisibility({ store_id: STORE_ID, conversation_id: conversationId, message_id: "message/one", expected_updated_at: 7, visible_in_chat: false });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/stores/${STORE_ID}/conversations/${conversationId}/messages/${messageId}/chat-visibility`, { expected_updated_at: 6, visible_in_chat: true }],
    ["POST", `/v1/stores/${STORE_ID}/conversations/${conversationId}/messages/message%2Fone/chat-visibility`, { expected_updated_at: 7, visible_in_chat: false }],
  ]);
  await assert.rejects(async () => api.changeChatVisibility({ store_id: STORE_ID, conversation_id: conversationId, message_id: messageId, expected_updated_at: 7 }), {
    name: "TypeError",
    message: "Chat visibility needs an explicit choice",
  });
  assert.equal(calls.length, 2);
});

test("the conversation inbox keeps native multi-status filters, the contact filter and its opaque continuation", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: "next:+/=" }));
  const filters = {
    store_id: STORE_ID,
    statuses: ["flow", "waiting_for_team"],
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
    state: { type: "waiting_for_team", flow: null },
    type: { type: "chat_and_email", chat_language: "bs", email: { contact, subject: "Chat follow-up", reply } },
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
  assert.deepEqual(await api.getAttachmentLink({ store_id: STORE_ID, conversation_id: conversationId, message_id: messageId, sha256: "e".repeat(64) }), { url: "https://files.example.test/a", expires_at: 9 });
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

test("support writes carry the app-picked id, the conversation version or, for an assignment, the assignee they read", async (context) => {
  const calls = recordFetch(context, (call) => call.method === "DELETE" ? { deleted: true } : { id: "record" });
  const api = support();
  const flowId = "3f8a1c62-9d4e-4b07-a5c3-8e1d6f2b9a40";
  const steps = {
    start: { type: "chat_choice", text: { en: "How can we help?" }, buttons: [{ label: { en: "Talk to a person" }, next_step_key: "contact" }] },
    contact: { type: "collect_email_contact", text: { en: "Your email?" }, subject: { en: "Chat follow-up" }, reply, next_step_key: "thanks" },
    thanks: { type: "send_email", email: { ...reply, email_template_id: "2c4e6a8c-0e1f-4b3d-9f5a-7c9e1b3d5f7a" }, next_step_key: "team" },
    team: { type: "hand_to_team" },
  };
  const entries = [
    { type: "chat", start_step_key: "start" },
    { type: "incoming_email", email_address_id: addressId, reply_language: "en", reply, start_step_key: "team" },
  ];
  await api.flow.create({ store_id: STORE_ID, id: flowId, key: "welcome", entries, steps });
  await api.flow.update({ store_id: STORE_ID, id: flowId, expected_updated_at: 3, key: "hello", entries, steps });
  await api.flow.delete({ store_id: STORE_ID, id: flowId, expected_updated_at: 4 });
  await api.conversation.resolve({ store_id: STORE_ID, conversation_id: conversationId, expected_updated_at: 7 });
  await api.conversation.assign({ store_id: STORE_ID, conversation_id: conversationId, expected_account_id: ids.account, account_id: null });
  await api.conversation.assign({ store_id: STORE_ID, conversation_id: conversationId, expected_account_id: null, account_id: ids.account });
  const base = `/v1/stores/${STORE_ID}/conversations/${conversationId}`;
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["POST", `/v1/stores/${STORE_ID}/support-flows`, {}, { id: flowId, key: "welcome", entries, steps }],
    ["PUT", `/v1/stores/${STORE_ID}/support-flows/${flowId}`, {}, { expected_updated_at: 3, key: "hello", entries, steps }],
    ["DELETE", `/v1/stores/${STORE_ID}/support-flows/${flowId}`, { expected_updated_at: "4" }, null],
    ["POST", `${base}/resolve`, {}, { expected_updated_at: 7 }],
    ["POST", `${base}/assign`, {}, { expected_account_id: ids.account, account_id: null }],
    ["POST", `${base}/assign`, {}, { expected_account_id: null, account_id: ids.account }],
  ]);
  for (const body of [calls[0].body, calls[1].body]) assert.equal("start_step_key" in body, false);
  for (const assignment of calls.slice(4)) assert.equal("expected_updated_at" in assignment.body, false);
  await assert.rejects(async () => api.flow.create({ store_id: STORE_ID, id: "welcome", key: "welcome", entries, steps }), TypeError);
  assert.equal(calls.length, 6);
});

test("an account reply is one write of the app-picked message id, its text and its delivery", async (context) => {
  const answer = { conversation: { id: conversationId }, message: { id: messageId } };
  const calls = recordFetch(context, () => answer);
  const admin = createAdmin({ apiUrl: apiUrl, secretKey: "arky_api_support" });
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

test("storefront support starts with an app-picked id and uses its real customer session", async (context) => {
  const started = { conversation: storefrontConversation(), messages: [] };
  const calls = recordFetch(context, (call) => call.method === "POST" ? started : storefrontConversation());
  const client = storefront();
  assert.deepEqual(await client.support.conversation.start({ id: conversationId, language: "bs" }), started);
  await client.support.conversation.start({ id: conversationId, language: "en", flow_key: "returns" });
  const read = await client.support.conversation.get({ id: conversationId });
  assert.deepEqual(read, storefrontConversation());
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", "/v1/storefront/conversations", { id: conversationId, language: "bs" }],
    ["POST", "/v1/storefront/conversations", { id: conversationId, language: "en", flow_key: "returns" }],
    ["GET", `/v1/storefront/conversations/${conversationId}`, null],
  ]);
  assert.equal(calls[2].headers.get("x-arky-support-token"), null);
  assert.equal(calls[2].headers.get("authorization"), `Bearer ${visitorToken}`);
  assert.equal(calls[2].query.support_token, undefined);
  assert.equal(calls[0].headers.get("x-arky-support-token"), null);
  assert.equal(calls[0].headers.get("x-arky-locale"), "bs");
  await assert.rejects(client.support.conversation.start({ id: "chat-1", language: "bs" }), TypeError);
  assert.equal(calls.length, 3);
  for (const removed of ["startConversation", "getConversation", "sendMessage", "getMessage"]) assert.equal(removed in client.support, false, removed);
});

test("a storefront chat message is one write with the app-picked id, the input and the answered prompt, and returns the flow's reply", async (context) => {
  const flowReply = {
    conversation: storefrontConversation("flow"),
    messages: [
      { id: messageId, conversation_id: conversationId, sequence: 2, type: { type: "customer_chat", text: "Talk to a person" }, created_at: 2, updated_at: 2 },
      { id: "flow-reply", conversation_id: conversationId, sequence: 3, type: { type: "flow_email_contact", text: "Your email?" }, created_at: 2, updated_at: 2 },
    ],
  };
  const calls = recordFetch(context, (call) => call.method === "POST" ? flowReply : call.path.endsWith("/messages") ? { items: flowReply.messages, cursor: null } : flowReply.messages[1]);
  const client = storefront().support.conversation;
  assert.deepEqual(await client.sendMessage({ conversation_id: conversationId, id: messageId, input: { type: "button", label: "Talk to a person" }, prompt_message_id: promptId }), flowReply);
  await client.sendMessage({ conversation_id: conversationId, id: promptId, input: { type: "email_contact", contact } });
  assert.deepEqual(await client.findMessages({ conversation_id: conversationId, limit: 20, cursor: "older" }), { items: flowReply.messages, cursor: null });
  assert.deepEqual(await client.getMessage({ conversation_id: conversationId, message_id: "flow-reply" }), flowReply.messages[1]);
  const base = `/v1/storefront/conversations/${conversationId}`;
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["POST", `${base}/messages`, {}, { id: messageId, input: { type: "button", label: "Talk to a person" }, prompt_message_id: promptId }],
    ["POST", `${base}/messages`, {}, { id: promptId, input: { type: "email_contact", contact } }],
    ["GET", `${base}/messages`, { limit: "20", cursor: "older" }, null],
    ["GET", `${base}/messages/flow-reply`, {}, null],
  ]);
  for (const call of calls) {
    assert.equal(call.headers.get("x-arky-support-token"), null);
    assert.equal(call.headers.get("authorization"), `Bearer ${visitorToken}`);
  }
});

test("support uses the actual customer session and refuses a noncanonical message id before any request", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: null }));
  const client = storefront().support.conversation;
  await client.findMessages({ conversation_id: conversationId, limit: 20, cursor: "older" });
  assert.equal(calls[0].path, `/v1/storefront/conversations/${conversationId}/messages`);
  assert.deepEqual(calls[0].query, { limit: "20", cursor: "older" });
  assert.equal(calls[0].headers.get("x-arky-support-token"), null);
  assert.equal(calls[0].headers.get("authorization"), `Bearer ${visitorToken}`);
  await assert.rejects(client.sendMessage({ conversation_id: conversationId, id: "message-1", input: { type: "text", text: "x" } }), {
    name: "TypeError",
    message: "The conversation message id must be a canonical UUID v4 picked by the app",
  });
  assert.equal(calls.length, 1);
});
