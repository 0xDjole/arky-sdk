import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { errorResponse, recordFetch } from "./helpers/arky-fixtures.mjs";

const STORE_ID = "c9e3a5f1-7b26-4d80-9a4e-1f6b8d2c0e75";
const OTHER_STORE_ID = "5a1f8d3c-e642-4b97-8c05-9e2b7a4d1f63";
const actionId = (index) => `3f8a2c61-${String(1000 + index)}-4e7b-9d05-2c6e8a1f4b39`;
const levelId = "8b2e6d14-3c97-4a05-b1f8-7e4c2a9d6f30";

function eshop() {
  return createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_inventory_contract" }).eshop;
}

test("inventory levels keep combined parent filters, ordering and empty-page continuations", async (context) => {
  const responses = [
    { items: [], cursor: "next-projected-page" },
    { items: [{ id: "level", on_hand: 10, reserved: 12, unavailable: 2, available: -4 }], cursor: null },
  ];
  const calls = recordFetch(context, () => responses.shift());
  const query = { store_id: STORE_ID, inventory_item_id: "component", store_location_id: "warehouse", sort_field: "updated_at", sort_direction: "desc", limit: 25 };
  const first = await eshop().inventoryLevel.find(query);
  assert.deepEqual(first, { items: [], cursor: "next-projected-page" });
  assert.equal(calls.length, 1);
  const second = await eshop().inventoryLevel.find({ ...query, cursor: first.cursor });
  assert.deepEqual(second.items[0].available, -4);
  for (const call of calls) {
    assert.equal(call.method, "GET");
    assert.equal(call.path, `/v1/stores/${STORE_ID}/inventory-levels`);
    assert.equal(call.query.inventory_item_id, "component");
    assert.equal(call.query.store_location_id, "warehouse");
    assert.equal(call.query.sort_field, "updated_at");
    assert.equal(call.query.sort_direction, "desc");
    assert.equal(call.query.limit, "25");
    assert.equal("store_id" in call.query, false);
  }
  assert.equal(calls[1].query.cursor, first.cursor);
});

test("an inventory index failure stays an error rather than zero stock", async (context) => {
  recordFetch(context, () => errorResponse(503, "GENERAL.UNAVAILABLE", "Search unavailable"));
  await assert.rejects(eshop().inventoryLevel.find({ store_id: STORE_ID, inventory_item_id: "component" }), (error) => error.statusCode === 503);
});

test("inventory history keeps combined filters, empty continuations and exact quantity changes", async (context) => {
  const record = { id: "movement", inventory_item_id: "item", tracking: { type: "individual", inventory_unit_id: "unit" }, store_location_id: "location", delta: -1, after: 7, reason: { type: "dispatched", fulfillment_job_id: "work", fulfillment_id: "fulfillment" }, action_id: actionId(1) };
  const responses = [{ items: [], cursor: "movement-next" }, { items: [record], cursor: null }];
  const calls = recordFetch(context, () => responses.shift());
  const query = { inventory_item_id: "item", store_location_id: "location", inventory_unit_id: "unit", action_id: actionId(1), limit: 10, sort_field: "created_at", sort_direction: "desc" };
  assert.deepEqual(await eshop().inventoryMovement.find({ store_id: STORE_ID, ...query }), { items: [], cursor: "movement-next" });
  assert.equal(calls.length, 1);
  assert.deepEqual(await eshop().inventoryMovement.find({ store_id: STORE_ID, ...query, cursor: "movement-next" }), { items: [record], cursor: null });
  for (const call of calls) {
    assert.equal(call.path, `/v1/stores/${STORE_ID}/inventory-movements`);
    assert.equal("store_id" in call.query, false);
    for (const [key, value] of Object.entries(query)) assert.equal(call.query[key], String(value), key);
  }
  assert.equal(calls[1].query.cursor, "movement-next");
  assert.equal("inventoryReservation" in eshop(), false);
});

test("stock reads keep unavailable and negative available quantities with the item's identity", async (context) => {
  const record = { id: "level", inventory_item_id: "item", store_location_id: "location", on_hand: 2, reserved: 5, unavailable: 1, available: -4, item: { key: "milk", sku: null, tracking: { type: "tracked" } } };
  const calls = recordFetch(context, () => ({ items: [record], cursor: null }));
  const query = { store_id: OTHER_STORE_ID, inventory_item_id: "item", store_location_id: "location", limit: 5, cursor: "" };
  assert.deepEqual(await eshop().inventoryLevel.stock(query), { items: [record], cursor: null });
  assert.equal(calls[0].path, `/v1/stores/${OTHER_STORE_ID}/inventory-levels/stock`);
  assert.deepEqual(calls[0].query, { inventory_item_id: "item", store_location_id: "location", limit: "5", cursor: "" });
});

test("stock commands carry the app-picked action id, the level version and the exact incoming stock", async (context) => {
  const record = { id: levelId, on_hand: 10, reserved: 2, unavailable: 3, available: 5 };
  const calls = recordFetch(context, () => record);
  const api = eshop().inventoryLevel;
  const cases = [
    ["setAside", "set-aside", { quantity: 3, note: "Awaiting inspection" }],
    ["makeAvailable", "make-available", { quantity: 2, note: "Inspection passed" }],
    ["move", "move", { to_store_location_id: "destination", quantity: 4 }],
    ["receiveMove", "incoming", { type: { type: "counted", from_store_location_id: "origin", quantity: 4 } }],
    ["receiveMove", "incoming", { type: { type: "unit", asset_tag: "MACHINE-42" } }],
  ];
  for (const [index, [method, path, payload]] of cases.entries()) {
    const body = { action_id: actionId(index), expected_updated_at: 1_700_000_000_000, ...payload };
    const request = { store_id: OTHER_STORE_ID, id: levelId, ...body };
    const before = structuredClone(request);
    assert.deepEqual(await api[method](request), record);
    assert.deepEqual(request, before);
    assert.deepEqual(calls.at(-1), { ...calls.at(-1), href: `https://api.example.test/v1/stores/${OTHER_STORE_ID}/inventory-levels/${levelId}/${path}`, method: "POST", body });
    await assert.rejects(async () => api[method]({ ...request, action_id: `command-${index}` }), {
      name: "TypeError",
      message: "The action id must be a canonical UUID v4 picked by the app",
    });
  }
  assert.equal(calls.length, cases.length);
});

