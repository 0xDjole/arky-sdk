import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { recordFetch } from "./helpers/arky-fixtures.mjs";

const baseUrl = "https://api.example.test";
const storeId = "6b0e4a28-9d73-4c15-a8f2-3e7c1d5b9a64";
const fulfillmentId = "8a3d5f17-1000-4b29-9e61-0c4f7a2d8b35";
const splitJobId = "4c7e2a91-5d38-4b06-a1f9-8e3c6b0d2a57";
const revision = 1_700_000_000_000;

function eshop() {
  return createAdmin({ apiUrl: baseUrl, secretKey: "contract-token" }).eshop;
}

test("warehouse slot resolution carries exact job positions and returns the selected physical units", async (context) => {
  const lines = [{ fulfillment_job_line_id: "line", unit_spans: [{ first_unit: 2, quantity: 1 }] }];
  const slots = {
    fulfillment_job_id: "work/id",
    store_location_id: "location",
    updated_at: revision,
    slots: [{ fulfillment_job_line_id: "line", fulfillment_unit_index: 2, inventory_item_id: "item", inventory_item_key: "camera", inventory_unit: null }],
  };
  const calls = recordFetch(context, () => slots);
  assert.deepEqual(await eshop().fulfillmentJob.getUnitSlots({ store_id: storeId, fulfillment_job_id: "work/id", expected_updated_at: revision, lines }), slots);
  assert.deepEqual(calls.map(({ href, method, body }) => ({ href, method, body })), [
    { href: `${baseUrl}/v1/stores/${storeId}/fulfillment-jobs/work%2Fid/unit-slots`, method: "POST", body: { expected_updated_at: revision, lines } },
  ]);
});

test("a fulfillment is prepared under the app-picked id with exact unit selections and lot references", async (context) => {
  const lines = [{ fulfillment_job_line_id: "line", unit_spans: [{ first_unit: 3, quantity: 1 }], selected_units: [{ fulfillment_unit_index: 3, inventory_unit_id: "physical-unit" }], lot_reference: "lot-batch-42" }];
  const request = { id: fulfillmentId, fulfillment_job_id: "work", lines };
  const before = structuredClone(request);
  const reply = { id: fulfillmentId, lines, type: { type: "delivery", trackings: [], status: { type: "preparing" } } };
  const calls = recordFetch(context, () => reply);
  assert.deepEqual(await eshop().fulfillment.create({ ...request, store_id: storeId }), reply);
  assert.deepEqual(request, before);
  assert.deepEqual(calls.map(({ href, method, body }) => ({ href, method, body })), [
    { href: `${baseUrl}/v1/stores/${storeId}/fulfillments`, method: "POST", body: request },
  ]);
  await assert.rejects(async () => eshop().fulfillment.create(request), TypeError);
  await assert.rejects(async () => eshop().fulfillment.create({ ...request, store_id: storeId, id: "fulfillment-1" }), {
    name: "TypeError",
    message: "The fulfillment id must be a canonical UUID v4 picked by the app",
  });
  assert.equal(calls.length, 1);
});

