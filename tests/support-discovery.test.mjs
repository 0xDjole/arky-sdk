import assert from "node:assert/strict";
import { File } from "node:buffer";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";
import { accessToken, apiUrl, errorResponse, fixedIdFactories, ids, signedInStorage, storefrontIdentity, recordFetch, visitorStorage, visitorToken } from "./helpers/arky-fixtures.mjs";

const STORE_ID = "7d4b2e90-5c16-4a83-bf07-3e9a1c6d8f25";
const conversationId = "7c2e9a41-5b3d-4f86-a1e0-3d4c2b9f6e18";
const messageId = "2a6d8f13-9c47-4e05-b1a8-6f3e0c2d7b95";
const promptId = "8b3e5d71-2c96-4f04-a7d1-9e2c4b6a8f30";
const addressId = "4b6d8f0a-2e3a-4b7d-9f1c-3e5a7b9d1f2a";
const templateId = "5e1a9c37-4b28-4d60-8f13-2c7a6e0b9d45";
const returnsAddressId = "8e0a2c4e-6b7d-4f9a-b1c3-5d7f9b1d3f5a";
const reply = { email_template_id: templateId, email_address_id: addressId, from_name: "Support", reply_to_address_id: addressId };
const phoneNumberId = "9d2f6b41-7a38-4c05-b1e9-3f6a8c2d5e70";
const proposalId = "6b4d8f20-1a3c-4e57-9b2d-7f0c5e3a1d86";
const contact = { email: "buyer@example.test", language: "bs" };

function support() {
  return createAdmin({ apiUrl: "https://support-contract.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" }).support;
}

function storefront() {
  return createStorefront(storefrontIdentity, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, locale: "bs", sessionStorage: visitorStorage() });
}

function storefrontConversation(state = "flow") {
  return { id: conversationId, type: { type: "chat", language: "bs" }, subject: "", state, customer_read: { type: "unread" }, created_at: 1, updated_at: 1 };
}

