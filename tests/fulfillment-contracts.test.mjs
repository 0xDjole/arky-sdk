import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

const baseUrl = "https://api.example.test";
const storeId = "6b0e4a28-9d73-4c15-a8f2-3e7c1d5b9a64";
const requestId = (index) => `8a3d5f17-${String(index).padStart(4, "0")}-4b29-9e61-0c4f7a2d8b35`;
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
    const api = createAdmin({ baseUrl, apiToken: "contract-token" });
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
    url: `${baseUrl}/v1/stores/${storeId}/fulfillment-orders/work%2Fid/unit-slots`,
    method: "POST", body: { expected_updated_at: revision, lines },
  }]);
});

test("Fulfillment preparation preserves exact selections, lot references and creation identity", async () => {
  const lines = [{ fulfillment_order_line_id: "line", unit_spans: [{ first_unit: 3, quantity: 1 }],
    selected_units: [{ fulfillment_unit_index: 3, inventory_unit_id: "physical-unit" }], lot_reference: "milk-batch-42" }];
  const request = { request_id: requestId(1), fulfillment_id: fulfillmentId, fulfillment_order_id: "work", lines };
  const before = structuredClone(request);
  const reply = { request_id: request.request_id, id: fulfillmentId, status: { type: "preparing" }, lines, tracking: null, delivered_at: null };
  const { calls, result } = await capture(reply, async (api) => {
    await api.eshop.fulfillment.create({ ...request, store_id: storeId });
    await assert.rejects(async () => api.eshop.fulfillment.create(request), TypeError);
    await assert.rejects(async () => api.eshop.fulfillment.create({ ...request, store_id: storeId, request_id: "fulfillment-request" }), TypeError);
    await assert.rejects(api.eshop.fulfillment.create({ ...request, store_id: storeId, fulfillment_id: "another-fulfillment" }), /did not match/);
    return api.eshop.fulfillment.create({ ...request, store_id: storeId });
  });
  assert.deepEqual(result, reply);
  assert.deepEqual(request, before);
  assert.deepEqual(calls[0], calls[2]);
  assert.deepEqual(calls.map((call) => call.body), [request, { ...request, fulfillment_id: "another-fulfillment" }, request]);
  assert.deepEqual(calls.map((call) => call.url), Array(3).fill(`${baseUrl}/v1/stores/${storeId}/fulfillments`));
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
    const body = { request_id: requestId(10 + index), expected_updated_at: revision, action,
      ...(action.type === "fulfill" ? { tracking, lot_references: [{ fulfillment_order_line_id: "line", lot_reference: "batch-42" }] } : {}) };
    const request = { store_id: storeId, fulfillment_id: fulfillmentId, ...body };
    const before = structuredClone(request);
    const reply = { id: fulfillmentId, status: action.type === "fulfill"
      ? { type: "fulfilled", execution: { request_id: body.request_id } } : { type: action.type === "cancel" ? "cancelled" : "ready" } };
    const { calls, result } = await capture(reply, async (api) => {
      const first = await api.eshop.fulfillment.execute(request);
      const replayed = await api.eshop.fulfillment.execute(request);
      assert.deepEqual(replayed, first);
      return replayed;
    });
    assert.deepEqual(request, before);
    assert.deepEqual(result, reply);
    assert.deepEqual(calls, [0, 1].map(() => ({
      url: `${baseUrl}/v1/stores/${storeId}/fulfillments/fulfillment%2Fid/commands`, method: "POST", body,
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
    { url: `${baseUrl}/v1/stores/${storeId}/fulfillments/fulfillment%2Fid/tracking`, method: "POST", body: { expected_updated_at: revision, tracking } },
    { url: `${baseUrl}/v1/stores/${storeId}/fulfillments/fulfillment%2Fid/delivered`, method: "POST", body: { expected_updated_at: revision + 1, delivered_at } },
  ]);
});

test("Warehouse job controls retain exact hold, movement and partner command identities", async () => {
  const scope = { store_id: storeId, fulfillment_order_id: "work/id", expected_updated_at: revision };
  const lines = [{ fulfillment_order_line_id: "line", unit_spans: [{ first_unit: 2, quantity: 3 }] }];
  const cases = [
    ["addHold", "holds", { hold_id: "hold/id", note: "Awaiting customer confirmation" }, { hold_id: "hold/id", note: "Awaiting customer confirmation" }],
    ["releaseHold", "holds/hold%2Fid/release", { hold_id: "hold/id" }, {}],
    ["move", "move", { request_id: requestId(20), to_store_location_id: "destination", lines }, { request_id: requestId(20), to_store_location_id: "destination", lines }],
    ...[{ type: "accept" }, { type: "reject", note: "No capacity" }, { type: "hand_back", note: "Staff will fulfill" },
      { type: "resend" }, { type: "confirm_change" }].map((action, index) => [
      "controlPartner", "partner", { request_id: requestId(30 + index), action }, { request_id: requestId(30 + index), action },
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
      url: `${baseUrl}/v1/stores/${storeId}/fulfillment-orders/work%2Fid/${path}`,
      method: "POST", body: { expected_updated_at: revision, ...payload },
    })));
    if ("request_id" in input) {
      const rejected = await capture({ id: "work/id" }, async (api) => {
        await assert.rejects(async () => api.eshop.fulfillmentOrder[method]({ ...request, request_id: "partner-command" }), TypeError);
      });
      assert.equal(rejected.calls.length, 0);
    }
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
  assert.equal(url.pathname, `/v1/stores/${storeId}/fulfillment-orders`);
  const { store_id, ...filters } = query;
  assert.equal(store_id, storeId);
  assert.deepEqual(Object.fromEntries(url.searchParams), Object.fromEntries(Object.entries(filters).map(([key, value]) => [key, String(value)])));
});
