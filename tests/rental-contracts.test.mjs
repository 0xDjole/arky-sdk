import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";
import { apiUrl, fixedIdFactories, ids, storefrontIdentity, recordFetch, visitorStorage, visitorToken } from "./helpers/arky-fixtures.mjs";

const STORE_ID = "6c1e9a47-2b58-4d93-8f0a-3e7b5d2c9f14";
const OTHER_STORE_ID = "d4a8f2c6-9e13-4b75-a06d-1c5e8b3f7a29";
const rentalId = "0b5e3a7c-2d48-4d1f-9a2e-6c8b4f0d3e57";
const jobId = "7f3c1a85-4e29-4b60-a1d7-9c2e5b8f0a36";
const jobLineId = "2d8e4b61-9a37-4c05-8f1e-6b3d0a7c5e92";
const fulfillmentId = "9a1c5e37-6b28-4d40-b3f9-1e7d2c8a4b65";

function eshop() {
  return createAdmin({ apiUrl: "https://api.example.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" }).eshop;
}

test("rental discovery forwards its filters, keeps the empty continuation and reads the rented terms", async (context) => {
  const detail = { rental: { id: rentalId, status: { type: "active" } }, terms: { product_id: ids.product, variant_id: ids.variant, quantity: 1, inventory_item_id: "unit-item", product_key: "classic", variant_sku: null } };
  const calls = recordFetch(context, (_call, count) => count <= 2 ? { items: [], cursor: count === 1 ? "next:/+=" : null } : detail);
  const api = eshop().rental;
  const query = { store_id: STORE_ID, package_member_id: ids.packageMember, status: "ending", limit: 20, sort_field: "updated_at", sort_direction: "desc" };
  assert.deepEqual(await api.find(query), { items: [], cursor: "next:/+=" });
  assert.deepEqual(await api.find({ ...query, cursor: "next:/+=" }), { items: [], cursor: null });
  assert.deepEqual(await api.get({ store_id: OTHER_STORE_ID, id: "rental/id" }), detail);
  assert.deepEqual(calls.map((call) => [call.method, call.path]), [
    ["GET", `/v1/stores/${STORE_ID}/rentals`],
    ["GET", `/v1/stores/${STORE_ID}/rentals`],
    ["GET", `/v1/stores/${OTHER_STORE_ID}/rentals/rental%2Fid`],
  ]);
  assert.deepEqual(calls[0].query, { package_member_id: ids.packageMember, status: "ending", limit: "20", sort_field: "updated_at", sort_direction: "desc" });
  assert.equal(calls[1].query.cursor, "next:/+=");
  assert.equal(calls[2].url.search, "");
  assert.deepEqual(Object.keys(api).sort(), ["execute", "find", "get"]);
  await assert.rejects(async () => api.get({ id: "rental/id" }), TypeError);
  assert.equal(calls.length, 3);
});