test("staff starts an email conversation for a contact with a reply selection and retained caller-picked IDs", async (context) => {
  const answer = {
    conversation: { id: conversationId, subject: "Delivery", state: { type: "waiting_for_store", reason: "message", flow: null }, type: { type: "email", email: { contact, reply } } },
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
  const other = { ...reply, from_name: "Returns", reply_to_address_id: returnsAddressId };
  assert.deepEqual(await api.selectReplyEmail({ store_id: STORE_ID, conversation_id: conversationId, expected_reply: reply, reply: other }), { id: conversationId });
  await api.reply({ store_id: STORE_ID, conversation_id: conversationId, id: promptId, newest_message_sequence: 6, text: "Your parcel ships today.", delivery: "email" });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/stores/${STORE_ID}/conversations/${conversationId}/reply-email`, { expected_reply: reply, reply: other }],
    ["POST", `/v1/stores/${STORE_ID}/conversations/${conversationId}/messages`, { id: promptId, newest_message_sequence: 6, text: "Your parcel ships today.", delivery: "email" }],
  ]);
  assert.equal("expected_updated_at" in calls[0].body, false);
  assert.equal("expected_updated_at" in calls[1].body, false);
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
    statuses: ["flow", "waiting_for_store"],
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
    type: { type: "chat_and_email", chat_language: "bs", email: { contact, reply } },
    subject: "Chat follow-up",
    state: { type: "waiting_for_store", reason: "message", flow: null },
    next_message_sequence: 2,
    customer_read: { type: "through", sequence: 1 },
    store_read: { type: "unread" },
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
    team: { type: "hand_to_store" },
  };
  const entries = [
    { type: "chat", start_step_key: "start" },
    { type: "incoming_email", email_address_id: addressId, reply_language: "en", reply, start_step_key: "team" },
  ];
  const assistant = { status: { type: "active" }, login: { type: "store", store_provider_id: ids.picked }, languages: ["bs"], instructions: "Book check-ups only.", actions: ["book", "move", "cancel", "confirm_attendance"], sales_channel_id: ids.channel, market_id: ids.market, package_id: ids.package };
  const phoneSteps = {
    hours: { type: "open_hours", hours: { weekly_availability: { monday: [{ from_minute: 480, to_minute: 960 }] }, date_overrides: {} }, open_step_key: "menu", closed_step_key: "closed" },
    menu: { type: "phone_menu", prompt: { type: "play", media_id: "6c1e9a47-2b58-4f03-8d6a-1e7c3b9f5a20" }, options: [{ digit: 1, next_step_key: "assistant" }], no_answer_step_key: "ring" },
    assistant: { type: "phone_assistant", assistant: { ...assistant, actions: [...assistant.actions, "record_sms_consent"] }, greeting: { bs: "Dobar dan." }, recording: { type: "keep", days: 30 }, transfer_step_key: "ring" },
    ring: { type: "phone_ring", number: "+38733000000", ring_seconds: 30, next_step_key: "closed" },
    closed: { type: "phone_say", prompt: { type: "speak", text: { bs: "Nazovite kasnije." } }, next_step_key: "team" },
    chat: { type: "chat_assistant", assistant: { ...assistant, status: { type: "paused" }, login: { type: "network", network_provider_id: ids.account } }, hand_over_step_key: "team" },
    team: { type: "hand_to_store" },
  };
  const phoneEntries = [{ type: "phone", phone_number_id: phoneNumberId, language: "bs", start_step_key: "hours" }, { type: "chat", start_step_key: "chat" }];
  await api.flow.create({ store_id: STORE_ID, id: flowId, key: "welcome", entries, steps });
  await api.flow.create({ store_id: STORE_ID, id: proposalId, key: "phone", entries: phoneEntries, steps: phoneSteps });
  await api.flow.update({ store_id: STORE_ID, id: flowId, expected_updated_at: 3, key: "hello", entries, steps });
  await api.flow.delete({ store_id: STORE_ID, id: flowId, expected_updated_at: 4 });
  await api.conversation.resolve({ store_id: STORE_ID, conversation_id: conversationId, newest_message_sequence: 7 });
  await api.conversation.resolve({ store_id: STORE_ID, conversation_id: conversationId, newest_message_sequence: null });
  await api.conversation.assign({ store_id: STORE_ID, conversation_id: conversationId, expected_account_id: ids.account, account_id: null });
  await api.conversation.assign({ store_id: STORE_ID, conversation_id: conversationId, expected_account_id: null, account_id: ids.account });
  const base = `/v1/stores/${STORE_ID}/conversations/${conversationId}`;
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["POST", `/v1/stores/${STORE_ID}/support-flows`, {}, { id: flowId, key: "welcome", entries, steps }],
    ["POST", `/v1/stores/${STORE_ID}/support-flows`, {}, { id: proposalId, key: "phone", entries: phoneEntries, steps: phoneSteps }],
    ["PUT", `/v1/stores/${STORE_ID}/support-flows/${flowId}`, {}, { expected_updated_at: 3, key: "hello", entries, steps }],
    ["DELETE", `/v1/stores/${STORE_ID}/support-flows/${flowId}`, { expected_updated_at: "4" }, null],
    ["POST", `${base}/resolve`, {}, { newest_message_sequence: 7 }],
    ["POST", `${base}/resolve`, {}, { newest_message_sequence: null }],
    ["POST", `${base}/assign`, {}, { expected_account_id: ids.account, account_id: null }],
    ["POST", `${base}/assign`, {}, { expected_account_id: null, account_id: ids.account }],
  ]);
  for (const body of [calls[0].body, calls[1].body, calls[2].body]) assert.equal("start_step_key" in body, false);
  for (const write of calls.slice(4)) assert.equal("expected_updated_at" in write.body, false);
  await assert.rejects(async () => api.flow.create({ store_id: STORE_ID, id: "welcome", key: "welcome", entries, steps }), TypeError);
  assert.equal(calls.length, 8);
});

test("an account reply is one write of the app-picked message id, its text and its delivery", async (context) => {
  const answer = { conversation: { id: conversationId }, message: { id: messageId } };
  const calls = recordFetch(context, () => answer);
  const admin = createAdmin({ apiUrl: apiUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  assert.equal("sendConversationMessage" in admin.support.conversation, false);
  assert.deepEqual(await admin.support.conversation.reply({ store_id: ids.store, conversation_id: conversationId, id: messageId, newest_message_sequence: 4, text: "I can help from here.", delivery: "chat_and_email", resolve: false }), answer);
  await admin.support.conversation.reply({ store_id: ids.store, conversation_id: conversationId, id: promptId, newest_message_sequence: null, text: "Done.", delivery: "email" });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/stores/${ids.store}/conversations/${conversationId}/messages`, { id: messageId, newest_message_sequence: 4, text: "I can help from here.", delivery: "chat_and_email", resolve: false }],
    ["POST", `/v1/stores/${ids.store}/conversations/${conversationId}/messages`, { id: promptId, newest_message_sequence: null, text: "Done.", delivery: "email" }],
  ]);
  await assert.rejects(async () => admin.support.conversation.reply({ store_id: ids.store, conversation_id: conversationId, id: "reply-1", newest_message_sequence: 4, text: "x", delivery: "chat", resolve: true }), {
    name: "TypeError",
    message: "The conversation message id must be a canonical UUID v4 picked by the app",
  });
  assert.equal(calls.length, 2);
});

