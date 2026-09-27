import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

const baseUrl = "https://api.example.test";
const storeId = "selected/store";
const fulfillmentId = "fulfillment/id";
const revision = 1700000000000;

async function capture(response, request) {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method, body: init.body === undefined ? undefined : JSON.parse(String(init.body)) });
    return new Response(JSON.stringify(response), { headers: { "content-type": "application/json" } });
  };
  try {
    const api = createAdmin({ baseUrl, storeId: "default", apiToken: "contract-token" });
    return { calls, result: await request(api) };
  } finally { globalThis.fetch = originalFetch; }
}

test("Warehouse slot resolution carries exact work positions and selected physical units", async () => {
  const work = "work/id";
  const lines = [{ fulfillment_order_line_id: "line", unit_spans: [{ first_unit: 2, quantity: 1 }] }];
  const slots = {
    fulfillment_order_id: work, store_location_id: "location", updated_at: revision,
    slots: [{ fulfillment_order_line_id: "line", fulfillment_unit_index: 2,
      inventory_item_id: "item", inventory_item_key: "camera", inventory_unit: null }],
  };
  const result = await capture(slots, (api) => api.eshop.fulfillmentOrder.unitSlots({
    store_id: storeId, fulfillment_order_id: work, expected_updated_at: revision, lines,
  }));
  assert.deepEqual(result.result, slots);
  assert.deepEqual(result.calls, [{
    url: `${baseUrl}/v1/stores/selected%2Fstore/fulfillment-orders/work%2Fid/unit-slots`,
    method: "POST", body: { expected_updated_at: revision, lines },
  }]);
});

test("Fulfillment preparation preserves exact selections, lot references and creation identity", async () => {
  const lines = [{ fulfillment_order_line_id: "line", unit_spans: [{ first_unit: 3, quantity: 1 }],
    selected_units: [{ fulfillment_unit_index: 3, inventory_unit_id: "physical-unit" }], lot_reference: "milk-batch-42" }];
  const request = { fulfillment_id: fulfillmentId, fulfillment_order_id: "work", lines };
  const before = structuredClone(request);
  const reply = { id: fulfillmentId, status: { type: "preparing" }, lines, tracking: null, delivered_at: null };
  const { calls, result } = await capture(reply, async (api) => {
    await api.eshop.fulfillment.create({ ...request, store_id: storeId });
    await api.eshop.fulfillment.create({ ...request, store_id: storeId });
    return api.eshop.fulfillment.create(request);
  });
  assert.deepEqual(result, reply);
  assert.deepEqual(request, before);
  assert.deepEqual(calls[0], calls[1]);
  assert.deepEqual(calls.map((call) => call.body), [request, request, request]);
  assert.deepEqual(calls.map((call) => call.url), [
    `${baseUrl}/v1/stores/selected%2Fstore/fulfillments`, `${baseUrl}/v1/stores/selected%2Fstore/fulfillments`,
    `${baseUrl}/v1/stores/default/fulfillments`,
  ]);
  assert.ok(calls.every((call) => call.method === "POST"));
});

test("Fulfillment control replays the same command, revision, tracking and lot evidence", async () => {
  const actions = [{ type: "ready" }, { type: "cancel" }, { type: "fulfill", late_reason: null },
    { type: "fulfill", late_reason: "Customer agreed to a later collection" }];
  const tracking = { carrier: "Courier", number: "TRACK-42", url: "https://tracking.example.test/42" };
  await capture({ id: fulfillmentId }, async (api) => {
    assert.deepEqual(Object.keys(api.eshop.fulfillment).sort(), ["create", "execute", "find", "get", "markDelivered", "updateTracking"]);
    for (const removed of ["shipment", "pickup", "shippingLabel", "shippingLabelRefund", "merchantDebit", "merchantDebitReversal", "invoice"]) {
      assert.equal(removed in api.eshop, false);
    }
  });
  for (const [index, action] of actions.entries()) {
    const body = { command_id: `command-${index}`, expected_updated_at: revision, action,
      ...(action.type === "fulfill" ? { tracking, lot_references: [{ fulfillment_order_line_id: "line", lot_reference: "batch-42" }] } : {}) };
    const request = { store_id: storeId, fulfillment_id: fulfillmentId, ...body };
    const before = structuredClone(request);
    const reply = { id: fulfillmentId, status: action.type === "fulfill"
      ? { type: "fulfilled", execution: { command_id: body.command_id } } : { type: action.type === "cancel" ? "cancelled" : "ready" } };
    const { calls, result } = await capture(reply, async (api) => {
      const first = await api.eshop.fulfillment.execute(request);
      const replayed = await api.eshop.fulfillment.execute(request);
      assert.deepEqual(replayed, first);
      return replayed;
    });
    assert.deepEqual(request, before);
    assert.deepEqual(result, reply);
    assert.deepEqual(calls, [0, 1].map(() => ({
      url: `${baseUrl}/v1/stores/selected%2Fstore/fulfillments/fulfillment%2Fid/commands`, method: "POST", body,
    })));
  }
});