test("a fulfillment command carries the loaded version and the command with its notification choice, tracking lists and lot references", async (context) => {
  const calls = recordFetch(context, () => ({ id: fulfillmentId }));
  const api = eshop().fulfillment;
  assert.deepEqual(Object.keys(api).sort(), ["create", "execute", "find", "get", "markDelivered", "updateTracking"]);
  for (const removed of ["shipment", "pickup", "shippingLabel", "shippingLabelRefund", "merchantDebit", "merchantDebitReversal", "invoice"]) {
    assert.equal(removed in eshop(), false, removed);
  }
  const tracking = { carrier: "Courier", number: "TRACK-42", url: "https://tracking.example.test/42" };
  const commands = [
    { type: "ready", notify_customer: false },
    { type: "ready", notify_customer: true },
    { type: "cancel" },
    { type: "fulfill", timing: { type: "on_time" }, notify_customer: true, trackings: [tracking], lot_references: [{ fulfillment_job_line_id: "line", lot_reference: "batch-42" }] },
    { type: "fulfill", timing: { type: "late", reason: "Customer agreed to a later collection" }, notify_customer: false, trackings: [], lot_references: [] },
    { type: "fulfill", timing: { type: "on_time" }, notify_customer: true },
  ];
  for (const command of commands) {
    const request = { store_id: storeId, fulfillment_id: "fulfillment/id", expected_updated_at: revision, command };
    const before = structuredClone(request);
    await api.execute(request);
    assert.deepEqual(request, before);
    assert.deepEqual(calls.at(-1).body, { expected_updated_at: revision, command });
    assert.equal(calls.at(-1).method, "POST");
    assert.equal(calls.at(-1).href, `${baseUrl}/v1/stores/${storeId}/fulfillments/fulfillment%2Fid/execute`);
    for (const moved of ["action", "notify_customer", "trackings", "lot_references"]) assert.equal(moved in calls.at(-1).body, false, moved);
  }
  assert.equal("trackings" in calls.at(-1).body.command, false);
  assert.equal("lot_references" in calls.at(-1).body.command, false);
  assert.equal(calls.length, commands.length);
});

test("tracking changes and delivery confirmation carry the loaded version", async (context) => {
  const tracking = { carrier: "Courier", number: "TRACK-42", url: null };
  const delivered_at = revision + 1000;
  const calls = recordFetch(context, () => ({ id: fulfillmentId }));
  await eshop().fulfillment.updateTracking({ store_id: storeId, fulfillment_id: "fulfillment/id", expected_updated_at: revision, trackings: [tracking] });
  await eshop().fulfillment.updateTracking({ store_id: storeId, fulfillment_id: "fulfillment/id", expected_updated_at: revision + 1, trackings: [] });
  await eshop().fulfillment.markDelivered({ store_id: storeId, fulfillment_id: "fulfillment/id", expected_updated_at: revision + 1, delivered_at, notify_customer: true });
  assert.deepEqual(calls.map(({ href, method, body }) => ({ href, method, body })), [
    { href: `${baseUrl}/v1/stores/${storeId}/fulfillments/fulfillment%2Fid/tracking`, method: "POST", body: { expected_updated_at: revision, trackings: [tracking] } },
    { href: `${baseUrl}/v1/stores/${storeId}/fulfillments/fulfillment%2Fid/tracking`, method: "POST", body: { expected_updated_at: revision + 1, trackings: [] } },
    { href: `${baseUrl}/v1/stores/${storeId}/fulfillments/fulfillment%2Fid/delivered`, method: "POST", body: { expected_updated_at: revision + 1, delivered_at, notify_customer: true } },
  ]);
});

test("warehouse job commands carry the job version and the exact command, and a split brings its app-picked job id", async (context) => {
  const calls = recordFetch(context, () => ({ id: "work/id" }));
  const api = eshop().fulfillmentJob;
  const lines = [{ fulfillment_job_line_id: "line", unit_spans: [{ first_unit: 2, quantity: 3 }] }];
  const commands = [
    { type: "move", to_store_location_id: "destination" },
    { type: "split", fulfillment_job_id: splitJobId, to_store_location_id: "destination", lines },
    { type: "hand_back", note: "Staff will fulfill" },
    { type: "hold", note: "Awaiting customer confirmation" },
    { type: "release_hold", hold_id: "hold/id" },
  ];
  for (const command of commands) {
    const request = { store_id: storeId, fulfillment_job_id: "work/id", expected_updated_at: revision, command };
    const before = structuredClone(request);
    await api.execute(request);
    assert.deepEqual(request, before);
    assert.deepEqual(calls.at(-1).body, { expected_updated_at: revision, command });
    assert.equal(calls.at(-1).method, "POST");
    assert.equal(calls.at(-1).href, `${baseUrl}/v1/stores/${storeId}/fulfillment-jobs/work%2Fid/execute`);
  }
  await assert.rejects(async () => api.execute({ store_id: storeId, fulfillment_job_id: "work/id", expected_updated_at: revision, command: { ...commands[1], fulfillment_job_id: "split-1" } }), {
    name: "TypeError",
    message: "The fulfillment job id must be a canonical UUID v4 picked by the app",
  });
  assert.equal(calls.length, commands.length);
  assert.deepEqual(Object.keys(api).sort(), ["execute", "find", "findItems", "get", "getPickupCash", "getUnitSlots", "recordPickupCash"]);
  assert.equal("decide" in api, false);
  for (const removed of ["fulfillmentOrder", "fulfillmentPartner", "fulfillmentRoutingPolicy"]) assert.equal(removed in eshop(), false, removed);
});

