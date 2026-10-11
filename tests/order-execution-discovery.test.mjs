import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { FulfillmentSelectionError, selectFulfillmentMoveUnits, selectFulfillmentUnits } from "../dist/utils.js";
import { recordFetch } from "./helpers/arky-fixtures.mjs";

const STORE_ID = "4e6a0c8d-2f19-4b37-a5e8-1d7c9b3f0a62";
const actor = { account_id: "0e7d3b59-8a14-4c62-b9f0-3d6a2c8e1f47", snapshot: { email: "picker@example.test", credential_type: "session" } };
const address = { name: null, company: null, street1: "1 Main Street", street2: null, city: "Sarajevo", state: null, postal_code: "71000", country: "BA", phone: null, email: null };
const replacement = { predecessor_inventory_unit_id: "old-unit", predecessor_fulfillment_job_line_id: "delivered-line", predecessor_fulfillment_unit_index: 0, overlap_authorized: false };

test("order execution reads keep empty continuations, the order filter and exact read routes", async (context) => {
  const cursor = "next:/+==";
  const replies = [
    { items: [], cursor },
    { items: [], cursor: null },
    { id: "fulfillment/id", type: { type: "delivery", tracking: null, status: { type: "preparing" } } },
    { items: [], cursor },
    { id: "work/id", type: { type: "order_delivery", order_id: "accepted", order_delivery_group_id: "group" } },
    [{ fulfillment_job_line_id: "line", order_number: "1042", product_key: "milk", product_blocks: [], variant_sku: null, image: null, quantity: 2, source: { type: "order_product", order_product_line_item_id: "product", order_unit_spans: [] } }],
  ];
  const calls = recordFetch(context, () => replies.shift());
  const api = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop;
  const scope = { store_id: STORE_ID, order_id: "accepted", limit: 20 };
  assert.deepEqual(await api.fulfillment.find(scope), { items: [], cursor });
  assert.equal(calls.length, 1);
  assert.deepEqual(await api.fulfillment.find({ ...scope, cursor }), { items: [], cursor: null });
  assert.equal((await api.fulfillment.get({ store_id: STORE_ID, fulfillment_id: "fulfillment/id" })).type.tracking, null);
  assert.deepEqual(await api.fulfillmentJob.find(scope), { items: [], cursor });
  assert.equal((await api.fulfillmentJob.get({ store_id: STORE_ID, fulfillment_job_id: "work/id" })).type.order_id, "accepted");
  const items = await api.fulfillmentJob.items({ store_id: STORE_ID, fulfillment_job_id: "work/id" });
  assert.equal(items[0].product_key, "milk");
  assert.equal(items[0].order_number, "1042");
  assert.deepEqual(calls[0].query, { order_id: "accepted", limit: "20" });
  assert.deepEqual(calls[1].query, { order_id: "accepted", limit: "20", cursor });
  assert.deepEqual(calls[3].query, { order_id: "accepted", limit: "20" });
  assert.deepEqual(calls.map((call) => call.path), [
    `/v1/stores/${STORE_ID}/fulfillments`,
    `/v1/stores/${STORE_ID}/fulfillments`,
    `/v1/stores/${STORE_ID}/fulfillments/fulfillment%2Fid`,
    `/v1/stores/${STORE_ID}/fulfillment-jobs`,
    `/v1/stores/${STORE_ID}/fulfillment-jobs/work%2Fid`,
    `/v1/stores/${STORE_ID}/fulfillment-jobs/work%2Fid/items`,
  ]);
  assert.ok([2, 4, 5].every((index) => calls[index].url.search === ""));
  assert.ok(calls.every((call) => call.method === "GET"));
  await assert.rejects(async () => api.fulfillment.find({ ...scope, store_id: "selected/store" }), TypeError);
  await assert.rejects(async () => api.fulfillmentJob.get({ fulfillment_job_id: "work/id" }), TypeError);
  assert.equal(calls.length, 6);
});

