import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { selectShipmentUnits, selectPickupUnits, FulfillmentSelectionError } from "../dist/utils.js";

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
    assert.deepEqual(await api.fulfillmentOrder.find(scope), { items: [], cursor });
    assert.deepEqual(Object.fromEntries(calls[0].url.searchParams), { order_id: "accepted", limit: "20" });
    assert.deepEqual(Object.fromEntries(calls[1].url.searchParams), { order_id: "accepted", limit: "20", cursor });
    assert.equal(calls[2].url.search, "");
    assert.deepEqual(Object.fromEntries(calls[5].url.searchParams), { order_id: "accepted", limit: "20" });
    assert.deepEqual(Object.fromEntries(calls[6].url.searchParams), { order_id: "accepted", limit: "20" });
    assert.deepEqual(calls.map(({ url }) => url.pathname), [
      "/v1/stores/selected/pickups",
      "/v1/stores/selected/pickups",
      "/v1/stores/selected/pickups/pickup",
      "/v1/stores/selected/orders/accepted/invoices",
      "/v1/stores/selected/orders/accepted/invoices/invoice",
      "/v1/stores/selected/shipments",
      "/v1/stores/selected/fulfillment-orders",
    ]);
    assert.ok(calls.every(({ method }) => method === "GET"));
  } finally { globalThis.fetch = previous; }
});

test("pickup preparation and commands preserve explicit ownership, immutable selection and replay identity", async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method, body: JSON.parse(init.body) });
    return new Response(JSON.stringify({ id: "pickup", status: { type: "preparing" }, collection: null }), {
      headers: { "content-type": "application/json" },
    });
  };
  try {
    const api = createAdmin({ storeId: "default", baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop;
    const lines = [{ fulfillment_order_line_id: "line", unit_spans: [{ first_unit: 3, quantity: 1 }],
      selected_units: [{ fulfillment_unit_index: 3, inventory_unit_id: "physical-unit" }] }];
    const selection = { pickup_id: "pickup", fulfillment_order_id: "work", store_location_id: "location", lines };
    const scope = { store_id: "selected" };
    const before = structuredClone(selection);
    await api.pickup.create({ ...scope, ...selection });
    for (const command of [{ type: "ready" }, { type: "cancel" }, { type: "collect", late_reason: null },
      { type: "collect", late_reason: "Customer agreed to a later collection" }]) {
      const request = { ...scope, pickup_id: "pickup", command_id: `request-${calls.length}`,
        expected_updated_at: 1700000000000, command };
      await api.pickup.execute(request);
      await api.pickup.execute(request);
      assert.deepEqual(calls.at(-1), calls.at(-2));
      assert.deepEqual(calls.at(-1).body, {
        command_id: request.command_id, expected_updated_at: request.expected_updated_at, command,
      });
    }
    await api.pickup.create(selection);
    assert.deepEqual(selection, before);
    assert.deepEqual(calls[0].body, selection);
    assert.deepEqual(calls.at(-1).body, selection);
    assert.equal(calls[0].url.pathname, "/v1/stores/selected/pickups");
    assert.equal(calls.at(-1).url.pathname, "/v1/stores/default/pickups");
    assert.ok(calls.slice(1, -1).every((call) => call.url.pathname === "/v1/stores/selected/pickups/pickup/commands"));
    assert.ok(calls.every((call) => call.method === "POST" && !call.url.search));
    assert.ok(calls.every((call) => !("order_id" in call.body) && !("store_id" in call.body)));
  } finally { globalThis.fetch = original; }
});