test("levels are created under an app-picked id and removed with their version", async (context) => {
  const calls = recordFetch(context, (call) => call.method === "DELETE" ? undefined : { id: levelId });
  const api = eshop().inventoryLevel;
  await api.create({ store_id: STORE_ID, id: levelId, inventory_item_id: "item", store_location_id: "warehouse" });
  await api.get({ store_id: STORE_ID, id: levelId });
  assert.equal(await api.remove({ store_id: STORE_ID, id: levelId, expected_updated_at: 9 }), undefined);
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["POST", `/v1/stores/${STORE_ID}/inventory-levels`, {}, { id: levelId, inventory_item_id: "item", store_location_id: "warehouse" }],
    ["GET", `/v1/stores/${STORE_ID}/inventory-levels/${levelId}`, {}, null],
    ["DELETE", `/v1/stores/${STORE_ID}/inventory-levels/${levelId}`, { expected_updated_at: "9" }, null],
  ]);
  await assert.rejects(async () => api.create({ store_id: STORE_ID, id: "warehouse-item", inventory_item_id: "item", store_location_id: "warehouse" }), TypeError);
  assert.equal(calls.length, 3);
});

test("a manual stock correction names the level and version it was decided on", async (context) => {
  const calls = recordFetch(context, () => ({ id: "movement" }));
  const body = {
    inventory_item_id: "milk",
    store_location_id: "warehouse",
    action_id: actionId(7),
    expected_level_id: levelId,
    expected_level_updated_at: 1_700_000_000_000,
    delta: -2,
    from_set_aside: true,
    reason: { type: "damage", reference: "inspection-42" },
  };
  const request = { store_id: OTHER_STORE_ID, ...body };
  const before = structuredClone(request);
  await eshop().inventoryMovement.record(request);
  assert.deepEqual(request, before);
  assert.deepEqual(calls.map(({ href, method, body: sent }) => ({ href, method, body: sent })), [
    { href: `https://api.example.test/v1/stores/${OTHER_STORE_ID}/inventory-movements`, method: "POST", body },
  ]);
  await assert.rejects(async () => eshop().inventoryMovement.record({ ...request, action_id: "damage-report" }), TypeError);
  assert.equal(calls.length, 1);
});

test("inventory item search sends its text and filters, and a key read is one exact record", async (context) => {
  const record = { id: "item", key: "component", sku: "COBALT" };
  const responses = [{ items: [], cursor: "next" }, { items: [record], cursor: null }, { id: "item", key: "steel/string" }];
  const calls = recordFetch(context, () => responses.shift());
  const query = { query: "cobalt", status: "archived", tracking: "untracked", sort_field: "updated_at", sort_direction: "asc", limit: 20 };
  const first = await eshop().inventoryItem.find({ store_id: STORE_ID, ...query });
  assert.deepEqual(first, { items: [], cursor: "next" });
  assert.deepEqual(await eshop().inventoryItem.find({ store_id: STORE_ID, ...query, cursor: first.cursor }), { items: [record], cursor: null });
  for (const call of calls) {
    assert.equal(call.path, `/v1/stores/${STORE_ID}/inventory-items`);
    for (const [key, value] of Object.entries(query)) assert.equal(call.query[key], String(value), key);
  }
  assert.equal(calls[1].query.cursor, "next");
  assert.deepEqual(await eshop().inventoryItem.getByKey({ store_id: STORE_ID, key: "steel/string" }), { id: "item", key: "steel/string" });
  assert.equal(calls[2].path, `/v1/stores/${STORE_ID}/inventory-items/by-key/steel%2Fstring`);
  assert.equal(calls[2].url.search, "");
});

test("an inventory item delete answers the record while it is being removed and nothing once it is already gone", async (context) => {
  const itemId = "6b2d9f41-3a85-4c07-9e1d-5f8a2c0b7e36";
  let status = 202;
  const calls = recordFetch(context, () => status === 204 ? new Response(null, { status: 204 }) : new Response(JSON.stringify({ id: itemId, status: { type: "deleting" } }), { status: 202, headers: { "content-type": "application/json" } }));
  const api = eshop().inventoryItem;
  assert.deepEqual(await api.delete({ store_id: STORE_ID, id: itemId, expected_updated_at: 7 }), { id: itemId, status: { type: "deleting" } });
  status = 204;
  assert.equal(await api.delete({ store_id: STORE_ID, id: itemId, expected_updated_at: 7 }), undefined);
  assert.deepEqual(calls.map(({ method, path, query }) => [method, path, query]), [
    ["DELETE", `/v1/stores/${STORE_ID}/inventory-items/${itemId}`, { expected_updated_at: "7" }],
    ["DELETE", `/v1/stores/${STORE_ID}/inventory-items/${itemId}`, { expected_updated_at: "7" }],
  ]);
});