test("a chat start without a valid flow key is refused before anything is sent", async (context) => {
  const calls = recordFetch(context, () => {
    throw new Error("Nothing may be sent");
  });
  const client = storefront();
  await assert.rejects(async () => client.support.conversation.start({ id: conversationId, language: "en" }), TypeError);
  await assert.rejects(async () => client.support.conversation.start({ id: conversationId, language: "en", flow_key: "Not A Key" }), TypeError);
  assert.equal(calls.length, 0);
});

test("storefront support starts with an app-picked id and uses its real customer session", async (context) => {
  const started = { conversation: storefrontConversation(), messages: [] };
  const calls = recordFetch(context, (call) => call.method === "POST" ? started : storefrontConversation());
  const client = storefront();
  assert.deepEqual(await client.support.conversation.start({ id: conversationId, language: "bs", flow_key: "default" }), started);
  await client.support.conversation.start({ id: conversationId, language: "en", flow_key: "returns" });
  const read = await client.support.conversation.get({ id: conversationId });
  assert.deepEqual(read, storefrontConversation());
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", "/v1/storefront/conversations", { id: conversationId, language: "bs", flow_key: "default", subject: "" }],
    ["POST", "/v1/storefront/conversations", { id: conversationId, language: "en", flow_key: "returns", subject: "" }],
    ["GET", `/v1/storefront/conversations/${conversationId}`, null],
  ]);
  assert.equal(calls[2].headers.get("x-arky-support-token"), null);
  assert.equal(calls[2].headers.get("authorization"), `Bearer ${visitorToken}`);
  assert.equal(calls[2].query.support_token, undefined);
  assert.equal(calls[0].headers.get("x-arky-support-token"), null);
  assert.equal(calls[0].headers.get("x-arky-locale"), "bs");
  await assert.rejects(client.support.conversation.start({ id: "chat-1", language: "bs", flow_key: "default" }), TypeError);
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
  assert.deepEqual(await client.sendMessage({ conversation_id: conversationId, id: messageId, input: { type: "button", index: 1 }, prompt_message_id: promptId }), flowReply);
  await client.sendMessage({ conversation_id: conversationId, id: promptId, input: { type: "email_contact", contact } });
  assert.deepEqual(await client.findMessages({ conversation_id: conversationId, limit: 20, cursor: "older" }), { items: flowReply.messages, cursor: null });
  assert.deepEqual(await client.getMessage({ conversation_id: conversationId, message_id: "flow-reply" }), flowReply.messages[1]);
  const base = `/v1/storefront/conversations/${conversationId}`;
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["POST", `${base}/messages`, {}, { id: messageId, input: { type: "button", index: 1 }, prompt_message_id: promptId }],
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

test("staff send an SMS and move their read mark with the newest message they read", async (context) => {
  const answer = { conversation: { id: conversationId }, message: { id: messageId } };
  const calls = recordFetch(context, (call) => call.path.endsWith("/sms") ? answer : { id: conversationId });
  const api = support().conversation;
  assert.deepEqual(await api.sendSms({ store_id: STORE_ID, conversation_id: conversationId, id: messageId, newest_message_sequence: 3, text: "See you at 10." }), answer);
  await api.sendSms({ store_id: STORE_ID, conversation_id: conversationId, id: promptId, newest_message_sequence: null, text: "Done.", resolve: true });
  await api.markRead({ store_id: STORE_ID, conversation_id: conversationId, sequence: 4 });
  await api.markUnread({ store_id: STORE_ID, conversation_id: conversationId, sequence: 2 });
  const base = `/v1/stores/${STORE_ID}/conversations/${conversationId}`;
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `${base}/sms`, { id: messageId, newest_message_sequence: 3, text: "See you at 10.", resolve: false }],
    ["POST", `${base}/sms`, { id: promptId, newest_message_sequence: null, text: "Done.", resolve: true }],
    ["POST", `${base}/read`, { sequence: 4 }],
    ["POST", `${base}/unread`, { sequence: 2 }],
  ]);
  await assert.rejects(async () => api.sendSms({ store_id: STORE_ID, conversation_id: conversationId, id: "sms-1", newest_message_sequence: 3, text: "x" }), TypeError);
  assert.equal(calls.length, 4);
});

