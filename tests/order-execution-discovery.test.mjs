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
    id: "work", store_id: "store", method: { type: "delivery" }, status: { type: "open" },
    lines: [{
      id: "line", quantity: 10, allocated_quantity: 7, fulfilled_quantity: 2,
      source: { type: "order_product", order_id: "order", order_delivery_group_id: "group",
        order_product_line_item_id: "product", order_unit_spans: [{ first_unit: 10, quantity: 10 }] },
      released_units: [{ first_unit: 2, quantity: 2 }],
      cancelled_units: [{ first_unit: 6, quantity: 1 }],
    }],
  };
}

function dispatched() {
  return {
    id: "shipment", store_id: "store", order_id: "order", fulfillment_order_id: "work", dispatch: { command_id: "handover" },
    lines: [{ fulfillment_order_line_id: "line", unit_spans: [{ first_unit: 0, quantity: 2 }] }],
  };
}

test("shipment selection rejects mixed source ownership instead of trusting removed root fields", () => {
  for (const field of ["order_id", "order_delivery_group_id"]) {
    const work = assignment();
    work.lines.push({ ...structuredClone(work.lines[0]), id: "other-line" });
    work.lines[1].source[field] = "another-owner";
    assert.throws(() => selectShipmentUnits(work, "line", 1, [dispatched()]), /one accepted Order delivery group/);
  }
  const work = assignment();
  work.order_id = "untrusted-legacy-field";
  assert.deepEqual(selectShipmentUnits(work, "line", 1, [dispatched()]), {
    fulfillment_order_line_id: "line", unit_spans: [{ first_unit: 4, quantity: 1 }],
    unit_bindings: [],
  });
});

test("sale shipment selection does not use a Product line to authorize Rental issue work", () => {
  const rental = {
    ...structuredClone(assignment().lines[0]), id: "rental-line",
    source: { type: "rental_issue", rental_id: "rental", terms_revision_id: "revision", replaces_placement_id: null },
  };
  const mixed = assignment();
  mixed.lines.push(rental);
  const before = structuredClone(mixed);
  assert.throws(() => selectShipmentUnits(mixed, "line", 1, [dispatched()]), /one accepted Order delivery group/);
  assert.throws(() => selectShipmentUnits(mixed, "rental-line", 1, []), /one accepted Order delivery group/);
  assert.deepEqual(mixed, before);
  assert.throws(() => selectShipmentUnits({ ...mixed, lines: [rental] }, "rental-line", 1, []), /one accepted Order delivery group/);
});

test("shipment selection uses exact assigned ranges without expanding individual units or changing inputs", () => {
  const work = assignment();
  const history = [dispatched()];
  const before = structuredClone({ work, history });
  assert.deepEqual(selectShipmentUnits(work, "line", 4, history), {
    fulfillment_order_line_id: "line",
    unit_spans: [{ first_unit: 4, quantity: 2 }, { first_unit: 7, quantity: 2 }],
    unit_bindings: [],
  });
  assert.deepEqual({ work, history }, before);
  const large = assignment();
  Object.assign(large.lines[0], {
    quantity: 2_000_000_000, allocated_quantity: 2_000_000_000, fulfilled_quantity: 0,
    source: { ...large.lines[0].source, order_unit_spans: [{ first_unit: 0, quantity: 2_000_000_000 }] }, released_units: [], cancelled_units: [],
  });
  assert.deepEqual(selectShipmentUnits(large, "line", 1_000_000_000, []).unit_spans, [{ first_unit: 0, quantity: 1_000_000_000 }]);
});

