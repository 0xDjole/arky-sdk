import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { recordFetch } from "./helpers/arky-fixtures.mjs";

const STORE_ID = "b3f7a9c2-5e14-4d68-8a0b-2c6e9d1f4a57";
const OTHER_STORE_ID = "46e0c2d8-9b73-4f15-a2c6-8d1b5e9f3a07";
const unitId = "5c9e2a71-8d34-4b06-9f1a-3e7c0b5d2a84";
const actionId = "7c4e1a93-2d58-4b06-9f3e-5a8c0d2b6e19";

function units() {
  return createAdmin({ apiUrl: "https://api.example.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" }).eshop.inventoryUnit;
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

test("a_write_off_records_the_callers_action_id: a move and a write-off each carry the app-picked action id and the loaded version", async (context) => {
  const calls = recordFetch(context, () => ({ id: "unit/id" }));
  const api = units();
  const scope = { store_id: OTHER_STORE_ID, id: "unit/id", expected_updated_at: 1_700_000_000_000 };
  const move = { ...scope, action_id: actionId, to_store_location_id: "destination" };
  const writeOff = { ...scope, action_id: actionId, reason: "Damaged beyond repair" };
  const before = structuredClone({ move, writeOff });
  await api.move(move);
  await api.writeOff(writeOff);
  assert.deepEqual({ move, writeOff }, before);
  assert.deepEqual(calls.map(({ path, method, body }) => [path, method, body]), [
    [`/v1/stores/${OTHER_STORE_ID}/inventory-units/unit%2Fid/move`, "POST", { expected_updated_at: scope.expected_updated_at, action_id: actionId, to_store_location_id: "destination" }],
    [`/v1/stores/${OTHER_STORE_ID}/inventory-units/unit%2Fid/write-off`, "POST", { expected_updated_at: scope.expected_updated_at, action_id: actionId, reason: "Damaged beyond repair" }],
  ]);
  for (const action_id of [undefined, "move-unit", actionId.toUpperCase()]) {
    await assert.rejects(async () => api.move({ ...move, action_id }), TypeError);
    await assert.rejects(async () => api.writeOff({ ...writeOff, action_id }), TypeError);
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

test("a written-off unit names where it was lost with its ids flat, and staff find all three losses with status written_off", async (context) => {
  const actor = { account_id: "ca60db1c-68d1-42d5-8b55-8a1e04f2cb2f", snapshot: { email: "desk@example.test", credential_type: { type: "session" } } };
  const lost = { actor, reason: "Not found at count", written_off_at: 1_700_000_000_000 };
  const statuses = [
    { type: "written_off_at_warehouse", store_location_id: "location", ...lost },
    { type: "written_off_on_rental", rental_id: "rental", fulfillment_id: "fulfillment", ...lost },
    { type: "written_off_at_return", return_id: "return", store_location_id: "location", ...lost },
  ];
  const calls = recordFetch(context, () => ({ items: statuses.map((status, index) => ({ id: `unit-${index}`, status })), cursor: null }));
  const page = await units().find({ store_id: STORE_ID, status: "written_off" });
  assert.deepEqual(page.items.map(({ status }) => status), statuses);
  for (const { status } of page.items) assert.equal("source" in status, false);
  assert.deepEqual(calls.map(({ method, path, query }) => [method, path, query]), [["GET", `/v1/stores/${STORE_ID}/inventory-units`, { status: "written_off" }]]);
});
