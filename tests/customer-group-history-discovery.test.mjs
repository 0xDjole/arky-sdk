import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

test("subscription transport keeps combined filters, empty pages and explicit history identity", async (context) => {
  const store = "56c82765-4f5a-47e9-bd6d-dba7c6354919";
  const subscriptionId = "d397ff50-690b-4da7-9fb9-17740e535d69";
  const cursor = "opaque:/+==next";
  const current = { subscription: { id: subscriptionId, status: { type: "blocked", cause: { type: "period_missed" }, blocked_at: 1 } }, revision: { id: "r" }, terms: {}, head_revision_id: "r" };
  const replies = [{ items: [], cursor }, { items: [{ id: subscriptionId }], cursor: null }, { items: [], cursor }, current, { items: [], cursor: null }];
  const calls = [];
  context.mock.method(globalThis, "fetch", async (input, init = {}) => {
    calls.push({ url: new URL(input), method: init.method ?? "GET", body: init.body ? JSON.parse(init.body) : null });
    return new Response(JSON.stringify(replies.shift()), { status: 200, headers: { "content-type": "application/json" } });
  });
  const api = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop;
  const subscriptions = { store_id: store, customer_id: "customer", company_id: "company", order_id: "order", status: "paused", subscription_plan_id: "plan", subscription_offering_id: "offering", sort_field: "updated_at", sort_direction: "desc", limit: 20 };
  assert.deepEqual(await api.subscription.find(subscriptions), { items: [], cursor });
  assert.equal(calls.length, 1);
  await api.subscription.find({ ...subscriptions, cursor });
  assert.deepEqual(await api.subscription.findOrders({ store_id: store, id: subscriptionId, cursor, limit: 20 }), { items: [], cursor });
  assert.deepEqual(await api.subscription.current({ store_id: store, id: subscriptionId }), current);
  assert.deepEqual(await api.subscription.revisions({ store_id: store, id: subscriptionId, limit: 5 }), { items: [], cursor: null });
  const { store_id: _store, ...query } = subscriptions;
  assert.deepEqual(Object.fromEntries(calls[1].url.searchParams), { ...Object.fromEntries(Object.entries(query).map(([key, value]) => [key, String(value)])), cursor });
  assert.equal(calls[2].url.pathname, `/v1/stores/${store}/subscriptions/${subscriptionId}/orders`);
  assert.deepEqual(Object.fromEntries(calls[2].url.searchParams), { cursor, limit: "20" });
  assert.equal(calls[3].url.pathname, `/v1/stores/${store}/subscriptions/${subscriptionId}/current`);
  assert.equal(calls[4].url.pathname, `/v1/stores/${store}/subscriptions/${subscriptionId}/revisions`);
  assert.deepEqual(Object.fromEntries(calls[4].url.searchParams), { limit: "5" });
  assert.equal(calls.length, 5);
  assert.ok(calls.every((call) => call.method === "GET" && call.url.pathname.startsWith(`/v1/stores/${store}/`)));
  assert.equal("customerGroupEmailConsent" in api, false);
});