test("prepared parcels exclude their positions until explicitly cancelled without claiming dispatch", () => {
  const work = assignment();
  const prepared = {
    ...dispatched(), id: "prepared", dispatch: null, status: { type: "pending" },
    lines: [{ fulfillment_order_line_id: "line", unit_spans: [{ first_unit: 4, quantity: 1 }], unit_bindings: [] }],
  };
  const before = structuredClone(prepared);
  assert.deepEqual(selectShipmentUnits(work, "line", 1, [dispatched(), prepared]), {
    fulfillment_order_line_id: "line", unit_spans: [{ first_unit: 5, quantity: 1 }], unit_bindings: [],
  });
  assert.deepEqual(prepared, before);
  assert.throws(() => selectShipmentUnits(work, "line", 5, [dispatched(), prepared]), /exceeds/);
  assert.throws(() => selectShipmentUnits(work, "line", 1, [dispatched(), prepared, prepared]), /overlapping/);
  prepared.lines[0].unit_spans = [{ first_unit: 0, quantity: 1 }];
  assert.throws(() => selectShipmentUnits(work, "line", 1, [dispatched(), prepared]), /overlapping/);
  prepared.lines[0].unit_spans = [{ first_unit: 2, quantity: 1 }];
  assert.throws(() => selectShipmentUnits(work, "line", 1, [dispatched(), prepared]), /remaining assignment/);
  prepared.status = { type: "cancelled" };
  assert.deepEqual(selectShipmentUnits(work, "line", 1, [dispatched(), prepared]).unit_spans, [{ first_unit: 4, quantity: 1 }]);
  prepared.status = { type: "delivered" };
  assert.throws(() => selectShipmentUnits(work, "line", 1, [dispatched(), prepared]), /preparation status/);
});

test("shipment cancellation sends only the loaded parcel revision under exact owners", async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: JSON.parse(init.body) });
    return new Response(JSON.stringify({ id: "parcel", status: { type: "cancelled" }, dispatch: null }), {
      headers: { "content-type": "application/json" },
    });
  };
  try {
    const api = createAdmin({ storeId: "default", baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop;
    const result = await api.shipment.cancel({ store_id: "selected", order_id: "order", shipment_id: "parcel", expected_updated_at: 1700000000000 });
    assert.equal(result.status.type, "cancelled");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url.pathname, "/v1/stores/selected/orders/order/shipments/parcel/cancel");
    assert.equal(calls[0].method, "POST");
    assert.deepEqual(calls[0].body, { expected_updated_at: 1700000000000 });
  } finally { globalThis.fetch = original; }
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
  invalid.lines[0].source.order_unit_spans = [{ first_unit: 4294967295, quantity: 1 }];
  assert.throws(() => selectShipmentUnits(invalid, "line", 1, []), /invalid/);
});

test("shipment selection maps sparse local work progress without treating it as Order positions", () => {
  const work = assignment();
  Object.assign(work.lines[0], {
    quantity: 3, allocated_quantity: 1, fulfilled_quantity: 0,
    source: { ...work.lines[0].source, order_unit_spans: [{ first_unit: 5, quantity: 2 }, { first_unit: 11, quantity: 1 }] },
    released_units: [{ first_unit: 0, quantity: 1 }],
    cancelled_units: [{ first_unit: 2, quantity: 1 }],
  });
  assert.deepEqual(selectShipmentUnits(work, "line", 1, []).unit_spans, [{ first_unit: 1, quantity: 1 }]);
  work.lines[0].cancelled_units = [{ first_unit: 11, quantity: 1 }];
  assert.throws(() => selectShipmentUnits(work, "line", 1, []), /Work positions exceed/);
  work.lines[0].cancelled_units = [{ first_unit: 0, quantity: 1 }];
  work.lines[0].allocated_quantity = 2;
  assert.throws(() => selectShipmentUnits(work, "line", 1, []), /disagree/);
});

test("shipment work mapping rejects noncanonical source ranges and fragmented overflow", () => {
  const work = assignment();
  work.lines[0].source.order_unit_spans = [{ first_unit: 10, quantity: 2 }, { first_unit: 12, quantity: 8 }];
  assert.throws(() => selectShipmentUnits(work, "line", 1, []), /coalesced/);
  work.lines[0].source.order_unit_spans.reverse();
  assert.throws(() => selectShipmentUnits(work, "line", 1, []), /coalesced/);
  Object.assign(work.lines[0], {
    quantity: 3000, allocated_quantity: 1002, fulfilled_quantity: 0,
    source: { ...work.lines[0].source, order_unit_spans: Array.from({ length: 1000 }, (_, index) => ({ first_unit: index * 4, quantity: 3 })) },
    released_units: Array.from({ length: 999 }, (_, index) => ({ first_unit: index * 3 + 2, quantity: 2 })),
    cancelled_units: [],
  });
  assert.throws(() => selectShipmentUnits(work, "line", 1, []), /Mapped unit ranges exceed/);
});
