import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";
import { apiUrl, ids, publishableKey, recordFetch, visitorStorage, visitorToken } from "./helpers/arky-fixtures.mjs";

const STORE_ID = "6c1e9a47-2b58-4d93-8f0a-3e7b5d2c9f14";
const OTHER_STORE_ID = "d4a8f2c6-9e13-4b75-a06d-1c5e8b3f7a29";
const rentalId = "0b5e3a7c-2d48-4d1f-9a2e-6c8b4f0d3e57";
const jobId = "7f3c1a85-4e29-4b60-a1d7-9c2e5b8f0a36";
const jobLineId = "2d8e4b61-9a37-4c05-8f1e-6b3d0a7c5e92";
const fulfillmentId = "9a1c5e37-6b28-4d40-b3f9-1e7d2c8a4b65";

function eshop() {
  return createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop;
}

test("rental discovery forwards its filters, keeps the empty continuation and reads the rented terms", async (context) => {
  const detail = { rental: { id: rentalId, status: { type: "active" } }, terms: { product_id: ids.product, variant_id: ids.variant, quantity: 1, inventory_item_id: "machine", product_key: "espresso", variant_sku: null } };
  const calls = recordFetch(context, (_call, count) => count <= 2 ? { items: [], cursor: count === 1 ? "next:/+=" : null } : detail);
  const api = eshop().rental;
  const query = { store_id: STORE_ID, customer_group_member_id: ids.customerGroupMember, status: "ending", limit: 20, sort_field: "updated_at", sort_direction: "desc" };
  assert.deepEqual(await api.find(query), { items: [], cursor: "next:/+=" });
  assert.deepEqual(await api.find({ ...query, cursor: "next:/+=" }), { items: [], cursor: null });
  assert.deepEqual(await api.get({ store_id: OTHER_STORE_ID, id: "rental/id" }), detail);
  assert.deepEqual(calls.map((call) => [call.method, call.path]), [
    ["GET", `/v1/stores/${STORE_ID}/rentals`],
    ["GET", `/v1/stores/${STORE_ID}/rentals`],
    ["GET", `/v1/stores/${OTHER_STORE_ID}/rentals/rental%2Fid`],
  ]);
  assert.deepEqual(calls[0].query, { customer_group_member_id: ids.customerGroupMember, status: "ending", limit: "20", sort_field: "updated_at", sort_direction: "desc" });
  assert.equal(calls[1].query.cursor, "next:/+=");
  assert.equal(calls[2].url.search, "");
  assert.deepEqual(Object.keys(api).sort(), ["execute", "find", "get"]);
  await assert.rejects(async () => api.get({ id: "rental/id" }), TypeError);
  assert.equal(calls.length, 3);
});

test("rental actions send the loaded version and the typed action, and a replacement brings its app-picked job ids", async (context) => {
  const calls = recordFetch(context, () => ({ id: rentalId, status: { type: "active" } }));
  const api = eshop().rental;
  const actions = [
    {
      type: "request_replacement",
      fulfillment_job_id: jobId,
      fulfillment_job_line_id: jobLineId,
      replacement: { predecessor_inventory_unit_id: "unit", predecessor_fulfillment_job_line_id: "delivered-line", predecessor_fulfillment_unit_index: 0, overlap_authorized: false },
      store_location_id: "location",
      method: { type: "delivery", destination: { name: null, company: null, street1: "Hauptstrasse 1", street2: null, city: "Berlin", state: null, postal_code: "10115", country: "DE", phone: null, email: null } },
    },
    { type: "end", reason: "Customer ended the agreement", return_due_at: null },
    { type: "end", reason: "Agreed collection date", return_due_at: 1_700_000_100_000 },
    { type: "close" },
    { type: "cancel_issue", fulfillment_job_id: jobId, fulfillment_job_line_id: jobLineId },
  ];
  for (const action of actions) {
    const request = { store_id: STORE_ID, id: rentalId, expected_updated_at: 1_700_000_000_000, action };
    const before = structuredClone(request);
    await api.execute(request);
    assert.deepEqual(request, before);
    assert.deepEqual(calls.at(-1).body, { expected_updated_at: 1_700_000_000_000, type: action });
  }
  assert.equal(calls.length, actions.length);
  assert.ok(calls.every((call) => call.method === "POST" && call.path === `/v1/stores/${STORE_ID}/rentals/${rentalId}/commands` && call.url.search === ""));
  const invented = { ...actions[0], fulfillment_job_id: "work" };
  await assert.rejects(async () => api.execute({ store_id: STORE_ID, id: rentalId, expected_updated_at: 1, action: invented }), {
    name: "TypeError",
    message: "The fulfillment job id must be a canonical UUID v4 picked by the app",
  });
  await assert.rejects(async () => api.execute({ store_id: STORE_ID, id: rentalId, expected_updated_at: 1, action: { ...actions[0], fulfillment_job_line_id: "line" } }), {
    name: "TypeError",
    message: "The fulfillment job line id must be a canonical UUID v4 picked by the app",
  });
  assert.equal(calls.length, actions.length);
});