test("rental commands send the loaded version and the typed command, and a replacement brings its app-picked job ids", async (context) => {
  const calls = recordFetch(context, () => ({ id: rentalId, status: { type: "active" } }));
  const api = eshop().rental;
  const commands = [
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
    { type: "resume" },
    { type: "cancel_issue", fulfillment_job_id: jobId, fulfillment_job_line_id: jobLineId },
  ];
  for (const command of commands) {
    const request = { store_id: STORE_ID, id: rentalId, expected_updated_at: 1_700_000_000_000, command };
    const before = structuredClone(request);
    await api.execute(request);
    assert.deepEqual(request, before);
    assert.deepEqual(calls.at(-1).body, { expected_updated_at: 1_700_000_000_000, command });
    assert.equal("type" in calls.at(-1).body, false);
  }
  assert.equal(calls.length, commands.length);
  assert.ok(calls.every((call) => call.method === "POST" && call.path === `/v1/stores/${STORE_ID}/rentals/${rentalId}/execute` && call.url.search === ""));
  const invented = { ...commands[0], fulfillment_job_id: "work" };
  await assert.rejects(async () => api.execute({ store_id: STORE_ID, id: rentalId, expected_updated_at: 1, command: invented }), {
    name: "TypeError",
    message: "The fulfillment job id must be a canonical UUID v4 picked by the app",
  });
  await assert.rejects(async () => api.execute({ store_id: STORE_ID, id: rentalId, expected_updated_at: 1, command: { ...commands[0], fulfillment_job_line_id: "line" } }), {
    name: "TypeError",
    message: "The fulfillment job line id must be a canonical UUID v4 picked by the app",
  });
  assert.equal(calls.length, commands.length);
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
  await api.fulfillmentJob.getUnitSlots({ store_id: STORE_ID, fulfillment_job_id: jobId, expected_updated_at: 1_700_000_000_000, lines: slots });
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

test("a rental that waits for its terms or never started reads as stored, and staff list rentals by those statuses", async (context) => {
  const waiting = { id: rentalId, store_id: STORE_ID, package_member_id: ids.packageMember, revision_id: jobId, package_item_id: jobLineId, status: { type: "waiting" }, created_at: 1_700_000_000_000, updated_at: 1_700_000_000_000 };
  const withdrawn = { ...waiting, id: fulfillmentId, status: { type: "withdrawn", withdrawn_at: 1_700_000_100_000 }, updated_at: 1_700_000_100_000 };
  const terms = { product_id: ids.product, variant_id: ids.variant, quantity: 1, inventory_item_id: "unit-item", product_key: "milkpal", variant_sku: null };
  const machine = { id: rentalId, package_member_id: ids.packageMember, product_key: "milkpal", product: null, variant_sku: null, quantity: 1, units: [], created_at: 1_700_000_000_000 };
  const buyerWaiting = { ...machine, status: { type: "waiting" }, updated_at: 1_700_000_000_000 };
  const buyerWithdrawn = { ...machine, id: fulfillmentId, status: { type: "withdrawn", withdrawn_at: 1_700_000_100_000 }, updated_at: 1_700_000_100_000 };
  const calls = recordFetch(context, (call) => {
    if (call.path === `/v1/stores/${STORE_ID}/rentals`) return { items: call.query.status === "waiting" ? [waiting] : [withdrawn], cursor: null };
    if (call.path === `/v1/stores/${STORE_ID}/rentals/${rentalId}`) return { rental: waiting, terms };
    if (call.path === "/v1/storefront/rentals") return { items: [buyerWaiting, buyerWithdrawn], cursor: null };
    return buyerWithdrawn;
  });
  const api = eshop().rental;
  assert.deepEqual(await api.find({ store_id: STORE_ID, status: "waiting" }), { items: [waiting], cursor: null });
  assert.deepEqual(await api.find({ store_id: STORE_ID, status: "withdrawn" }), { items: [withdrawn], cursor: null });
  assert.deepEqual(await api.get({ store_id: STORE_ID, id: rentalId }), { rental: waiting, terms });
  const store = createStorefront(storefrontIdentity, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, sessionStorage: visitorStorage() });
  const listed = await store.eshop.rental.find({ package_member_id: ids.packageMember, limit: 10 });
  assert.deepEqual(listed.items.map((item) => item.status), [{ type: "waiting" }, { type: "withdrawn", withdrawn_at: 1_700_000_100_000 }]);
  assert.deepEqual(await store.eshop.rental.get({ id: fulfillmentId }), buyerWithdrawn);
  assert.deepEqual(calls.map(({ method, path, query }) => [method, path, query]), [
    ["GET", `/v1/stores/${STORE_ID}/rentals`, { status: "waiting" }],
    ["GET", `/v1/stores/${STORE_ID}/rentals`, { status: "withdrawn" }],
    ["GET", `/v1/stores/${STORE_ID}/rentals/${rentalId}`, {}],
    ["GET", "/v1/storefront/rentals", { package_member_id: ids.packageMember, limit: "10" }],
    ["GET", `/v1/storefront/rentals/${fulfillmentId}`, {}],
  ]);
});

test("a buyer reads their own rentals of one package member through storefront routes", async (context) => {
  const calls = recordFetch(context, (call) => call.path === "/v1/storefront/rentals" ? { items: [], cursor: null } : { id: rentalId });
  const rentals = createStorefront(storefrontIdentity, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, sessionStorage: visitorStorage() }).eshop.rental;
  await rentals.find({ package_member_id: ids.packageMember, limit: 10 });
  await rentals.get({ id: rentalId });
  assert.deepEqual(calls.map(({ method, path, query }) => [method, path, query]), [
    ["GET", "/v1/storefront/rentals", { package_member_id: ids.packageMember, limit: "10" }],
    ["GET", `/v1/storefront/rentals/${rentalId}`, {}],
  ]);
  for (const call of calls) assert.equal(call.headers.get("authorization"), `Bearer ${visitorToken}`);
});