function productLine() {
  return {
    id: "line",
    quantity: 10,
    fulfilled_quantity: 2,
    inventory_requirements: [],
    source: { type: "order_product", order_product_line_item_id: "product", order_unit_spans: [{ first_unit: 10, quantity: 10 }] },
    moved_units: [{ first_unit: 2, quantity: 2 }],
    cancelled_units: [{ first_unit: 6, quantity: 1 }],
  };
}

function rentalLine(overrides = {}) {
  return {
    id: "rental-line",
    quantity: 2,
    fulfilled_quantity: 0,
    inventory_requirements: [],
    source: { type: "rental_issue", rental_id: "rental", revision_id: "revision" },
    moved_units: [],
    cancelled_units: [],
    ...overrides,
  };
}

function job(method = "delivery") {
  return {
    id: "work",
    store_id: "store",
    type: { type: "order_delivery", order_id: "order", order_delivery_group_id: "group", timing: { type: "asap" }, lines: [productLine()] },
    method: method === "pickup"
      ? { type: "pickup", store_location_id: "location" }
      : { type: "delivery", destination: address, store_location_id: "location", source: { type: "otherwise" } },
    holds: [],
    recipient: { type: "customer", source_customer_id: "customer", email: null },
    status: "open",
    created_at: 1,
    updated_at: 1,
  };
}

function rentalJob(line = rentalLine()) {
  return { ...job(), type: { type: "rental_replacement", replacement, line } };
}

function selection(first_unit, quantity, line = "line") {
  return { fulfillment_job_line_id: line, unit_spans: [{ first_unit, quantity }], selected_units: [], lot_reference: null };
}

function handedOver(method = "delivery", lines = [selection(0, 2)]) {
  const execution = { executed_at: 1, actor, timing: { type: "on_time" } };
  return {
    id: "fulfillment",
    store_id: "store",
    fulfillment_job_id: "work",
    created_by: actor,
    lines,
    type: method === "pickup" ? { type: "pickup", status: { type: "collected", execution } } : { type: "delivery", tracking: null, status: { type: "sent", execution } },
    created_at: 1,
    updated_at: 1,
  };
}

function preparing(method, lines) {
  return { ...handedOver(method, lines), id: "prepared", type: method === "pickup" ? { type: "pickup", status: { type: "preparing" } } : { type: "delivery", tracking: null, status: { type: "preparing" } } };
}