test("rental physical work uses fulfillment and job routes with exact unit selections", async (context) => {
  const calls = recordFetch(context, () => ({ id: fulfillmentId }));
  const api = eshop();
  const lines = [{ fulfillment_job_line_id: jobLineId, unit_spans: [{ first_unit: 0, quantity: 1 }], selected_units: [{ fulfillment_unit_index: 0, inventory_unit_id: "unit" }], lot_reference: null }];
  const slots = lines.map(({ fulfillment_job_line_id, unit_spans }) => ({ fulfillment_job_line_id, unit_spans }));
  await api.fulfillment.create({ store_id: STORE_ID, id: fulfillmentId, fulfillment_job_id: jobId, lines });
  await api.fulfillment.find({ store_id: STORE_ID, fulfillment_job_id: jobId, limit: 5 });
  await api.fulfillment.find({ store_id: STORE_ID, rental_id: rentalId });
  await api.fulfillmentJob.find({ store_id: STORE_ID, rental_id: rentalId });
  await api.fulfillmentJob.unitSlots({ store_id: STORE_ID, fulfillment_job_id: jobId, expected_updated_at: 1_700_000_000_000, lines: slots });
  assert.deepEqual(calls.map((call) => [call.method, call.path + call.url.search]), [
    ["POST", `/v1/stores/${STORE_ID}/fulfillments`],
    ["GET", `/v1/stores/${STORE_ID}/fulfillments?fulfillment_job_id=${jobId}&limit=5`],
    ["GET", `/v1/stores/${STORE_ID}/fulfillments?rental_id=${rentalId}`],
    ["GET", `/v1/stores/${STORE_ID}/fulfillment-jobs?rental_id=${rentalId}`],
    ["POST", `/v1/stores/${STORE_ID}/fulfillment-jobs/${jobId}/unit-slots`],
  ]);
  assert.deepEqual(calls[0].body, { id: fulfillmentId, fulfillment_job_id: jobId, lines });
  assert.deepEqual(calls[4].body, { expected_updated_at: 1_700_000_000_000, lines: slots });
  await assert.rejects(async () => api.fulfillment.create({ store_id: STORE_ID, id: "fulfillment", fulfillment_job_id: jobId, lines }), TypeError);
  assert.equal(calls.length, 5);
});

test("a buyer reads their own rentals of one customer group member through storefront routes", async (context) => {
  const calls = recordFetch(context, (call) => call.path === "/v1/storefront/rentals" ? { items: [], cursor: null } : { id: rentalId });
  const rentals = createStorefront(publishableKey, { apiUrl, sessionStorage: visitorStorage() }).eshop.rental;
  await rentals.find({ customer_group_member_id: ids.customerGroupMember, limit: 10 });
  await rentals.get({ rental_id: rentalId });
  assert.deepEqual(calls.map(({ method, path, query }) => [method, path, query]), [
    ["GET", "/v1/storefront/rentals", { customer_group_member_id: ids.customerGroupMember, limit: "10" }],
    ["GET", `/v1/storefront/rentals/${rentalId}`, {}],
  ]);
  for (const call of calls) assert.equal(call.headers.get("authorization"), `Bearer ${visitorToken}`);
});