test("pickup selection excludes prepared and collected positions, but frees cancelled preparation", () => {
  const work = assignment();
  work.method = { type: "pickup" };
  const { dispatch, ...manifest } = dispatched();
  const collected = { ...manifest, id: "collected", collection: dispatch, status: { type: "collected" } };
  const prepared = { ...manifest, id: "prepared", collection: null, status: { type: "preparing" },
    lines: [{ fulfillment_order_line_id: "line", unit_spans: [{ first_unit: 4, quantity: 1 }], selected_units: [] }] };
  const before = structuredClone({ work, collected, prepared });
  assert.deepEqual(selectPickupUnits(work, "line", 3, [collected, prepared]), {
    fulfillment_order_line_id: "line", unit_spans: [{ first_unit: 5, quantity: 1 }, { first_unit: 7, quantity: 2 }], selected_units: [],
  });
  assert.deepEqual({ work, collected, prepared }, before);
  assert.throws(() => selectPickupUnits(work, "line", 1, []), /Load or refresh pickup history/);
  assert.throws(() => selectPickupUnits(work, "line", 1, [collected, prepared, prepared]), /overlapping/);
  assert.throws(() => selectPickupUnits(work, "line", 1, [dispatched()]), /delivery method/);
  assert.throws(() => selectPickupUnits(work, "line", 1, [{ ...collected, store_id: "foreign" }]), /another Store/);
  assert.throws(() => selectPickupUnits(work, "line", 1, [{ ...collected, fulfillment_order_id: "foreign" }]), /Load or refresh pickup history/);
  assert.throws(() => selectPickupUnits(work, "line", 5, [collected, prepared]), /exceeds/);
  prepared.status = { type: "ready" };
  assert.equal(selectPickupUnits(work, "line", 1, [collected, prepared]).unit_spans[0].first_unit, 5);
  prepared.status = { type: "cancelled" };
  assert.equal(selectPickupUnits(work, "line", 1, [collected, prepared]).unit_spans[0].first_unit, 4);
  const sparse = structuredClone(work);
  Object.assign(sparse.lines[0], {
    quantity: 3, allocated_quantity: 1, fulfilled_quantity: 0,
    source: { ...sparse.lines[0].source, order_unit_spans: [{ first_unit: 5, quantity: 2 }, { first_unit: 11, quantity: 1 }] },
    released_units: [{ first_unit: 0, quantity: 1 }], cancelled_units: [{ first_unit: 2, quantity: 1 }],
  });
  assert.deepEqual(selectPickupUnits(sparse, "line", 1, []).unit_spans, [{ first_unit: 1, quantity: 1 }]);
  const large = structuredClone(work);
  Object.assign(large.lines[0], { quantity: 2_000_000_000, allocated_quantity: 2_000_000_000,
    fulfilled_quantity: 0, released_units: [], cancelled_units: [],
    source: { ...large.lines[0].source, order_unit_spans: [{ first_unit: 0, quantity: 2_000_000_000 }] } });
  assert.deepEqual(selectPickupUnits(large, "line", 1_000_000_000, []).unit_spans, [{ first_unit: 0, quantity: 1_000_000_000 }]);
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
    id: "shipment", store_id: "store", fulfillment_order_id: "work", dispatch: { command_id: "handover" },
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
    selected_units: [],
  });
});

function rentalLine(overrides = {}) {
  return {
    id: "rental-line", quantity: 2, allocated_quantity: 2, fulfilled_quantity: 0,
    source: { type: "rental_issue", rental_id: "rental", terms_revision_id: "revision", replacement: null },
    released_units: [], cancelled_units: [], ...overrides,
  };
}