test("a buyer's rentals and a quote's rental line answer the rented machine's current product, null once it is gone", async (context) => {
  const machine = { id: ids.product, key: "milkpal", blocks: [{ id: "name", type: "localized_text", key: "name", value: { hr: "MilkPal · Marco" } }] };
  const rental = { id: rentalId, package_member_id: ids.packageMember, product_key: "milkpal", product: machine, variant_sku: "GS-EQP-MILKPAL", quantity: 1, status: { type: "active" }, units: [], created_at: 1_700_000_000_000, updated_at: 1_700_000_000_000 };
  const gone = { ...rental, id: fulfillmentId, product_key: "retired", product: null };
  const rentalLine = { type: "rent_product", package_item_id: jobLineId, product_id: ids.product, product: machine, variant_id: ids.variant, quantity: 1, snapshot: { product_key: "milkpal", variant_sku: "GS-EQP-MILKPAL", variant_blocks: [], price: { type: "package_allocation" }, fulfillment: { type: "none" } }, money: { type: "awaiting_tax", unit_price: 0, discounts: [], waiting_for: "no_delivery" } };
  const quote = { cart_id: ids.cart, lines: [{ type: "package", line_item_id: ids.line, items: [rentalLine] }] };
  const calls = recordFetch(context, (call) => call.path === "/v1/storefront/rentals" ? { items: [rental, gone], cursor: null } : call.path.endsWith("/quote") ? quote : rental);
  const store = createStorefront(storefrontIdentity, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, sessionStorage: visitorStorage() });
  const listed = await store.eshop.rental.find({ package_member_id: ids.packageMember, limit: 10 });
  assert.deepEqual(listed.items.map((item) => item.product), [machine, null]);
  const read = await store.eshop.rental.get({ id: rentalId });
  assert.deepEqual(read, rental);
  assert.equal(read.product.blocks[0].value.hr, "MilkPal · Marco");
  const quoted = await store.eshop.cart.quote({ id: ids.cart });
  assert.deepEqual(quoted.lines[0].items[0], rentalLine);
  assert.deepEqual(quoted.lines[0].items[0].product, machine);
  assert.deepEqual(calls.map(({ method, path }) => [method, path]), [
    ["GET", "/v1/storefront/rentals"],
    ["GET", `/v1/storefront/rentals/${rentalId}`],
    ["POST", `/v1/storefront/carts/${ids.cart}/quote`],
  ]);
});

test("a package change's quote line states which rental continues with the units it keeps and ships and which rentals end with the units that come back, and every other package line states none", async (context) => {
  const grinder = "1c7e5a93-2b48-4d06-9f3e-8a5c1d7b2e40";
  const mill = "6f2d8b14-9c37-4e51-a0b6-3d9e7c2a5f18";
  const keptRental = "4e9a2c57-7d13-4b68-8e0f-2a6c9b3d1f75";
  const endingRental = "9b3f6d21-5e84-4a07-b2c9-7f1e4a8d6c30";
  const rentalChange = {
    items: [
      { package_item_id: grinder, rental_id: keptRental, kept_quantity: 1, shipped_quantity: 1 },
      { package_item_id: mill, rental_id: null, kept_quantity: 0, shipped_quantity: 1 },
    ],
    ending: [{ rental_id: endingRental, returned_quantity: 2 }],
  };
  const packageLine = (lineId, start, change) => ({
    type: "package",
    line_item_id: lineId,
    start,
    items: [],
    deliveries: [],
    saves_card: false,
    rental_change: change,
  });
  const quote = {
    cart_id: ids.cart,
    lines: [
      packageLine(ids.line, { type: "switch", package_member_id: ids.packageMember }, rentalChange),
      packageLine(ids.otherLine, { type: "on_acceptance" }, null),
    ],
  };
  const sent = structuredClone(quote);
  const calls = recordFetch(context, () => quote);
  const store = createStorefront(storefrontIdentity, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, sessionStorage: visitorStorage() });
  const quoted = await store.eshop.cart.quote({ id: ids.cart });
  assert.deepEqual(quoted, sent);
  const [change, join] = quoted.lines;
  assert.deepEqual(change.rental_change, rentalChange);
  assert.deepEqual(change.rental_change.items.map((item) => [item.package_item_id, item.rental_id, item.kept_quantity, item.shipped_quantity]), [
    [grinder, keptRental, 1, 1],
    [mill, null, 0, 1],
  ]);
  assert.deepEqual(change.rental_change.ending, [{ rental_id: endingRental, returned_quantity: 2 }]);
  assert.equal(join.rental_change, null);
  assert.equal("rental_change" in join, true);
  assert.deepEqual(calls.map(({ method, path }) => [method, path]), [["POST", `/v1/storefront/carts/${ids.cart}/quote`]]);
});
