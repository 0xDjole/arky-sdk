import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { initialize } from "../dist/storefront.js";
import { apiUrl, ids, publishableKey, recordFetch, visitorStorage, visitorToken } from "./helpers/arky-fixtures.mjs";

const STORE_ID = "2f7b4d91-8c36-4a05-b1e9-6d3a0c8f5e27";
const OTHER_STORE_ID = "a6c1e8f4-3b92-4d57-9e0a-5f2d7b1c8e46";
const returnId = "4d7e1b39-1000-4c62-8a15-9e3f6b0d2c74";
const lineId = "8c2a6e14-5b97-4d03-a1f8-3e6c9b0d7a52";
const orderReturn = {
  type: "order",
  order_id: ids.order,
  lines: [{ id: lineId, order_product_line_item_id: ids.line, unit_spans: [{ first_unit: 1, quantity: 1 }], reason: "damaged", note: "Broken on arrival", items: [{ inventory_item_id: "item", quantity: 1 }] }],
};

function returns() {
  return createAdmin({ baseUrl: "https://api.example.test", secretKey: "arky_secret_test" }).eshop.return;
}

test("a buyer's return is created under the app-picked id and read through storefront routes only", async (context) => {
  const retained = { id: returnId, status: { type: "requested", destination: { type: "undecided" } } };
  const calls = recordFetch(context, (call) => call.method === "GET" && call.path === "/v1/storefront/returns" ? { items: [], cursor: "next" } : retained);
  const store = initialize(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, sessionStorage: visitorStorage() });
  const request = { id: returnId, type: orderReturn, destination_store_location_id: null };
  const before = structuredClone(request);
  assert.deepEqual(await store.eshop.return.create(request), retained);
  assert.deepEqual(await store.eshop.return.find({ order_id: ids.order, limit: 10, cursor: "prior" }), { items: [], cursor: "next" });
  assert.deepEqual(await store.eshop.return.get({ return_id: "return/one" }), retained);
  await store.eshop.return.orderOptions({ order_id: ids.order });
  await store.eshop.return.rentalOptions({ rental_id: "rental/one", limit: 5 });
  assert.deepEqual(request, before);
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.query]), [
    ["POST", "/v1/storefront/returns", {}],
    ["GET", "/v1/storefront/returns", { order_id: ids.order, limit: "10", cursor: "prior" }],
    ["GET", "/v1/storefront/returns/return%2Fone", {}],
    ["GET", `/v1/storefront/returns/orders/${ids.order}/options`, {}],
    ["GET", "/v1/storefront/returns/rentals/rental%2Fone/options", { limit: "5" }],
  ]);
  assert.deepEqual(calls[0].body, request);
  await assert.rejects(store.eshop.return.create({ ...request, id: "return" }), TypeError);
  assert.equal(calls.length, 5);
  assert.ok(calls.every((call) => call.headers.get("authorization") === `Bearer ${visitorToken}` && call.headers.get("x-arky-publishable-key") === publishableKey));
});

test("return discovery carries every filter and keeps the empty continuation", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: "next" }));
  const api = returns();
  const query = { store_id: STORE_ID, order_id: ids.order, rental_id: "rental", destination_store_location_id: "warehouse", status: "open", limit: 20, sort_field: "updated_at", sort_direction: "desc" };
  assert.deepEqual(await api.find(query), { items: [], cursor: "next" });
  assert.equal(calls.length, 1);
  await api.find({ ...query, cursor: "next" });
  assert.equal(calls[0].path, `/v1/stores/${STORE_ID}/returns`);
  const expected = { order_id: ids.order, rental_id: "rental", destination_store_location_id: "warehouse", status: "open", limit: "20", sort_field: "updated_at", sort_direction: "desc" };
  assert.deepEqual(calls[0].query, expected);
  assert.deepEqual(calls[1].query, { ...expected, cursor: "next" });
  assert.equal(calls.length, 2);
  assert.deepEqual(Object.keys(api).sort(), ["create", "credit", "destinationOptions", "execute", "find", "get", "inspectionUnit", "orderOptions", "rentalOptions"]);
});

