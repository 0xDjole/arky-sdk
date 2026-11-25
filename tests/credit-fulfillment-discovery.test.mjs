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
    pathname: `/v1/stores/${selectedStoreId}/credits`, scope: { order_id: orderId },
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
    const admin = createAdmin({ apiUrl: "https://api.example.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
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
  const admin = createAdmin({ apiUrl: "https://api.example.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  await admin.eshop.order.credit.find({ store_id: selectedStoreId, sort_field: "updated_at", sort_direction: "desc", limit: 10 });
  const create = {
    id: creditId,
    reason: "Damaged in transit",
    targets: [
      { target: { type: "delivery", delivery_group_id: "4d2b8f61-9c37-4a05-b1e8-6f3a0c7d5e92" }, amount: { type: "part", subtotal_reduction: 500 } },
      { target: { type: "product", line_item_id: "8e1c5a93-2d47-4b06-9f3a-6e0b4d8c2a71", span: { first_unit: 0, quantity: 1 } }, amount: { type: "remaining" } },
    ],
    fiscal_device_id: "2d7f9b14-6c38-4a05-9e21-8b4c0f6a3d57",
  };
  await admin.eshop.order.credit.create({ store_id: selectedStoreId, order_id: orderId, ...create });
  await admin.eshop.order.credit.get({ store_id: selectedStoreId, order_id: orderId, credit_id: creditId });
  await admin.eshop.order.credit.void({ store_id: selectedStoreId, order_id: orderId, credit_id: creditId, expected_updated_at: 5, reason: "Credit entered by mistake" });
  assert.deepEqual(calls.map(({ method, url, body }) => [method, url.pathname, url.search, body]), [
    ["GET", `/v1/stores/${selectedStoreId}/credits`, "?sort_field=updated_at&sort_direction=desc&limit=10", null],
    ["POST", `/v1/stores/${selectedStoreId}/orders/${orderId}/credits`, "", create],
    ["GET", `/v1/stores/${selectedStoreId}/orders/${orderId}/credits/${creditId}`, "", null],
    ["POST", `/v1/stores/${selectedStoreId}/orders/${orderId}/credits/${creditId}/void`, "", { expected_updated_at: 5, reason: "Credit entered by mistake" }],
  ]);
  assert.deepEqual(calls[1].body.targets[0], { target: { type: "delivery", delivery_group_id: "4d2b8f61-9c37-4a05-b1e8-6f3a0c7d5e92" }, amount: { type: "part", subtotal_reduction: 500 } });
  assert.deepEqual(calls[1].body.targets[1].amount, { type: "remaining" });
  await admin.eshop.order.credit.create({ store_id: selectedStoreId, order_id: orderId, id: creditId, reason: "Goodwill", targets: [], fiscal_device_id: null });
  assert.deepEqual(calls[4].body, { id: creditId, reason: "Goodwill", targets: [], fiscal_device_id: null });
  await assert.rejects(async () => admin.eshop.order.credit.create({ store_id: selectedStoreId, order_id: orderId, ...create, id: "credit-1" }), TypeError);
  assert.equal(calls.length, 5);
  assert.equal("orderCredit" in admin.eshop, false);
});

test("the staff order read carries the money left to credit and refund, as the credit and refund writes count it", async (context) => {
  const lineId = "8e1c5a93-2d47-4b06-9f3a-6e0b4d8c2a71";
  const allocationId = "1f3b5d7e-9a2c-4e6a-8b0d-2c4e6a8b0d1f";
  const shown = {
    type: "shown",
    credit_left: [{ target: { type: "product", line_item_id: lineId, span: { first_unit: 0, quantity: 2 } }, subtotal: 100, total: 100 }],
    refund_allocation_maximums: [{ order_credit_id: creditId, order_credit_allocation_id: allocationId, target: { type: "product", line_item_id: lineId, span: { first_unit: 2, quantity: 1 } }, maximum: 100 }],
  };
  const answers = [{ id: orderId, money_left: shown }, { id: orderId, money_left: { type: "not_shown" } }];
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method ?? "GET" });
    return new Response(JSON.stringify(answers[calls.length - 1]), { status: 200, headers: { "content-type": "application/json" } });
  });
  const admin = createAdmin({ apiUrl: "https://api.example.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  assert.deepEqual((await admin.eshop.order.get({ store_id: selectedStoreId, id: orderId })).money_left, shown);
  assert.deepEqual((await admin.eshop.order.get({ store_id: selectedStoreId, id: orderId })).money_left, { type: "not_shown" });
  assert.deepEqual(calls.map(({ method, url }) => [method, url.pathname, url.search]), [
    ["GET", `/v1/stores/${selectedStoreId}/orders/${orderId}`, ""],
    ["GET", `/v1/stores/${selectedStoreId}/orders/${orderId}`, ""],
  ]);
});