for (const method of ["delivery", "pickup"]) {
  test(`${method} selection leaves out handed-over and prepared units until a preparation is cancelled`, () => {
    const work = job(method);
    const completed = handedOver(method);
    const prepared = preparing(method, [selection(4, 1)]);
    const before = structuredClone({ work, completed, prepared });
    assert.deepEqual(selectFulfillmentUnits(work, "line", 3, [completed, prepared]), {
      fulfillment_job_line_id: "line",
      unit_spans: [{ first_unit: 5, quantity: 1 }, { first_unit: 7, quantity: 2 }],
      selected_units: [],
      lot_reference: null,
    });
    assert.deepEqual({ work, completed, prepared }, before);
    assert.throws(() => selectFulfillmentUnits(work, "line", 1, [completed, prepared, prepared]), /overlapping/);
    assert.throws(() => selectFulfillmentUnits(work, "line", 5, [completed, prepared]), /exceeds/);
    if (method === "pickup") prepared.type.status = { type: "ready", ready_at: 1_700_000_000_000 };
    assert.equal(selectFulfillmentUnits(work, "line", 1, [completed, prepared]).unit_spans[0].first_unit, 5);
    prepared.lines = [selection(0, 1)];
    assert.throws(() => selectFulfillmentUnits(work, "line", 1, [completed, prepared]), /overlapping/);
    prepared.lines = [selection(2, 1)];
    assert.throws(() => selectFulfillmentUnits(work, "line", 1, [completed, prepared]), /remaining assignment/);
    prepared.type.status = { type: "cancelled", cancelled_at: 1_700_000_000_001 };
    assert.equal(selectFulfillmentUnits(work, "line", 1, [completed, prepared]).unit_spans[0].first_unit, 4);
    prepared.type.status = { type: "invalid" };
    assert.throws(() => selectFulfillmentUnits(work, "line", 1, [completed, prepared]), /unexpected status/);
  });

  test(`${method} selection handles sparse and large assignments without expanding units`, () => {
    const work = job(method);
    const history = [handedOver(method)];
    const before = structuredClone({ work, history });
    assert.deepEqual(selectFulfillmentUnits(work, "line", 4, history), {
      fulfillment_job_line_id: "line",
      unit_spans: [{ first_unit: 4, quantity: 2 }, { first_unit: 7, quantity: 2 }],
      selected_units: [],
      lot_reference: null,
    });
    assert.deepEqual({ work, history }, before);
    const [line] = work.type.lines;
    Object.assign(line, {
      quantity: 3,
      fulfilled_quantity: 0,
      source: { ...line.source, order_unit_spans: [{ first_unit: 5, quantity: 2 }, { first_unit: 11, quantity: 1 }] },
      moved_units: [{ first_unit: 0, quantity: 1 }],
      cancelled_units: [{ first_unit: 2, quantity: 1 }],
    });
    assert.deepEqual(selectFulfillmentUnits(work, "line", 1, []), selection(1, 1));
    line.cancelled_units = [{ first_unit: 11, quantity: 1 }];
    assert.throws(() => selectFulfillmentUnits(work, "line", 1, []), /Work positions exceed/);
    line.cancelled_units = [{ first_unit: 0, quantity: 1 }];
    assert.throws(() => selectFulfillmentUnits(work, "line", 1, []), /disagree/);
    Object.assign(line, {
      quantity: 2_000_000_000,
      fulfilled_quantity: 0,
      moved_units: [],
      cancelled_units: [],
      source: { ...line.source, order_unit_spans: [{ first_unit: 0, quantity: 2_000_000_000 }] },
    });
    assert.deepEqual(selectFulfillmentUnits(work, "line", 1_000_000_000, []), selection(0, 1_000_000_000));
  });

  test(`${method} selection covers product and rental lines, and a product line belongs to an order delivery`, () => {
    const work = job(method);
    work.type.lines.push(rentalLine());
    const before = structuredClone(work);
    assert.deepEqual(selectFulfillmentUnits(work, "line", 1, [handedOver(method)]), selection(4, 1));
    assert.deepEqual(selectFulfillmentUnits(work, "rental-line", 2, [handedOver(method)]), selection(0, 2, "rental-line"));
    assert.deepEqual(work, before);
    assert.throws(() => selectFulfillmentUnits(rentalJob(productLine()), "line", 1, [handedOver(method)]), /belongs to an order delivery/);
    const rentalOnly = rentalJob();
    assert.deepEqual(selectFulfillmentUnits(rentalOnly, "rental-line", 1, []), selection(0, 1, "rental-line"));
    assert.throws(() => selectFulfillmentUnits(rentalOnly, "rental-line", 3, []), /exceeds/);
    rentalOnly.type.line.fulfilled_quantity = 1;
    const issued = handedOver(method, [selection(0, 1, "rental-line")]);
    assert.deepEqual(selectFulfillmentUnits(rentalOnly, "rental-line", 1, [issued]), selection(1, 1, "rental-line"));
    assert.throws(() => selectFulfillmentUnits(rentalOnly, "rental-line", 1, []), /Load or refresh fulfillment history/);
    assert.deepEqual(selectFulfillmentUnits(rentalJob(rentalLine({ moved_units: [{ first_unit: 0, quantity: 1 }] })), "rental-line", 1, []), selection(1, 1, "rental-line"));
    assert.throws(() => selectFulfillmentUnits(rentalJob(rentalLine({ cancelled_units: [{ first_unit: 2, quantity: 1 }] })), "rental-line", 1, []), /Work positions exceed/);
  });
}

