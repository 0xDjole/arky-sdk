import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

const selectedStoreId = "74f46c74-7776-47f4-a249-a57b80af62bb";
const orderId = "030a5ec0-eccf-430c-8c0a-3a68c842de1f";
const creditId = "6a8c0e2f-4b5d-4e7a-9c1f-3e5a7c9e1b2d";
const cursor = "opaque:page/+=binding";

for (const definition of [
  {
    name: "order credits",
    find: (admin, query) => admin.eshop.order.credit.find(query), limit: 25,
    pathname: `/v1/stores/${selectedStoreId}/orders/${orderId}/credits`, scope: {},
  },
  {
    name: "fulfillment jobs",
    find: (admin, query) => admin.eshop.fulfillmentJob.find(query), limit: 100,
    pathname: `/v1/stores/${selectedStoreId}/fulfillment-jobs`, scope: { order_id: orderId },
  },
]) {
  test(`${definition.name} keep exact Order scope and empty-page continuation`, async (context) => {
    const calls = [];
    context.mock.method(globalThis, "fetch", async (url, init = {}) => {
      calls.push({ url: new URL(url), method: init.method ?? "GET" });
      return new Response(JSON.stringify({ items: [], cursor: calls.length === 1 ? cursor : null }), { status: 200, headers: { "content-type": "application/json" } });
    });
    const admin = createAdmin({ apiUrl: "https://api.example.test", secretKey: "arky_secret_test" });
    const query = { store_id: selectedStoreId, order_id: orderId };
    const first = await definition.find(admin, query);
    assert.deepEqual(first, { items: [], cursor });
    assert.equal(calls.length, 1);
    assert.deepEqual(await definition.find(admin, { ...query, limit: definition.limit, cursor: first.cursor }), { items: [], cursor: null });
    assert.equal(calls.length, 2, "Continuation is explicit, not an automatic whole-history scan");
    for (const call of calls) {
      assert.equal(call.method, "GET");
      assert.equal(call.url.pathname, definition.pathname);
    }
    assert.deepEqual(Object.fromEntries(calls[0].url.searchParams), definition.scope);
    assert.deepEqual(Object.fromEntries(calls[1].url.searchParams), { ...definition.scope, limit: String(definition.limit), cursor });
    assert.deepEqual(query, { store_id: selectedStoreId, order_id: orderId });
  });
}

test("store-wide credit history needs no order, lists by last change, and credits are created under the app's id", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method ?? "GET", body: init.body ? JSON.parse(init.body) : null });
    return new Response(JSON.stringify(init.method === "GET" ? { items: [], cursor: null } : { id: creditId }), { status: 200, headers: { "content-type": "application/json" } });
  });
  const admin = createAdmin({ apiUrl: "https://api.example.test", secretKey: "arky_secret_test" });
  await admin.eshop.order.credit.find({ store_id: selectedStoreId, sort_field: "updated_at", sort_direction: "desc", limit: 10 });
  const create = {
    id: creditId,
    reason: "Damaged in transit",
    targets: [
      { target: { type: "delivery", delivery_group_id: "4d2b8f61-9c37-4a05-b1e8-6f3a0c7d5e92" }, amount: { type: "part", subtotal_reduction: 500 } },
      { target: { type: "product", line_item_id: "8e1c5a93-2d47-4b06-9f3a-6e0b4d8c2a71", span: { first_unit: 0, quantity: 1 } }, amount: { type: "remaining" } },
    ],
  };
  await admin.eshop.order.credit.create({ store_id: selectedStoreId, order_id: orderId, ...create });
  await admin.eshop.order.credit.get({ store_id: selectedStoreId, order_id: orderId, credit_id: creditId });
  await admin.eshop.order.credit.void({ store_id: selectedStoreId, order_id: orderId, credit_id: creditId, expected_updated_at: 5 });
  assert.deepEqual(calls.map(({ method, url, body }) => [method, url.pathname, url.search, body]), [
    ["GET", `/v1/stores/${selectedStoreId}/credits`, "?sort_field=updated_at&sort_direction=desc&limit=10", null],
    ["POST", `/v1/stores/${selectedStoreId}/orders/${orderId}/credits`, "", create],
    ["GET", `/v1/stores/${selectedStoreId}/orders/${orderId}/credits/${creditId}`, "", null],
    ["POST", `/v1/stores/${selectedStoreId}/orders/${orderId}/credits/${creditId}/void`, "", { expected_updated_at: 5 }],
  ]);
  assert.deepEqual(calls[1].body.targets[0], { target: { type: "delivery", delivery_group_id: "4d2b8f61-9c37-4a05-b1e8-6f3a0c7d5e92" }, amount: { type: "part", subtotal_reduction: 500 } });
  assert.deepEqual(calls[1].body.targets[1].amount, { type: "remaining" });
  await admin.eshop.order.credit.create({ store_id: selectedStoreId, order_id: orderId, id: creditId, reason: "Goodwill", targets: [] });
  assert.deepEqual(calls[4].body, { id: creditId, reason: "Goodwill", targets: [] });
  await assert.rejects(async () => admin.eshop.order.credit.create({ store_id: selectedStoreId, order_id: orderId, ...create, id: "credit-1" }), TypeError);
  assert.equal(calls.length, 5);
  assert.equal("orderCredit" in admin.eshop, false);
});
