import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { selectFulfillmentUnits, selectFulfillmentMoveUnits, FulfillmentSelectionError } from "../dist/utils.js";

test("Order execution readers preserve empty continuations, ownership and exact read routes", async () => {
  const previous = globalThis.fetch;
  const calls = [];
  const cursor = "next:/+==";
  const replies = [
    { items: [], cursor }, { items: [], cursor: null },
    { id: "fulfillment/id", status: { type: "preparing" }, tracking: null },
    { items: [], cursor }, { id: "work/id", order: { order_id: "accepted", order_delivery_group_id: "group" } },
    [{ fulfillment_order_line_id: "line", product_key: "milk", variant_sku: null, quantity: 2 }],
  ];
  globalThis.fetch = async (input, init = {}) => {
    calls.push({ url: new URL(input), method: init.method ?? "GET" });
    return new Response(JSON.stringify(replies.shift()), { headers: { "content-type": "application/json" } });
  };
  try {
    const api = createAdmin({ storeId: "default", market: "configured", baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop;
    const scope = { store_id: "selected/store", order_id: "accepted", limit: 20 };
    assert.deepEqual(await api.fulfillment.find(scope), { items: [], cursor });
    assert.equal(calls.length, 1);
    assert.deepEqual(await api.fulfillment.find({ ...scope, cursor }), { items: [], cursor: null });
    assert.equal((await api.fulfillment.get({ store_id: scope.store_id, fulfillment_id: "fulfillment/id" })).tracking, null);
    assert.deepEqual(await api.fulfillmentOrder.find(scope), { items: [], cursor });
    assert.equal((await api.fulfillmentOrder.get({ store_id: scope.store_id, fulfillment_order_id: "work/id" })).order.order_id, "accepted");
    assert.equal((await api.fulfillmentOrder.items({ store_id: scope.store_id, fulfillment_order_id: "work/id" }))[0].product_key, "milk");
    assert.deepEqual(Object.fromEntries(calls[0].url.searchParams), { order_id: "accepted", limit: "20" });
    assert.deepEqual(Object.fromEntries(calls[1].url.searchParams), { order_id: "accepted", limit: "20", cursor });
    assert.deepEqual(Object.fromEntries(calls[3].url.searchParams), { order_id: "accepted", limit: "20" });
    assert.deepEqual(calls.map(({ url }) => url.pathname), [
      "/v1/stores/selected%2Fstore/fulfillments",
      "/v1/stores/selected%2Fstore/fulfillments",
      "/v1/stores/selected%2Fstore/fulfillments/fulfillment%2Fid",
      "/v1/stores/selected%2Fstore/fulfillment-orders",
      "/v1/stores/selected%2Fstore/fulfillment-orders/work%2Fid",
      "/v1/stores/selected%2Fstore/fulfillment-orders/work%2Fid/items",
    ]);
    assert.ok([2, 4, 5].every((index) => calls[index].url.search === ""));
    assert.ok(calls.every(({ method }) => method === "GET"));
  } finally { globalThis.fetch = previous; }
});

function assignment(method = "delivery") {
  return {
    id: "work", store_id: "store", store_location_id: "location",
    order: { order_id: "order", order_delivery_group_id: "group" },
    method: method === "pickup" ? { type: "pickup" } : { type: "delivery", destination: {} },
    status: { type: "open" }, holds: [], partner_request: null,
    lines: [{
      id: "line", quantity: 10, fulfilled_quantity: 2, inventory_requirements: [],
      source: { type: "order_product", order_product_line_item_id: "product", order_unit_spans: [{ first_unit: 10, quantity: 10 }] },
      moved_units: [{ first_unit: 2, quantity: 2 }], cancelled_units: [{ first_unit: 6, quantity: 1 }],
    }],
  };
}

function selection(first_unit, quantity, line = "line") {
  return { fulfillment_order_line_id: line, unit_spans: [{ first_unit, quantity }], selected_units: [], lot_reference: null };
}

function fulfilled() {
  return {
    id: "fulfillment", store_id: "store", fulfillment_order_id: "work",
    status: { type: "fulfilled", execution: { command_id: "handover" } },
    lines: [selection(0, 2)], tracking: null, delivered_at: null,
  };
}

function rentalLine(overrides = {}) {
  return {
    id: "rental-line", quantity: 2, fulfilled_quantity: 0, inventory_requirements: [],
    source: { type: "rental_issue", rental_id: "rental", terms_revision_id: "revision", replacement: null },
    moved_units: [], cancelled_units: [], ...overrides,
  };
}

for (const method of ["delivery", "pickup"]) {
  test(`${method} selection excludes fulfilled and prepared units until preparation is cancelled`, () => {
    const work = assignment(method);
    const completed = fulfilled();
    const prepared = { ...fulfilled(), id: "prepared", status: { type: "preparing" }, lines: [selection(4, 1)] };
    const before = structuredClone({ work, completed, prepared });
    assert.deepEqual(selectFulfillmentUnits(work, "line", 3, [completed, prepared]), {
      fulfillment_order_line_id: "line", unit_spans: [{ first_unit: 5, quantity: 1 }, { first_unit: 7, quantity: 2 }],
      selected_units: [], lot_reference: null,
    });
    assert.deepEqual({ work, completed, prepared }, before);
    assert.throws(() => selectFulfillmentUnits(work, "line", 1, [completed, prepared, prepared]), /overlapping/);
    assert.throws(() => selectFulfillmentUnits(work, "line", 5, [completed, prepared]), /exceeds/);
    prepared.status = { type: "ready", ready_at: 1700000000000 };
    assert.equal(selectFulfillmentUnits(work, "line", 1, [completed, prepared]).unit_spans[0].first_unit, 5);
    prepared.lines = [selection(0, 1)];
    assert.throws(() => selectFulfillmentUnits(work, "line", 1, [completed, prepared]), /overlapping/);
    prepared.lines = [selection(2, 1)];
    assert.throws(() => selectFulfillmentUnits(work, "line", 1, [completed, prepared]), /remaining assignment/);
    prepared.status = { type: "cancelled", cancelled_at: 1700000000001 };
    assert.equal(selectFulfillmentUnits(work, "line", 1, [completed, prepared]).unit_spans[0].first_unit, 4);
    prepared.status = { type: "invalid" };
    assert.throws(() => selectFulfillmentUnits(work, "line", 1, [completed, prepared]), /preparation status/);
  });

  test(`${method} selection handles sparse and large assignments without expanding units`, () => {
    const work = assignment(method);
    const history = [fulfilled()];
    const before = structuredClone({ work, history });
    assert.deepEqual(selectFulfillmentUnits(work, "line", 4, history), {
      fulfillment_order_line_id: "line", unit_spans: [{ first_unit: 4, quantity: 2 }, { first_unit: 7, quantity: 2 }],
      selected_units: [], lot_reference: null,
    });
    assert.deepEqual({ work, history }, before);
    Object.assign(work.lines[0], {
      quantity: 3, fulfilled_quantity: 0,
      source: { ...work.lines[0].source, order_unit_spans: [{ first_unit: 5, quantity: 2 }, { first_unit: 11, quantity: 1 }] },
      moved_units: [{ first_unit: 0, quantity: 1 }], cancelled_units: [{ first_unit: 2, quantity: 1 }],
    });
    assert.deepEqual(selectFulfillmentUnits(work, "line", 1, []), selection(1, 1));
    work.lines[0].cancelled_units = [{ first_unit: 11, quantity: 1 }];
    assert.throws(() => selectFulfillmentUnits(work, "line", 1, []), /Work positions exceed/);
    work.lines[0].cancelled_units = [{ first_unit: 0, quantity: 1 }];
    assert.throws(() => selectFulfillmentUnits(work, "line", 1, []), /disagree/);
    Object.assign(work.lines[0], {
      quantity: 2_000_000_000, fulfilled_quantity: 0, moved_units: [], cancelled_units: [],
      source: { ...work.lines[0].source, order_unit_spans: [{ first_unit: 0, quantity: 2_000_000_000 }] },
    });
    assert.deepEqual(selectFulfillmentUnits(work, "line", 1_000_000_000, []), selection(0, 1_000_000_000));
  });

  test(`${method} selection supports product and Rental work with explicit Order ownership`, () => {
    const work = assignment(method);
    work.lines.push(rentalLine());
    const before = structuredClone(work);
    assert.deepEqual(selectFulfillmentUnits(work, "line", 1, [fulfilled()]), selection(4, 1));
    assert.deepEqual(selectFulfillmentUnits(work, "rental-line", 2, [fulfilled()]), selection(0, 2, "rental-line"));
    assert.deepEqual(work, before);
    work.order = null;
    assert.throws(() => selectFulfillmentUnits(work, "line", 1, [fulfilled()]), /accepted Order delivery/);
    const rentalOnly = { ...work, lines: [rentalLine()] };
    assert.deepEqual(selectFulfillmentUnits(rentalOnly, "rental-line", 1, []), selection(0, 1, "rental-line"));
    assert.throws(() => selectFulfillmentUnits(rentalOnly, "rental-line", 3, []), /exceeds/);
    rentalOnly.lines[0].fulfilled_quantity = 1;
    const issued = { ...fulfilled(), lines: [selection(0, 1, "rental-line")] };
    assert.deepEqual(selectFulfillmentUnits(rentalOnly, "rental-line", 1, [issued]), selection(1, 1, "rental-line"));
    assert.throws(() => selectFulfillmentUnits(rentalOnly, "rental-line", 1, []), /Load or refresh fulfillment history/);
    rentalOnly.lines[0] = rentalLine({ moved_units: [{ first_unit: 0, quantity: 1 }] });
    assert.deepEqual(selectFulfillmentUnits(rentalOnly, "rental-line", 1, []), selection(1, 1, "rental-line"));
    rentalOnly.lines[0] = rentalLine({ cancelled_units: [{ first_unit: 2, quantity: 1 }] });
    assert.throws(() => selectFulfillmentUnits(rentalOnly, "rental-line", 1, []), /Work positions exceed/);
  });
}

test("Fulfillment selection refuses incomplete or foreign history, invalid quantities and unavailable jobs", () => {
  const work = assignment();
  assert.throws(() => selectFulfillmentUnits(work, "line", 1, []), /Load or refresh fulfillment history/);
  assert.throws(() => selectFulfillmentUnits(work, "line", 6, [fulfilled()]), /exceeds/);
  assert.throws(() => selectFulfillmentUnits(work, "line", 1, [fulfilled(), fulfilled()]), /overlapping/);
  assert.throws(() => selectFulfillmentUnits(work, "line", 1, [{ ...fulfilled(), store_id: "foreign" }]), /another Store/);
  assert.throws(() => selectFulfillmentUnits(work, "line", 1, [{ ...fulfilled(), fulfillment_order_id: "foreign" }]), /Load or refresh fulfillment history/);
  assert.throws(() => selectFulfillmentUnits(work, "unknown-line", 1, [fulfilled()]), FulfillmentSelectionError);
  assert.throws(() => selectFulfillmentUnits(work, "line", 1, [{ ...fulfilled(), lines: [{ ...selection(0, 2), unit_spans: [] }] }]), /nonempty/);
  for (const quantity of [0, -1, 1.5, Infinity, NaN, 4294967296]) {
    assert.throws(() => selectFulfillmentUnits(work, "line", quantity, [fulfilled()]), FulfillmentSelectionError);
  }
  for (const type of ["scheduled", "on_hold", "completed", "cancelled"]) {
    assert.throws(() => selectFulfillmentUnits({ ...work, status: { type } }, "line", 1, [fulfilled()]), /released fulfillment work/);
  }
  assert.deepEqual(selectFulfillmentUnits({ ...work, status: { type: "in_progress" } }, "line", 1, [fulfilled()]), selection(4, 1));
});

test("Work mapping rejects invalid, noncanonical and over-fragmented ranges", () => {
  const work = assignment();
  work.lines[0].source.order_unit_spans = [{ first_unit: 4294967295, quantity: 1 }];
  assert.throws(() => selectFulfillmentUnits(work, "line", 1, []), /invalid/);
  work.lines[0].source.order_unit_spans = [{ first_unit: 10, quantity: 2 }, { first_unit: 12, quantity: 8 }];
  assert.throws(() => selectFulfillmentUnits(work, "line", 1, []), /coalesced/);
  work.lines[0].source.order_unit_spans.reverse();
  assert.throws(() => selectFulfillmentUnits(work, "line", 1, []), /coalesced/);
  Object.assign(work.lines[0], {
    quantity: 3000, fulfilled_quantity: 0,
    source: { ...work.lines[0].source, order_unit_spans: Array.from({ length: 1000 }, (_, index) => ({ first_unit: index * 4, quantity: 3 })) },
    moved_units: Array.from({ length: 999 }, (_, index) => ({ first_unit: index * 3 + 2, quantity: 2 })), cancelled_units: [],
  });
  assert.throws(() => selectFulfillmentUnits(work, "line", 1, []), /Mapped unit ranges exceed/);
});

test("Moving work selects only unfulfilled delivery units and refuses partner, pickup and finished jobs", () => {
  const work = assignment();
  const prepared = { ...fulfilled(), id: "prepared", status: { type: "preparing" }, lines: [selection(4, 1)] };
  const before = structuredClone({ work, prepared });
  assert.deepEqual(selectFulfillmentMoveUnits(work, "line", 3, [fulfilled(), prepared]), {
    fulfillment_order_line_id: "line", unit_spans: [{ first_unit: 5, quantity: 1 }, { first_unit: 7, quantity: 2 }],
  });
  assert.deepEqual({ work, prepared }, before);
  for (const type of ["scheduled", "on_hold"]) {
    assert.deepEqual(selectFulfillmentMoveUnits({ ...work, status: { type } }, "line", 1, [fulfilled()]).unit_spans, [{ first_unit: 4, quantity: 1 }]);
  }
  assert.throws(() => selectFulfillmentMoveUnits({ ...work, partner_request: {} }, "line", 1, [fulfilled()]), /not with a partner/);
  assert.throws(() => selectFulfillmentMoveUnits(assignment("pickup"), "line", 1, [fulfilled()]), /delivery/);
  for (const type of ["completed", "cancelled"]) {
    assert.throws(() => selectFulfillmentMoveUnits({ ...work, status: { type } }, "line", 1, [fulfilled()]), /Finished work/);
  }
});