test("a pickup clerk records the collected cash on the job with both versions and the app-picked collection id", async (context) => {
  const collectionId = "2d6f9b14-3a57-4c80-b1e2-7f4a8c0d5e93";
  const paymentId = "9e4c1a72-5b38-4d06-8f2a-6c1e3b7d0a45";
  const payment = { id: paymentId, status: "paid" };
  const calls = recordFetch(context, () => payment);
  const api = eshop().fulfillmentJob;
  const request = {
    store_id: storeId,
    fulfillment_job_id: "work/id",
    id: collectionId,
    payment_id: paymentId,
    expected_job_updated_at: revision,
    expected_payment_updated_at: revision + 5,
    money: { amount: 4200, currency: "eur" },
    reference: null,
  };
  const before = structuredClone(request);
  assert.deepEqual(await api.recordPickupCash(request), payment);
  await api.recordPickupCash({ ...request, reference: "Till 2" });
  assert.deepEqual(request, before);
  assert.deepEqual(calls.map(({ href, method, body }) => ({ href, method, body })), [
    {
      href: `${baseUrl}/v1/stores/${storeId}/fulfillment-jobs/work%2Fid/cash-collections`,
      method: "POST",
      body: { id: collectionId, payment_id: paymentId, expected_job_updated_at: revision, expected_payment_updated_at: revision + 5, money: { amount: 4200, currency: "eur" }, reference: null },
    },
    {
      href: `${baseUrl}/v1/stores/${storeId}/fulfillment-jobs/work%2Fid/cash-collections`,
      method: "POST",
      body: { id: collectionId, payment_id: paymentId, expected_job_updated_at: revision, expected_payment_updated_at: revision + 5, money: { amount: 4200, currency: "eur" }, reference: "Till 2" },
    },
  ]);
  await assert.rejects(async () => api.recordPickupCash({ ...request, id: "cash-1" }), {
    name: "TypeError",
    message: "The collection id must be a canonical UUID v4 picked by the app",
  });
  assert.equal(calls.length, 2);
});

test("a pickup clerk reads the cash a pickup still owes from the job, or nothing", async (context) => {
  const due = { payment_id: "9e4c1a72-5b38-4d06-8f2a-6c1e3b7d0a45", payment_updated_at: revision + 5, due: { amount: 4200, currency: "eur" } };
  const replies = [due, null];
  const calls = recordFetch(context, () => replies.shift());
  const api = eshop().fulfillmentJob;
  const request = { store_id: storeId, fulfillment_job_id: "work/id" };
  const before = structuredClone(request);
  assert.deepEqual(await api.getPickupCash(request), due);
  assert.equal(await api.getPickupCash(request), null);
  assert.deepEqual(request, before);
  assert.deepEqual(calls.map(({ href, method }) => ({ href, method })), [
    { href: `${baseUrl}/v1/stores/${storeId}/fulfillment-jobs/work%2Fid/cash-collections`, method: "GET" },
    { href: `${baseUrl}/v1/stores/${storeId}/fulfillment-jobs/work%2Fid/cash-collections`, method: "GET" },
  ]);
  assert.ok(calls.every((call) => call.body === null));
  await assert.rejects(async () => api.getPickupCash({ fulfillment_job_id: "work/id" }), TypeError);
  assert.equal(calls.length, 2);
});