test("selection refuses incomplete or foreign history, invalid quantities and jobs that aren't open", () => {
  const work = job();
  assert.throws(() => selectFulfillmentUnits(work, "line", 1, []), /Load or refresh fulfillment history/);
  assert.throws(() => selectFulfillmentUnits(work, "line", 6, [handedOver()]), /exceeds/);
  assert.throws(() => selectFulfillmentUnits(work, "line", 1, [handedOver(), handedOver()]), /overlapping/);
  assert.throws(() => selectFulfillmentUnits(work, "line", 1, [{ ...handedOver(), store_id: "foreign" }]), /another store/);
  assert.throws(() => selectFulfillmentUnits(work, "line", 1, [{ ...handedOver(), fulfillment_job_id: "foreign" }]), /Load or refresh fulfillment history/);
  assert.throws(() => selectFulfillmentUnits(work, "unknown-line", 1, [handedOver()]), FulfillmentSelectionError);
  assert.throws(() => selectFulfillmentUnits(work, "line", 1, [handedOver("delivery", [{ ...selection(0, 2), unit_spans: [] }])]), /nonempty/);
  for (const quantity of [0, -1, 1.5, Infinity, NaN, 4_294_967_296]) {
    assert.throws(() => selectFulfillmentUnits(work, "line", quantity, [handedOver()]), FulfillmentSelectionError);
  }
  for (const status of ["scheduled", "on_hold", "completed", "cancelled"]) {
    assert.throws(() => selectFulfillmentUnits({ ...work, status }, "line", 1, [handedOver()]), /open or in progress/);
  }
  assert.deepEqual(selectFulfillmentUnits({ ...work, status: "in_progress" }, "line", 1, [handedOver()]), selection(4, 1));
});

test("job mapping refuses invalid, non-canonical and over-fragmented ranges", () => {
  const work = job();
  const [line] = work.type.lines;
  line.source.order_unit_spans = [{ first_unit: 4_294_967_295, quantity: 1 }];
  assert.throws(() => selectFulfillmentUnits(work, "line", 1, []), /invalid/);
  line.source.order_unit_spans = [{ first_unit: 10, quantity: 2 }, { first_unit: 12, quantity: 8 }];
  assert.throws(() => selectFulfillmentUnits(work, "line", 1, []), /coalesced/);
  line.source.order_unit_spans.reverse();
  assert.throws(() => selectFulfillmentUnits(work, "line", 1, []), /coalesced/);
  Object.assign(line, {
    quantity: 3000,
    fulfilled_quantity: 0,
    source: { ...line.source, order_unit_spans: Array.from({ length: 1000 }, (_, index) => ({ first_unit: index * 4, quantity: 3 })) },
    moved_units: Array.from({ length: 999 }, (_, index) => ({ first_unit: index * 3 + 2, quantity: 2 })),
    cancelled_units: [],
  });
  assert.throws(() => selectFulfillmentUnits(work, "line", 1, []), /Mapped unit ranges exceed/);
});

test("moving a job selects only units that weren't handed over and refuses finished jobs", () => {
  const work = job();
  const prepared = preparing("delivery", [selection(4, 1)]);
  const before = structuredClone({ work, prepared });
  assert.deepEqual(selectFulfillmentMoveUnits(work, "line", 3, [handedOver(), prepared]), {
    fulfillment_job_line_id: "line",
    unit_spans: [{ first_unit: 5, quantity: 1 }, { first_unit: 7, quantity: 2 }],
  });
  assert.deepEqual({ work, prepared }, before);
  for (const status of ["scheduled", "on_hold"]) {
    assert.deepEqual(selectFulfillmentMoveUnits({ ...work, status }, "line", 1, [handedOver()]).unit_spans, [{ first_unit: 4, quantity: 1 }]);
  }
  for (const status of ["completed", "cancelled"]) {
    assert.throws(() => selectFulfillmentMoveUnits({ ...work, status }, "line", 1, [handedOver()]), /finished job/);
  }
});
