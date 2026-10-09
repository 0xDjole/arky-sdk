import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";
import { apiUrl, ids, publishableKey, recordFetch, visitorStorage, visitorToken } from "./helpers/arky-fixtures.mjs";

const STORE_ID = "7d4b2e90-5c16-4a83-bf07-3e9a1c6d8f25";
const conversationId = "7c2e9a41-5b3d-4f86-a1e0-3d4c2b9f6e18";

function support() {
  return createAdmin({ baseUrl: "https://support-contract.test", apiToken: "arky_api_support" }).support;
}

test("the support inbox keeps native multi-status filters and its opaque continuation", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: "next:+/=" }));
  const filters = {
    store_id: STORE_ID,
    statuses: ["flow", "ai", "escalated"],
    channel_id: "channel",
    channel_type: "chat",
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
    assert.equal(call.path, `/v1/stores/${STORE_ID}/support/conversations`);
    assert.equal("status" in call.query, false);
    assert.equal("store_id" in call.query, false);
    assert.deepEqual(JSON.parse(call.query.statuses), filters.statuses);
    for (const [key, value] of Object.entries(filters).filter(([key]) => key !== "statuses" && key !== "store_id")) {
      assert.equal(call.query[key], String(value), key);
    }
  }
  assert.equal(calls[1].query.cursor, "next:+/=");
  for (const removed of ["findConversations", "findAgents", "getConversation", "getConversationMessage", "sendConversationMessage"]) {
    assert.equal(removed in support(), false, removed);
  }
});

test("support flows and channels send their filters before paging", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: "next:+/=" }));
  const api = support();
  const owners = [
    [api.flow.find, "support-flows", { store_id: STORE_ID, key: "welcome", query: "Bravo", sort_field: "updated_at", sort_direction: "asc", limit: 1 }],
    [api.channel.find, "support/channels", { store_id: STORE_ID, status: "active", type: "email", query: "Bravo", sort_field: "updated_at", sort_direction: "asc", limit: 1 }],
  ];
  for (const [find, route, params] of owners) {
    const first = await find(params);
    await find({ ...params, cursor: first.cursor });
    const [initial, continued] = calls.slice(-2);
    assert.equal(initial.path, `/v1/stores/${STORE_ID}/${route}`);
    assert.equal("store_id" in initial.query, false);
    for (const [key, value] of Object.entries(params).filter(([key]) => key !== "store_id")) {
      assert.equal(initial.query[key], String(value), key);
      assert.equal(continued.query[key], String(value), key);
    }
    assert.equal(continued.query.cursor, "next:+/=");
  }
  assert.equal(calls.length, 4);
  assert.ok(calls.every((call) => call.method === "GET" && call.body === null));
});

test("support history keeps the empty-page continuation, exact message reads and attachment links", async (context) => {
  const conversation = { id: conversationId, store_id: STORE_ID, status: { type: "escalated" } };
  const message = {
    id: "message",
    store_id: STORE_ID,
    conversation_id: conversationId,
    type: { type: "customer_chat", text: "Help", ai_reply: { type: "maybe_answered" } },
    created_at: 0,
    updated_at: 2,
  };
  const calls = recordFetch(context, (_call, count) => count === 1
    ? { conversation, messages: [], messages_cursor: "older:+/=" }
    : count === 2 ? { conversation, messages: [message], messages_cursor: null }
    : count === 3 ? message : { url: "https://files.example.test/a", expires_at: 9 });
  const api = support().conversation;
  const first = await api.get({ store_id: STORE_ID, conversation_id: conversationId, message_limit: 1 });
  assert.deepEqual(first.messages, []);
  assert.equal(first.messages_cursor, "older:+/=");
  const second = await api.get({ store_id: STORE_ID, conversation_id: conversationId, message_limit: 1, message_cursor: first.messages_cursor });
  assert.deepEqual(second, { conversation, messages: [message], messages_cursor: null });
  assert.deepEqual(await api.getMessage({ store_id: STORE_ID, conversation_id: conversationId, message_id: "message" }), message);
  await api.attachmentLink({ store_id: STORE_ID, conversation_id: conversationId, message_id: "message", sha256: "e".repeat(64) });
  assert.equal(calls.length, 4);
  assert.ok(calls.every((call) => call.method === "GET" && call.body === null));
  assert.deepEqual(calls[1].query, { message_limit: "1", message_cursor: first.messages_cursor });
  assert.equal(calls[0].path, `/v1/stores/${STORE_ID}/support/conversations/${conversationId}`);
  assert.equal(calls[2].path, `/v1/stores/${STORE_ID}/support/conversations/${conversationId}/messages/message`);
  assert.equal(calls[2].url.search, "");
  assert.equal(calls[3].path, `/v1/stores/${STORE_ID}/support/conversations/${conversationId}/messages/message/attachments/${"e".repeat(64)}`);
});