test("staff returns are created under the app-picked id, and every action goes to execute with the return version", async (context) => {
  const retained = { id: returnId, trackings: [], status: { type: "requested", destination: { type: "undecided" } } };
  const calls = recordFetch(context, () => retained);
  const api = returns();
  const create = { store_id: STORE_ID, id: returnId, type: orderReturn, destination_store_location_id: "warehouse" };
  assert.deepEqual(await api.create(create), retained);
  await api.get({ store_id: OTHER_STORE_ID, return_id: "return/id" });
  const items = [{ line_id: lineId, inventory_item_id: "item", quantity: 1, inventory_unit_ids: [] }];
  const commands = [
    { type: "approve", destination_store_location_id: null, notify_customer: true },
    { type: "decide", store_location_id: "warehouse" },
    { type: "decline", reason: "Outside the return window", notify_customer: false },
    { type: "receive", items },
    { type: "dispose", items: items.map((item) => ({ ...item, disposition: { type: "not_restocked", reason: "Broken seal" } })) },
    { type: "missing", items: [{ line_id: lineId, inventory_item_id: "item", quantity: 1 }] },
    { type: "tracking", trackings: [{ carrier: "DHL", number: "123", url: null }] },
    { type: "tracking", trackings: [] },
    { type: "cancel" },
  ];
  for (const command of commands) await api.execute({ store_id: STORE_ID, return_id: returnId, expected_updated_at: 1_700_000_000_000, command });
  const { store_id: _store, ...createBody } = create;
  assert.deepEqual(calls[0].body, createBody);
  assert.equal(calls[0].path, `/v1/stores/${STORE_ID}/returns`);
  assert.equal(calls[1].path, `/v1/stores/${OTHER_STORE_ID}/returns/return%2Fid`);
  calls.slice(2).forEach((call, index) => {
    assert.equal(call.method, "POST");
    assert.equal(call.path, `/v1/stores/${STORE_ID}/returns/${returnId}/execute`);
    assert.deepEqual(call.body, { expected_updated_at: 1_700_000_000_000, command: commands[index] });
  });
  await assert.rejects(async () => api.create({ ...create, id: "return" }), {
    name: "TypeError",
    message: "The return id must be a canonical UUID v4 picked by the app",
  });
  assert.equal(calls.length, 2 + commands.length);
});

test("approving or declining a return needs an explicit customer email choice and sends it as given", async (context) => {
  const calls = recordFetch(context, () => ({ id: returnId }));
  const api = returns();
  const version = { store_id: STORE_ID, return_id: returnId, expected_updated_at: 9 };
  for (const command of [
    { type: "approve", destination_store_location_id: "warehouse" },
    { type: "decline", reason: "Outside the return window" },
    { type: "approve", destination_store_location_id: null, notify_customer: "yes" },
  ]) {
    await assert.rejects(async () => api.execute({ ...version, command }), {
      name: "TypeError",
      message: "A return approval or decline requires an explicit customer email choice",
    });
  }
  assert.equal(calls.length, 0);
  await api.execute({ ...version, command: { type: "approve", destination_store_location_id: "warehouse", notify_customer: false } });
  await api.execute({ ...version, command: { type: "decline", reason: "Seal broken", notify_customer: true } });
  assert.deepEqual(calls.map((call) => call.body.command), [
    { type: "approve", destination_store_location_id: "warehouse", notify_customer: false },
    { type: "decline", reason: "Seal broken", notify_customer: true },
  ]);
});

test("a return credit carries the app-picked credit id and the return version, and the option reads name their owner", async (context) => {
  const inspection = { store_id: STORE_ID, return_id: returnId, line_id: lineId, inventory_item_id: "item", inventory_unit_id: "unit/1" };
  const calls = recordFetch(context, (call) => call.path.endsWith("/credit") ? { id: ids.credit } : call.path.includes("/inspection-units/") ? inspection : call.path.includes("/rentals/") ? { items: [], cursor: null } : { return_id: returnId });
  const api = returns();
  await api.credit({ store_id: STORE_ID, return_id: returnId, id: ids.credit, expected_updated_at: 5 });
  await api.destinationOptions({ store_id: STORE_ID, return_id: returnId });
  assert.deepEqual(await api.inspectionUnit({ store_id: STORE_ID, return_id: returnId, inventory_unit_id: "unit/1" }), inspection);
  await api.orderOptions({ store_id: STORE_ID, order_id: ids.order });
  await api.rentalOptions({ store_id: STORE_ID, rental_id: "rental", limit: 3 });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["POST", `/v1/stores/${STORE_ID}/returns/${returnId}/credit`, {}, { id: ids.credit, expected_updated_at: 5 }],
    ["GET", `/v1/stores/${STORE_ID}/returns/${returnId}/destination-options`, {}, null],
    ["GET", `/v1/stores/${STORE_ID}/returns/${returnId}/inspection-units/unit%2F1`, {}, null],
    ["GET", `/v1/stores/${STORE_ID}/orders/${ids.order}/return-options`, {}, null],
    ["GET", `/v1/stores/${STORE_ID}/rentals/rental/return-options`, { limit: "3" }, null],
  ]);
  await assert.rejects(async () => api.credit({ store_id: STORE_ID, return_id: returnId, id: "credit", expected_updated_at: 5 }), TypeError);
  assert.equal(calls.length, 5);
});
