import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { recordFetch } from "./helpers/arky-fixtures.mjs";

const STORE_ID = "b3f7a9c2-5e14-4d68-8a0b-2c6e9d1f4a57";
const OTHER_STORE_ID = "46e0c2d8-9b73-4f15-a2c6-8d1b5e9f3a07";
const unitId = "5c9e2a71-8d34-4b06-9f1a-3e7c0b5d2a84";
const actionId = "7c4e1a93-2d58-4b06-9f3e-5a8c0d2b6e19";

function units() {
  return createAdmin({ apiUrl: "https://api.example.test", secretKey: "arky_secret_test" }).eshop.inventoryUnit;
}

test("individual stock discovery keeps the exact tag case, combined filters and the continuation", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: "next" }));
  const api = units();
  const query = { store_id: STORE_ID, inventory_item_id: "item", store_location_id: "location", rental_id: "rental", asset_tag: "Camera/A42", status: "available", limit: 20, sort_field: "updated_at", sort_direction: "desc" };
  assert.deepEqual(await api.find(query), { items: [], cursor: "next" });
  assert.equal(calls.length, 1);
  await api.find({ ...query, cursor: "next" });
  assert.equal(calls[0].path, `/v1/stores/${STORE_ID}/inventory-units`);
  assert.deepEqual(calls[0].query, { inventory_item_id: "item", store_location_id: "location", rental_id: "rental", asset_tag: "Camera/A42", status: "available", limit: "20", sort_field: "updated_at", sort_direction: "desc" });
  assert.equal(calls[1].query.cursor, "next");
  assert.equal("delete" in api, false);
  assert.equal("update" in api, false);
});

test("a unit is received under an app-picked id with the level it was counted on, then allocated and unassigned by version", async (context) => {
  const calls = recordFetch(context, () => ({ id: unitId, status: { type: "available", store_location_id: "location" } }));
  const api = units();
  const receipt = { store_id: STORE_ID, id: unitId, inventory_item_id: "item", store_location_id: "location", asset_tag: "Camera/A42", manufacturer_serial: null, expected_level_id: "level" };
  await api.receive(receipt);
  await api.get({ store_id: STORE_ID, id: unitId });
  await api.allocate({ store_id: STORE_ID, id: unitId, fulfillment_job_id: "work", fulfillment_job_line_id: "line", fulfillment_unit_index: 3, expected_updated_at: 1_700_000_000_001 });
  await api.unassign({ store_id: STORE_ID, id: unitId, expected_updated_at: 1_700_000_000_002 });
  const { store_id: _store, ...receiptBody } = receipt;
  assert.deepEqual(calls.map(({ path, method, body }) => [path, method, body]), [
    [`/v1/stores/${STORE_ID}/inventory-units`, "POST", receiptBody],
    [`/v1/stores/${STORE_ID}/inventory-units/${unitId}`, "GET", null],
    [`/v1/stores/${STORE_ID}/inventory-units/${unitId}/allocate`, "POST", { fulfillment_job_id: "work", fulfillment_job_line_id: "line", fulfillment_unit_index: 3, expected_updated_at: 1_700_000_000_001 }],
    [`/v1/stores/${STORE_ID}/inventory-units/${unitId}/unassign`, "POST", { expected_updated_at: 1_700_000_000_002 }],
  ]);
  assert.deepEqual(calls[0].body, { id: unitId, inventory_item_id: "item", store_location_id: "location", asset_tag: "Camera/A42", manufacturer_serial: null, expected_level_id: "level" });
  await assert.rejects(async () => api.receive({ ...receipt, id: "Camera/A42" }), {
    name: "TypeError",
    message: "The inventory unit id must be a canonical UUID v4 picked by the app",
  });
  assert.equal(calls.length, 4);
});

test("moving a unit carries the app-picked action id and a write-off its reason, each with the loaded version", async (context) => {
  const calls = recordFetch(context, () => ({ id: "unit/id" }));
  const api = units();
  const scope = { store_id: OTHER_STORE_ID, id: "unit/id", expected_updated_at: 1_700_000_000_000 };
  const move = { ...scope, action_id: actionId, to_store_location_id: "destination" };
  const writeOff = { ...scope, reason: "Damaged beyond repair" };
  const before = structuredClone({ move, writeOff });
  await api.move(move);
  await api.writeOff(writeOff);
  assert.deepEqual({ move, writeOff }, before);
  assert.deepEqual(calls.map(({ path, method, body }) => [path, method, body]), [
    [`/v1/stores/${OTHER_STORE_ID}/inventory-units/unit%2Fid/move`, "POST", { expected_updated_at: scope.expected_updated_at, action_id: actionId, to_store_location_id: "destination" }],
    [`/v1/stores/${OTHER_STORE_ID}/inventory-units/unit%2Fid/write-off`, "POST", { expected_updated_at: scope.expected_updated_at, reason: "Damaged beyond repair" }],
  ]);
  for (const action_id of [undefined, "move-unit", actionId.toUpperCase()]) {
    await assert.rejects(async () => api.move({ ...move, action_id }), TypeError);
  }
  assert.equal(calls.length, 2);
});

test("a physical unit is set aside and made available by exact action identity and unit version", async (context) => {
  const calls = recordFetch(context, () => ({ id: unitId, status: { type: "set_aside", store_location_id: "warehouse" } }));
  const api = units();
  const input = { store_id: STORE_ID, id: unitId, action_id: actionId, expected_updated_at: 1_700_000_000_000, note: "Awaiting service" };
  const before = structuredClone(input);
  await api.setAside(input);
  await api.makeAvailable({ ...input, expected_updated_at: input.expected_updated_at + 1 });
  assert.deepEqual(input, before);
  assert.deepEqual(calls.map(({ path, method, body }) => [path, method, body]), [
    [`/v1/stores/${STORE_ID}/inventory-units/${unitId}/set-aside`, "POST", { action_id: actionId, expected_updated_at: input.expected_updated_at, note: input.note }],
    [`/v1/stores/${STORE_ID}/inventory-units/${unitId}/make-available`, "POST", { action_id: actionId, expected_updated_at: input.expected_updated_at + 1, note: input.note }],
  ]);
  for (const action_id of [undefined, "set-aside", actionId.toUpperCase()]) {
    await assert.rejects(async () => api.setAside({ ...input, action_id }), TypeError);
    await assert.rejects(async () => api.makeAvailable({ ...input, action_id }), TypeError);
  }
  assert.equal(calls.length, 2);
  assert.equal("execution" in api, false);
});
