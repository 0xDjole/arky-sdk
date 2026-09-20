import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

test("consent and subscription transport preserves combined filters, empty pages and explicit history identity", async () => {
  const original = globalThis.fetch;
  const store = "56c82765-4f5a-47e9-bd6d-dba7c6354919";
  const cursor = "opaque:/+==next";
  const self = { id: "subscription", status: { type: "blocked" } };
  const replies = [{ items: [], cursor }, { items: [{ id: "subscription" }], cursor: null }, { items: [], cursor }, { items: [], cursor: null }, { items: [], cursor }, self, true, false];
  const calls = [];
  globalThis.fetch = async (input, init = {}) => {
    calls.push({ url: new URL(input), method: init.method ?? "GET", body: init.body ? JSON.parse(init.body) : null });
    return new Response(JSON.stringify(replies.shift()), { status: 200, headers: { "content-type": "application/json" } });
  };
  try {
    const api = createAdmin({ storeId: "other", market: "configured", baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop;
    const subscriptions = { store_id: store, customer_id: "customer", customer_group_member_id: "member", order_id: "order", status: "paused", limit: 20 };
    assert.deepEqual(await api.customerGroupSubscription.find(subscriptions), { items: [], cursor });
    assert.equal(calls.length, 1);
    await api.customerGroupSubscription.find({ ...subscriptions, cursor });
    const consents = { store_id: store, customer_group_id: "group", customer_id: "customer", email_identity_id: "identity", status: "unsubscribed", limit: 20 };
    assert.deepEqual(await api.customerGroupEmailConsent.find(consents), { items: [], cursor });
    await api.customerGroupEmailConsent.find({ ...consents, cursor });
    assert.deepEqual(await api.customerGroupSubscription.findOrders({ store_id: store, id: "selected", cursor, limit: 20 }), { items: [], cursor });
    assert.deepEqual(await api.customerGroupSubscription.current({ store_id: store, id: "selected" }), self);
    assert.equal(await api.customerGroupEmailConsent.confirm({ store_id: store, token: "confirm-capability" }), true);
    assert.equal(await api.customerGroupEmailConsent.unsubscribe({ store_id: store, token: "unsubscribe-capability" }), false);
    assert.deepEqual(Object.fromEntries(calls[1].url.searchParams), { customer_id: "customer", customer_group_member_id: "member", order_id: "order", status: "paused", limit: "20", cursor });
    assert.deepEqual(Object.fromEntries(calls[3].url.searchParams), { customer_group_id: "group", customer_id: "customer", email_identity_id: "identity", status: "unsubscribed", limit: "20", cursor });
    assert.equal(calls[4].url.pathname, `/v1/stores/${store}/customer-group-subscriptions/selected/orders`);
    assert.equal(calls[5].url.pathname, `/v1/stores/${store}/customer-group-subscriptions/selected/current`);
    assert.deepEqual(calls[6].body, { token: "confirm-capability" });
    assert.deepEqual(calls[7].body, { token: "unsubscribe-capability" });
    assert.equal(calls.length, 8);
    assert.ok(calls.every(call => call.url.pathname.startsWith(`/v1/stores/${store}/`)));
  } finally { globalThis.fetch = original; }
});