test("a job read gives the Order contact and buyer as the Server derives them, with no recipient", async (context) => {
  const contact = {
    email: null,
    first_name: "Ana",
    last_name: null,
    phone: "+38761000000",
    buyer: { type: "company_location", company_id: "company", company_name: "Buyer Ltd", company_location_id: "location", company_location_name: "Depot" },
  };
  const job = { id: "work", store_id: storeId, type: { type: "order_delivery", order_id: "order", order_delivery_group_id: "group", timing: { type: "asap" }, lines: [] }, method: { type: "pickup", store_location_id: "location" }, holds: [], contact, status: "open", created_at: revision, updated_at: revision };
  recordFetch(context, () => job);
  const read = await eshop().fulfillmentJob.get({ store_id: storeId, fulfillment_job_id: "work" });
  assert.deepEqual(read.contact, contact);
  assert.equal("recipient" in read, false);
});

test("warehouse discovery sends the complete job filter and leaves the continuation to the caller", async (context) => {
  const response = { items: [], cursor: "next:/+=" };
  const calls = recordFetch(context, (call) => call.path.endsWith("/items") ? [] : response);
  const query = { store_id: storeId, order_id: "order", rental_id: "rental", store_location_id: "warehouse", hold: "out_of_stock", inventory_item_id: "stock-item", status: "scheduled", scheduled_from: revision, scheduled_to: revision + 86_400_000, sort_field: "scheduled_at", sort_direction: "asc", limit: 20, cursor: "" };
  assert.deepEqual(await eshop().fulfillmentJob.find(query), response);
  await eshop().fulfillmentJob.get({ store_id: storeId, fulfillment_job_id: "work/id" });
  assert.deepEqual(await eshop().fulfillmentJob.findItems({ store_id: storeId, fulfillment_job_id: "work/id" }), { items: [], cursor: null });
  const { store_id: _store, ...filters } = query;
  assert.equal(calls[0].path, `/v1/stores/${storeId}/fulfillment-jobs`);
  assert.deepEqual(calls[0].query, Object.fromEntries(Object.entries(filters).map(([key, value]) => [key, String(value)])));
  assert.deepEqual(calls.slice(1).map((call) => [call.method, call.path]), [
    ["GET", `/v1/stores/${storeId}/fulfillment-jobs/work%2Fid`],
    ["GET", `/v1/stores/${storeId}/fulfillment-jobs/work%2Fid/items`],
  ]);
});

test("fulfillment routing reads and replaces the store's one routing record", async (context) => {
  const rule = {
    id: "3c9e1a57-2b84-4d60-9f13-7a5c0e2d8b46",
    key: "domestic",
    conditions: [{ type: "markets", market_ids: ["market"] }, { type: "zones", zone_ids: ["zone"] }],
    target: { location_ids: ["warehouse-a", "warehouse-b"], assign: { type: "automatic", pick: { type: "most_stock" }, split: { type: "when_needed" } } },
    status: { type: "active" },
  };
  const otherwise = { location_ids: [], assign: { type: "manual" } };
  const routing = { id: "routing", store_id: storeId, rules: [rule], otherwise, created_at: revision, updated_at: revision + 1 };
  const calls = recordFetch(context, () => routing);
  assert.deepEqual(await eshop().fulfillmentRouting.get({ store_id: storeId }), routing);
  assert.deepEqual(await eshop().fulfillmentRouting.update({ store_id: storeId, expected_updated_at: revision, rules: [rule], otherwise }), routing);
  assert.deepEqual(calls.map(({ href, method, body }) => ({ href, method, body })), [
    { href: `${baseUrl}/v1/stores/${storeId}/fulfillment-routing`, method: "GET", body: null },
    { href: `${baseUrl}/v1/stores/${storeId}/fulfillment-routing`, method: "PUT", body: { expected_updated_at: revision, rules: [rule], otherwise } },
  ]);
  await assert.rejects(async () => eshop().fulfillmentRouting.get({ store_id: "store" }), TypeError);
  assert.deepEqual(Object.keys(eshop().fulfillmentRouting).sort(), ["get", "update"]);
});