test("calls are listed with their filters, and a call's transcript and recording are read through the call routes", async (context) => {
  const item = { call: { id: messageId, type: { type: "call" } }, customer_id: ids.customer, customer_name: "Ana Anić", waiting_callback: true };
  const link = { url: "https://recordings.example.test/call.mp3?signature=x", expires_at: 1_900_000_300_000 };
  const calls = recordFetch(context, (call) => call.path.endsWith("/calls") ? { items: [item], cursor: "next" } : call.path.endsWith("/recording") ? link : item.call);
  const api = support().call;
  assert.deepEqual(Object.keys(api).sort(), ["find", "get", "getRecordingLink"]);
  assert.deepEqual(await api.find({ store_id: STORE_ID, outcomes: ["missed", "booked"], waiting_callback: true, phone_number_id: phoneNumberId, query: "Ana", limit: 20, cursor: "page" }), { items: [item], cursor: "next" });
  await api.find({ store_id: STORE_ID });
  assert.deepEqual(await api.get({ store_id: STORE_ID, conversation_id: conversationId, message_id: messageId }), item.call);
  assert.deepEqual(await api.getRecordingLink({ store_id: STORE_ID, conversation_id: conversationId, message_id: messageId }), link);
  const messages = `/v1/stores/${STORE_ID}/conversations/${conversationId}/messages/${messageId}`;
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", `/v1/stores/${STORE_ID}/calls`, { outcomes: JSON.stringify(["missed", "booked"]), waiting_callback: "true", phone_number_id: phoneNumberId, query: "Ana", limit: "20", cursor: "page" }, null],
    ["GET", `/v1/stores/${STORE_ID}/calls`, {}, null],
    ["GET", `${messages}/call`, {}, null],
    ["GET", `${messages}/recording`, {}, null],
  ]);
});

test("a call read keeps a recording that is starting or failed and a proposal refused as not sold, as the Server sends them", async (context) => {
  const claim = { id: "4c1e8a52-7d39-4b06-9f2e-1a5d7c3b9e80", started_at: 1_900_000_000_000, deadline_at: 1_900_000_060_000, fence: 1 };
  const error = { type: "provider_rejected", message: "Call is not in-progress. Cannot start a recording.", provider_code: "21220", provider_http_status: 400, at: 1_900_000_002_000 };
  const proposal = { id: proposalId, command: { type: "cancel", order_id: ids.order, order_booking_line_item_id: ids.line }, state: { type: "refused", confirmation: { type: "spoken", caller_text: "Yes, cancel it." }, reason: "not_sold", at: 1_900_000_003_000 } };
  const starting = { id: messageId, type: { type: "call", call: { recording: { type: "starting", claim }, proposals: [proposal] } } };
  const failed = { id: messageId, type: { type: "call", call: { recording: { type: "failed", error }, proposals: [proposal] } } };
  const answers = [starting, failed];
  const calls = recordFetch(context, () => answers.shift());
  const api = support().call;
  const read = { store_id: STORE_ID, conversation_id: conversationId, message_id: messageId };
  assert.deepEqual(await api.get(read), starting);
  assert.deepEqual(await api.get(read), failed);
  assert.equal(calls.length, 2);
});