test("support writes carry the app-picked id or the conversation version", async (context) => {
  const calls = recordFetch(context, (call) => call.method === "DELETE" ? { deleted: true } : { id: "record" });
  const api = support();
  const flowId = "3f8a1c62-9d4e-4b07-a5c3-8e1d6f2b9a40";
  const channelId = "5b2d7e94-1c63-4a08-9f5e-2d7c0b4a6e81";
  const steps = { start: { type: "human_handoff", text: { en: "A person will answer" } } };
  await api.flow.create({ store_id: STORE_ID, id: flowId, key: "welcome", start_step_key: "start", steps });
  await api.flow.update({ store_id: STORE_ID, id: flowId, expected_updated_at: 3, start_step_key: "start", steps });
  await api.flow.delete({ store_id: STORE_ID, id: flowId, expected_updated_at: 4 });
  await api.channel.create({ store_id: STORE_ID, id: channelId, key: "chat", type: { type: "chat", start: { type: "flow", flow_id: flowId } }, status: { type: "active" } });
  await api.channel.update({ store_id: STORE_ID, id: channelId, expected_updated_at: 5, status: { type: "disabled" } });
  await api.channel.delete({ store_id: STORE_ID, id: channelId, expected_updated_at: 6 });
  await api.conversation.resolve({ store_id: STORE_ID, conversation_id: conversationId, expected_updated_at: 7 });
  await api.conversation.assign({ store_id: STORE_ID, conversation_id: conversationId, expected_updated_at: 8, account_id: null });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["POST", `/v1/stores/${STORE_ID}/support-flows`, {}, { id: flowId, key: "welcome", start_step_key: "start", steps }],
    ["PUT", `/v1/stores/${STORE_ID}/support-flows/${flowId}`, {}, { expected_updated_at: 3, start_step_key: "start", steps }],
    ["DELETE", `/v1/stores/${STORE_ID}/support-flows/${flowId}`, { expected_updated_at: "4" }, null],
    ["POST", `/v1/stores/${STORE_ID}/support/channels`, {}, { id: channelId, key: "chat", type: { type: "chat", start: { type: "flow", flow_id: flowId } }, status: { type: "active" } }],
    ["PUT", `/v1/stores/${STORE_ID}/support/channels/${channelId}`, {}, { expected_updated_at: 5, status: { type: "disabled" } }],
    ["DELETE", `/v1/stores/${STORE_ID}/support/channels/${channelId}`, { expected_updated_at: "6" }, null],
    ["POST", `/v1/stores/${STORE_ID}/support/conversations/${conversationId}/resolve`, {}, { expected_updated_at: 7 }],
    ["POST", `/v1/stores/${STORE_ID}/support/conversations/${conversationId}/assign`, {}, { expected_updated_at: 8, account_id: null }],
  ]);
  await assert.rejects(async () => api.flow.create({ store_id: STORE_ID, id: "welcome", key: "welcome", start_step_key: "start", steps }), TypeError);
  await assert.rejects(async () => api.channel.create({ store_id: STORE_ID, id: "chat", key: "chat", type: { type: "chat", start: { type: "inbox" } }, status: { type: "active" } }), TypeError);
  assert.equal(calls.length, 8);
});

test("storefront support starts with an app-picked id and explicit language, and sends its token only in the header", async (context) => {
  const supportToken = "b".repeat(64);
  const calls = recordFetch(context, (call) => call.method === "POST"
    ? { conversation: { id: conversationId }, messages: [], messages_cursor: null, support_token: supportToken }
    : { conversation: { id: conversationId }, messages: [], messages_cursor: "older:+/=" });
  const client = createStorefront(publishableKey, { apiUrl, locale: "bs", sessionStorage: visitorStorage() });
  const started = await client.support.startConversation({ id: conversationId, channel_key: "chat", language: "bs" });
  assert.equal(started.support_token, supportToken);
  const result = await client.support.getConversation({ conversation_id: conversationId, support_token: started.support_token, message_limit: 0, message_cursor: "older:+/=" });
  assert.equal(result.messages_cursor, "older:+/=");
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", "/v1/storefront/support/conversations", { id: conversationId, channel_key: "chat", language: "bs" }],
    ["GET", `/v1/storefront/support/conversations/${conversationId}`, null],
  ]);
  const read = calls[1];
  assert.equal(read.headers.get("x-arky-support-token"), supportToken);
  assert.equal(read.headers.get("authorization"), `Bearer ${visitorToken}`);
  assert.deepEqual(read.query, { message_limit: "0", message_cursor: "older:+/=" });
  assert.equal(read.href.includes(supportToken), false);
  assert.equal(calls[0].headers.get("x-arky-support-token"), null);
  await assert.rejects(client.support.startConversation({ id: "chat-1", channel_key: "chat", language: "bs" }), TypeError);
  assert.equal(calls.length, 2);
});