test("Fulfillment tracking and delivery confirmation carry the loaded revision", async () => {
  const tracking = { carrier: "Courier", number: "TRACK-42", url: null };
  const delivered_at = revision + 1000;
  const reply = { id: fulfillmentId, tracking, delivered_at };
  const { calls, result } = await capture(reply, async (api) => {
    await api.eshop.fulfillment.updateTracking({ store_id: storeId, fulfillment_id: fulfillmentId, expected_updated_at: revision, tracking });
    return api.eshop.fulfillment.markDelivered({ store_id: storeId, fulfillment_id: fulfillmentId, expected_updated_at: revision + 1, delivered_at });
  });
  assert.deepEqual(result, reply);
  assert.deepEqual(calls, [
    { url: `${baseUrl}/v1/stores/selected%2Fstore/fulfillments/fulfillment%2Fid/tracking`, method: "POST", body: { expected_updated_at: revision, tracking } },
    { url: `${baseUrl}/v1/stores/selected%2Fstore/fulfillments/fulfillment%2Fid/delivered`, method: "POST", body: { expected_updated_at: revision + 1, delivered_at } },
  ]);
});

test("Warehouse job controls retain exact hold, movement and partner command identities", async () => {
  const scope = { store_id: storeId, fulfillment_order_id: "work/id", expected_updated_at: revision };
  const lines = [{ fulfillment_order_line_id: "line", unit_spans: [{ first_unit: 2, quantity: 3 }] }];
  const cases = [
    ["addHold", "holds", { hold_id: "hold/id", note: "Awaiting customer confirmation" }, { hold_id: "hold/id", note: "Awaiting customer confirmation" }],
    ["releaseHold", "holds/hold%2Fid/release", { hold_id: "hold/id" }, {}],
    ["move", "move", { command_id: "move-work", to_store_location_id: "destination", lines }, { command_id: "move-work", to_store_location_id: "destination", lines }],
    ...[{ type: "accept" }, { type: "reject", note: "No capacity" }, { type: "hand_back", note: "Staff will fulfill" },
      { type: "resend" }, { type: "confirm_change" }].map((action) => [
      "controlPartner", "partner", { command_id: `partner-${action.type}`, action }, { command_id: `partner-${action.type}`, action },
    ]),
  ];
  for (const [method, path, input, payload] of cases) {
    const request = { ...scope, ...input };
    const before = structuredClone(request);
    const { calls } = await capture({ id: "work/id" }, async (api) => {
      await api.eshop.fulfillmentOrder[method](request);
      await api.eshop.fulfillmentOrder[method](request);
    });
    assert.deepEqual(request, before);
    assert.deepEqual(calls, [0, 1].map(() => ({
      url: `${baseUrl}/v1/stores/selected%2Fstore/fulfillment-orders/work%2Fid/${path}`,
      method: "POST", body: { expected_updated_at: revision, ...payload },
    })));
  }
});

test("Warehouse discovery sends the complete job filter and leaves continuation to the caller", async () => {
  const query = { store_id: storeId, store_location_id: "warehouse", inventory_item_id: "milk", status: "scheduled",
    scheduled_from: revision, scheduled_to: revision + 86400000, sort_field: "scheduled_at", sort_direction: "asc", limit: 20, cursor: "" };
  const response = { items: [], cursor: "next:/+=" };
  const { calls, result } = await capture(response, (api) => api.eshop.fulfillmentOrder.find(query));
  assert.deepEqual(result, response);
  assert.equal(calls.length, 1);
  const url = new URL(calls[0].url);
  assert.equal(calls[0].method, "GET");
  assert.equal(url.pathname, "/v1/stores/selected%2Fstore/fulfillment-orders");
  const { store_id, ...filters } = query;
  assert.equal(store_id, storeId);
  assert.deepEqual(Object.fromEntries(url.searchParams), Object.fromEntries(Object.entries(filters).map(([key, value]) => [key, String(value)])));
});