test("a storefront chat answers the assistant's proposal with a bodiless confirm or decline under the customer's session", async (context) => {
  const answered = { id: messageId, conversation_id: conversationId, sequence: 4, type: { type: "assistant_reply", text: "Booked.", proposal: { id: proposalId, command: { type: "cancel", order_id: ids.order, order_booking_line_item_id: ids.line }, state: { type: "closed", reason: "declined", at: 2 } } }, created_at: 1, updated_at: 2 };
  const calls = recordFetch(context, () => answered);
  const client = storefront().support.conversation;
  assert.deepEqual(await client.confirmProposal({ conversation_id: conversationId, message_id: messageId, proposal_id: proposalId }), answered);
  assert.deepEqual(await client.declineProposal({ conversation_id: conversationId, message_id: messageId, proposal_id: proposalId }), answered);
  const base = `/v1/storefront/conversations/${conversationId}/messages/${messageId}/proposals/${proposalId}`;
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["POST", `${base}/confirm`, {}, null],
    ["POST", `${base}/decline`, {}, null],
  ]);
  for (const call of calls) assert.equal(call.headers.get("authorization"), `Bearer ${visitorToken}`);
});

test("a storefront chat starts with its subject and moves the customer's read mark", async (context) => {
  const started = { conversation: { ...storefrontConversation(), subject: "Order 42" }, messages: [] };
  const calls = recordFetch(context, (call) => call.path.endsWith("/read") ? { ...started.conversation, customer_read: { type: "through", sequence: 3 } } : started);
  const client = storefront().support.conversation;
  assert.deepEqual(await client.start({ id: conversationId, language: "bs", flow_key: "default", subject: "Order 42" }), started);
  assert.deepEqual((await client.markRead({ conversation_id: conversationId, sequence: 3 })).customer_read, { type: "through", sequence: 3 });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", "/v1/storefront/conversations", { id: conversationId, language: "bs", flow_key: "default", subject: "Order 42" }],
    ["POST", `/v1/storefront/conversations/${conversationId}/read`, { sequence: 3 }],
  ]);
  for (const call of calls) assert.equal(call.headers.get("authorization"), `Bearer ${visitorToken}`);
});

test("a signed-in customer pages their own chats, newest message first, under their own session", async (context) => {
  const newer = { ...storefrontConversation("waiting_for_store"), newest_message_at: 9, unread: true };
  const older = { ...storefrontConversation("resolved"), id: promptId, customer_read: { type: "through", sequence: 4 }, newest_message_at: 5, unread: false };
  const calls = recordFetch(context, (_call, count) => count === 1 ? { items: [newer], cursor: "next:+/=" } : { items: [older], cursor: null });
  const client = createStorefront(storefrontIdentity, { ...fixedIdFactories, apiUrl, locale: "bs", sessionStorage: signedInStorage() }).support.conversation;
  const first = await client.find({ limit: 1 });
  assert.deepEqual(first, { items: [newer], cursor: "next:+/=" });
  assert.deepEqual(await client.find({ limit: 1, cursor: first.cursor }), { items: [older], cursor: null });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", "/v1/storefront/conversations", { limit: "1" }, null],
    ["GET", "/v1/storefront/conversations", { limit: "1", cursor: "next:+/=" }, null],
  ]);
  for (const call of calls) {
    assert.equal(call.headers.get("authorization"), `Bearer ${accessToken}`);
    for (const named of ["customer_id", "store_id", "contact", "sort_field"]) assert.equal(named in call.query, false, named);
  }
});

test("a visitor's chat list is refused with 403 and keeps the visitor's session", async (context) => {
  const calls = recordFetch(context, () => errorResponse(403, "GENERAL.FORBIDDEN", "Forbidden"));
  const client = storefront().support.conversation;
  await assert.rejects(client.find(), { statusCode: 403, code: "GENERAL.FORBIDDEN" });
  assert.deepEqual(calls.map(({ method, path, query }) => [method, path, query]), [["GET", "/v1/storefront/conversations", {}]]);
  assert.equal(calls[0].headers.get("authorization"), `Bearer ${visitorToken}`);
});

