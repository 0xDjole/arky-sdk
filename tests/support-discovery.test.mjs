import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";
import { storefrontSessionStorage } from "./helpers/storefront-session-storage.mjs";

test("Support conversation filters retain a single native multi-status continuation", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    return new Response(JSON.stringify({ items: [], cursor: "next:+/=" }), { headers: { "content-type": "application/json" } });
  });
  const support = createAdmin({ baseUrl: "https://support-contract.test", storeId: "store" }).support;
  const filters = { store_id: "store", statuses: ["active", "ai_mode", "escalated"], agent_id: "agent", channel_id: "channel",
    customer_id: "customer", assigned_account_id: "account", channel_type: "web", query: "web",
    sort_field: "created_at", sort_direction: "asc", limit: 0 };
  const first = await support.findConversations(filters);
  assert.deepEqual(first.items, []);
  await support.findConversations({ ...filters, cursor: first.cursor });
  assert.equal(calls.length, 2);
  for (const call of calls) {
    assert.equal(call.method, "GET");
    assert.equal(call.body, undefined);
    assert.equal(call.url.pathname, "/v1/stores/store/support/conversations");
    assert.equal(call.url.searchParams.has("status"), false);
    assert.deepEqual(JSON.parse(call.url.searchParams.get("statuses")), filters.statuses);
    for (const [key, value] of Object.entries(filters).filter(([key]) => key !== "statuses")) {
      assert.equal(call.url.searchParams.get(key), String(value));
    }
  }
  assert.equal(calls[1].url.searchParams.get("cursor"), "next:+/=");
});

test("Support definition discovery sends text and ordering before paging", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    return new Response(JSON.stringify({ items: [], cursor: "next:+/=" }), { headers: { "content-type": "application/json" } });
  });
  const support = createAdmin({ baseUrl: "https://support-contract.test", storeId: "store" }).support;
  const filters = { store_id: "store", query: "Bravo", status: "active", sort_field: "updated_at", sort_direction: "asc", limit: 1 };
  for (const [method, owner] of [[support.findAgents, "agents"], [support.findChannels, "channels"]]) {
    const params = owner === "channels" ? { ...filters, channel_type: "web" } : filters;
    const first = await method(params);
    await method({ ...params, cursor: first.cursor });
    const [initial, continued] = calls.slice(-2);
    assert.equal(initial.url.pathname, `/v1/stores/store/support/${owner}`);
    for (const [key, value] of Object.entries(params)) {
      assert.equal(initial.url.searchParams.get(key), String(value));
      assert.equal(continued.url.searchParams.get(key), String(value));
    }
    assert.equal(continued.url.searchParams.get("cursor"), "next:+/=");
  }
  assert.equal(calls.length, 4);
  assert.ok(calls.every((call) => call.method === "GET" && call.body === undefined));
});

test("Support history retains empty-page continuation and exact tagged message state", async (context) => {
  const calls = [];
  const conversation = { id: "conversation", store_id: "store", status: { type: "escalated" } };
  const message = {
    id: "message", store_id: "store", conversation_id: "conversation", role: "user",
    content: "Help", buttons: null, attachments: [], metadata: {},
    ai_response_status: { type: "unknown", completed_at: 2, error: "Outcome unknown" },
    email_status: null, created_at: 0, updated_at: 2,
  };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    const value = calls.length === 1 ? { conversation, messages: [], messages_cursor: "older:+/=" }
      : calls.length === 2 ? { conversation, messages: [message], messages_cursor: null } : message;
    return new Response(JSON.stringify(value), { headers: { "content-type": "application/json" } });
  });
  const support = createAdmin({ baseUrl: "https://support-contract.test", storeId: "store" }).support;
  const first = await support.getConversation({ store_id: "store", conversation_id: "conversation", message_limit: 1 });
  assert.deepEqual(first.messages, []);
  assert.equal(first.messages_cursor, "older:+/=");
  const second = await support.getConversation({ store_id: "store", conversation_id: "conversation", message_limit: 1, message_cursor: first.messages_cursor });
  assert.deepEqual(second, { conversation, messages: [message], messages_cursor: null });
  assert.deepEqual(await support.getConversationMessage({ store_id: "store", conversation_id: "conversation", message_id: "message" }), message);
  assert.equal(calls.length, 3);
  assert.ok(calls.every((call) => call.method === "GET" && call.body === undefined));
  assert.equal(calls[1].url.searchParams.get("message_cursor"), first.messages_cursor);
  assert.equal(calls[1].url.searchParams.get("message_limit"), "1");
  assert.equal(calls[1].url.searchParams.has("after_created_at"), false);
  assert.equal(calls[1].url.searchParams.has("after_id"), false);
  assert.equal(calls[2].url.pathname, "/v1/stores/store/support/conversations/conversation/messages/message");
  assert.equal(calls[2].url.search, "");
});

test("Storefront history sends its capability only in the header and does not default an invalid zero limit", async (context) => {
  const calls = [];
  const token = "b".repeat(64);
  const visitorToken = `customer_visitor_${"s".repeat(64)}`;
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), headers: new Headers(init.headers), method: init.method, body: init.body });
    return new Response(JSON.stringify({ conversation: { id: "conversation", status: { type: "active" } }, messages: [], messages_cursor: "older:+/=" }), { headers: { "content-type": "application/json" } });
  });
  const storefront = createStorefront(`arky_pk_${"s".repeat(43)}`, {
    apiUrl: "https://support-contract.test",
    sessionStorage: storefrontSessionStorage(JSON.stringify({
      version: 2,
      customer: { id: "customer", status: { type: "active" }, primary_email_identity_id: null, classifications: [], created_at: 0, updated_at: 0 },
      session: { id: "session", customer_id: "customer", type: "visitor", status: { type: "active" }, token: visitorToken, expires_at: 4_102_444_800_000 },
    })),
  });
  const result = await storefront.support.getConversation({ conversation_id: "conversation", support_token: token, message_limit: 0, message_cursor: "older:+/=" });
  assert.equal(result.messages_cursor, "older:+/=");
  assert.equal(calls.length, 1);
  const [call] = calls;
  assert.equal(call.method, "GET");
  assert.equal(call.body, undefined);
  assert.equal(call.headers.get("X-Arky-Support-Token"), token);
  assert.equal(call.headers.get("Authorization"), `Bearer ${visitorToken}`);
  assert.equal(call.url.pathname, "/v1/storefront/support/conversations/conversation");
  assert.equal(call.url.searchParams.get("message_limit"), "0");
  assert.equal(call.url.searchParams.get("message_cursor"), "older:+/=");
  assert.equal(call.url.href.includes(token), false);
  assert.equal(call.url.searchParams.has("support_token"), false);
});