test("shipment selection issues Rental lines by local work position beside one Order delivery group", () => {
  const mixed = assignment();
  mixed.lines.push(rentalLine());
  const before = structuredClone(mixed);
  assert.deepEqual(selectShipmentUnits(mixed, "line", 1, [dispatched()]), {
    fulfillment_order_line_id: "line", unit_spans: [{ first_unit: 4, quantity: 1 }], selected_units: [],
  });
  assert.deepEqual(selectShipmentUnits(mixed, "rental-line", 2, [dispatched()]), {
    fulfillment_order_line_id: "rental-line", unit_spans: [{ first_unit: 0, quantity: 2 }], selected_units: [],
  });
  assert.deepEqual(mixed, before);
  const rentalOnly = { ...structuredClone(mixed), lines: [rentalLine()] };
  assert.deepEqual(selectShipmentUnits(rentalOnly, "rental-line", 1, []).unit_spans, [{ first_unit: 0, quantity: 1 }]);
  assert.throws(() => selectShipmentUnits(rentalOnly, "rental-line", 3, []), /exceeds/);
  const issued = {
    ...dispatched(), id: "issued", lines: [{ fulfillment_order_line_id: "rental-line", unit_spans: [{ first_unit: 0, quantity: 1 }] }],
  };
  const partly = { ...rentalOnly, lines: [rentalLine({ fulfilled_quantity: 1 })] };
  assert.deepEqual(selectShipmentUnits(partly, "rental-line", 1, [issued]).unit_spans, [{ first_unit: 1, quantity: 1 }]);
  assert.throws(() => selectShipmentUnits(partly, "rental-line", 1, []), /Load or refresh shipment history/);
  const released = { ...rentalOnly, lines: [rentalLine({ allocated_quantity: 1, released_units: [{ first_unit: 0, quantity: 1 }] })] };
  assert.deepEqual(selectShipmentUnits(released, "rental-line", 1, []).unit_spans, [{ first_unit: 1, quantity: 1 }]);
  const outside = { ...rentalOnly, lines: [rentalLine({ cancelled_units: [{ first_unit: 2, quantity: 1 }] })] };
  assert.throws(() => selectShipmentUnits(outside, "rental-line", 1, []), /Work positions exceed/);
  const foreignGroup = assignment();
  foreignGroup.lines.push(rentalLine(), { ...structuredClone(foreignGroup.lines[0]), id: "other-line" });
  foreignGroup.lines[2].source.order_delivery_group_id = "another-group";
  assert.throws(() => selectShipmentUnits(foreignGroup, "rental-line", 1, [dispatched()]), /one accepted Order delivery group/);
  const pickup = { ...structuredClone(rentalOnly), method: { type: "pickup" } };
  assert.deepEqual(selectPickupUnits(pickup, "rental-line", 2, []).unit_spans, [{ first_unit: 0, quantity: 2 }]);
});

test("shipment selection uses exact assigned ranges without expanding individual units or changing inputs", () => {
  const work = assignment();
  const history = [dispatched()];
  const before = structuredClone({ work, history });
  assert.deepEqual(selectShipmentUnits(work, "line", 4, history), {
    fulfillment_order_line_id: "line",
    unit_spans: [{ first_unit: 4, quantity: 2 }, { first_unit: 7, quantity: 2 }],
    selected_units: [],
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
    lines: [{ fulfillment_order_line_id: "line", unit_spans: [{ first_unit: 4, quantity: 1 }], selected_units: [] }],
  };
  const before = structuredClone(prepared);
  assert.deepEqual(selectShipmentUnits(work, "line", 1, [dispatched(), prepared]), {
    fulfillment_order_line_id: "line", unit_spans: [{ first_unit: 5, quantity: 1 }], selected_units: [],
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
    const result = await api.shipment.cancel({ store_id: "selected", shipment_id: "parcel", expected_updated_at: 1700000000000 });
    assert.equal(result.status.type, "cancelled");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url.pathname, "/v1/stores/selected/shipments/parcel/cancel");
    assert.equal(calls[0].method, "POST");
    assert.deepEqual(calls[0].body, { expected_updated_at: 1700000000000 });
  } finally { globalThis.fetch = original; }
});

test("shipment selection refuses incomplete history, foreign or repeated custody, invalid ranges and excess quantities", () => {
  assert.throws(() => selectShipmentUnits(assignment(), "line", 1, []), /Load or refresh shipment history/);
  assert.throws(() => selectShipmentUnits(assignment(), "line", 6, [dispatched()]), FulfillmentSelectionError);
  assert.throws(() => selectShipmentUnits(assignment(), "line", 1, [dispatched(), dispatched()]), /overlapping/);
  assert.throws(() => selectShipmentUnits(assignment(), "line", 1, [{ ...dispatched(), store_id: "foreign" }]), /another Store/);
  assert.throws(() => selectShipmentUnits(assignment(), "line", 1, [{ ...dispatched(), fulfillment_order_id: "foreign" }]), /Load or refresh shipment history/);
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