test("staff start a chat with a customer, with or without files, and a reply carries files as multipart", async (context) => {
  const answer = { conversation: { id: conversationId }, message: { id: messageId } };
  const calls = recordFetch(context, () => answer);
  const api = support().conversation;
  const start = { store_id: STORE_ID, id: conversationId, message_id: messageId, customer_id: ids.customer, language: "bs", subject: "Nalaz", text: "Nalaz je stigao." };
  assert.deepEqual(await api.startChat(start), answer);
  const scan = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], "scan.png", { type: "image/png" });
  const report = new File(["%PDF-1.4 %%EOF"], "report.pdf", { type: "application/pdf" });
  await api.startChat({ ...start, files: [scan, report] });
  await api.reply({ store_id: STORE_ID, conversation_id: conversationId, id: promptId, newest_message_sequence: 2, text: "Evo slike.", delivery: "chat", files: [scan] });
  await api.reply({ store_id: STORE_ID, conversation_id: conversationId, id: promptId, newest_message_sequence: 2, text: "Bez datoteka.", delivery: "chat", files: [] });
  assert.deepEqual(calls.map(({ method, path }) => [method, path]), [
    ["POST", `/v1/stores/${STORE_ID}/conversations/chats`],
    ["POST", `/v1/stores/${STORE_ID}/conversations/chats`],
    ["POST", `/v1/stores/${STORE_ID}/conversations/${conversationId}/messages`],
    ["POST", `/v1/stores/${STORE_ID}/conversations/${conversationId}/messages`],
  ]);
  const { store_id, ...chat } = start;
  assert.deepEqual(calls[0].body, chat);
  assert.ok(calls[1].body instanceof FormData, "a chat start with files is one multipart request");
  assert.deepEqual(JSON.parse(calls[1].body.get("chat")), chat);
  assert.deepEqual(calls[1].body.getAll("file-0").map((file) => file.name), ["scan.png"]);
  assert.deepEqual(calls[1].body.getAll("file-1").map((file) => file.name), ["report.pdf"]);
  assert.ok(calls[2].body instanceof FormData, "a reply with files is one multipart request");
  assert.deepEqual(JSON.parse(calls[2].body.get("reply")), { id: promptId, newest_message_sequence: 2, text: "Evo slike.", delivery: "chat" });
  assert.equal(calls[2].body.get("file-0").name, "scan.png");
  assert.deepEqual(calls[3].body, { id: promptId, newest_message_sequence: 2, text: "Bez datoteka.", delivery: "chat" });
  await assert.rejects(async () => api.reply({ store_id: STORE_ID, conversation_id: conversationId, id: promptId, newest_message_sequence: 2, text: "Prazno.", delivery: "chat", files: [new File([], "empty.pdf")] }), {
    name: "TypeError",
    message: "The file 'empty.pdf' is empty",
  });
  assert.equal(calls.length, 4);
});

test("staff text a customer straight into their Phone thread and reopen a resolved conversation", async (context) => {
  const calls = recordFetch(context, (call) => call.path.endsWith("/reopen") ? { id: conversationId } : { conversation: { id: conversationId }, message: { id: messageId } });
  const api = support().conversation;
  await api.sendCustomerSms({ store_id: STORE_ID, customer_id: ids.customer, id: messageId, text: "Vrijeme je za kontrolu." });
  await api.sendCustomerSms({ store_id: STORE_ID, customer_id: ids.customer, id: promptId, text: "Vidimo se.", resolve: true });
  assert.deepEqual(await api.reopen({ store_id: STORE_ID, conversation_id: conversationId, newest_message_sequence: 4 }), { id: conversationId });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/stores/${STORE_ID}/customers/${ids.customer}/sms`, { id: messageId, text: "Vrijeme je za kontrolu.", resolve: false }],
    ["POST", `/v1/stores/${STORE_ID}/customers/${ids.customer}/sms`, { id: promptId, text: "Vidimo se.", resolve: true }],
    ["POST", `/v1/stores/${STORE_ID}/conversations/${conversationId}/reopen`, { newest_message_sequence: 4 }],
  ]);
  assert.equal("newest_message_sequence" in calls[0].body, false, "a staff SMS to a customer names no message");
});

test("a customer opens a file of the store's reply through their own session", async (context) => {
  const sha256 = "a".repeat(64);
  const link = { url: "https://files.test/report.pdf", expires_at: 300_000 };
  const calls = recordFetch(context, () => link);
  const client = storefront().support.conversation;
  assert.deepEqual(await client.getAttachmentLink({ conversation_id: conversationId, message_id: messageId, sha256 }), link);
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["GET", `/v1/storefront/conversations/${conversationId}/messages/${messageId}/attachments/${sha256}`, null],
  ]);
  assert.equal(calls[0].headers.get("authorization"), `Bearer ${visitorToken}`);
});
