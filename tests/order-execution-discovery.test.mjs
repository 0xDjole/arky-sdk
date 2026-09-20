import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { selectShipmentUnits, FulfillmentSelectionError } from "../dist/utils.js";

test("Order execution readers preserve empty continuations, explicit ownership and exact read routes", async () => {
  const previous = globalThis.fetch;
  const calls = [];
  const cursor = "next:/+==";
  const replies = [
    { items: [], cursor }, { items: [{ id: "pickup" }], cursor: null },
    { id: "pickup", status: { type: "preparing" }, collection: null },
    { items: [], cursor }, { id: "invoice", state: { type: "unknown" } },
    { items: [], cursor }, { items: [], cursor },
  ];
  globalThis.fetch = async (input, init = {}) => {
    calls.push({ url: new URL(input), method: init.method ?? "GET" });
    return new Response(JSON.stringify(replies.shift()), { status: 200, headers: { "content-type": "application/json" } });
  };
  try {
    const api = createAdmin({ storeId: "default", market: "configured", baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop;
    const scope = { store_id: "selected", order_id: "accepted", limit: 20 };
    assert.deepEqual(await api.pickup.find(scope), { items: [], cursor });
    assert.equal(calls.length, 1);
    await api.pickup.find({ ...scope, cursor });
    assert.equal((await api.pickup.get({ ...scope, pickup_id: "pickup" })).collection, null);
    assert.deepEqual(await api.invoice.find(scope), { items: [], cursor });
    assert.equal((await api.invoice.get({ ...scope, invoice_id: "invoice" })).state.type, "unknown");
    assert.deepEqual(await api.shipment.find(scope), { items: [], cursor });
    assert.deepEqual(await api.shipment.fulfillment.find(scope), { items: [], cursor });
    assert.deepEqual(Object.fromEntries(calls[1].url.searchParams), { limit: "20", cursor });
    assert.deepEqual(calls.map(({ url }) => url.pathname), [
      "/v1/stores/selected/orders/accepted/pickups",
      "/v1/stores/selected/orders/accepted/pickups",
      "/v1/stores/selected/orders/accepted/pickups/pickup",
      "/v1/stores/selected/orders/accepted/invoices",
      "/v1/stores/selected/orders/accepted/invoices/invoice",
      "/v1/stores/selected/orders/accepted/shipments",
      "/v1/stores/selected/orders/accepted/fulfillment-orders",
    ]);
    assert.ok(calls.every(({ method }) => method === "GET"));
  } finally { globalThis.fetch = previous; }
});

function assignment() {
  return {
    id: "work", store_id: "store", order_id: "order", method: { type: "delivery" }, status: { type: "open" },
    lines: [{
      id: "line", order_product_item_id: "product", quantity: 10, allocated_quantity: 7, fulfilled_quantity: 2,
      unit_spans: [{ first_unit: 10, quantity: 10 }],
      released_units: [{ first_unit: 12, quantity: 2 }],
      cancelled_units: [{ first_unit: 16, quantity: 1 }],
    }],
  };
}

function dispatched() {
  return {
    id: "shipment", store_id: "store", order_id: "order", fulfillment_order_id: "work", dispatch: { command_id: "handover" },
    lines: [{ fulfillment_order_line_id: "line", order_product_line_item_id: "product", quantity: 2, unit_spans: [{ first_unit: 10, quantity: 2 }] }],
  };
}

test("shipment selection uses exact assigned ranges without expanding individual units or changing inputs", () => {
  const work = assignment();
  const history = [dispatched()];
  const before = structuredClone({ work, history });
  assert.deepEqual(selectShipmentUnits(work, "line", 4, history), {
    order_product_line_item_id: "product", fulfillment_order_line_id: "line", quantity: 4,
    unit_spans: [{ first_unit: 14, quantity: 2 }, { first_unit: 17, quantity: 2 }],
  });
  assert.deepEqual({ work, history }, before);
  const large = assignment();
  Object.assign(large.lines[0], {
    quantity: 2_000_000_000, allocated_quantity: 2_000_000_000, fulfilled_quantity: 0,
    unit_spans: [{ first_unit: 0, quantity: 2_000_000_000 }], released_units: [], cancelled_units: [],
  });
  assert.deepEqual(selectShipmentUnits(large, "line", 1_000_000_000, []).unit_spans, [{ first_unit: 0, quantity: 1_000_000_000 }]);
});

test("shipment selection refuses incomplete history, foreign or repeated custody, invalid ranges and excess quantities", () => {
  assert.throws(() => selectShipmentUnits(assignment(), "line", 1, []), /Load or refresh shipment history/);
  assert.throws(() => selectShipmentUnits(assignment(), "line", 6, [dispatched()]), FulfillmentSelectionError);
  assert.throws(() => selectShipmentUnits(assignment(), "line", 1, [dispatched(), dispatched()]), /overlapping/);
  for (const key of ["store_id", "order_id"]) {
    const wrong = dispatched(); wrong[key] = "foreign";
    assert.throws(() => selectShipmentUnits(assignment(), "line", 1, [wrong]), /another Order/);
  }
  for (const quantity of [0, -1, 1.5, Infinity]) {
    assert.throws(() => selectShipmentUnits(assignment(), "line", quantity, [dispatched()]), FulfillmentSelectionError);
  }
  const pickup = assignment(); pickup.method = { type: "pickup" };
  assert.throws(() => selectShipmentUnits(pickup, "line", 1, [dispatched()]), /delivery/);
  const invalid = assignment();
  invalid.lines[0].unit_spans = [{ first_unit: 4294967295, quantity: 1 }];
  assert.throws(() => selectShipmentUnits(invalid, "line", 1, []), /invalid/);
});
