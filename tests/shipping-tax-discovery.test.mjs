import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { errorResponse, recordFetch } from "./helpers/arky-fixtures.mjs";

const STORE_ID = "8b2f4d6a-1c93-4e57-a0b8-6d4e2f1c9a35";
const categoryId = "5c1e7a93-2b48-4d06-9f3e-8a1c6d0b4e27";
const methodId = "9d4b2e61-7a35-4c08-b1f9-3e6a0c8d5b72";
const zoneId = "2e8a6c14-9b37-4d50-a2f8-6c1e4b9d0a35";

function store() {
  return createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).store;
}

test("a tax category carries its rules with exact treatments and explicit schedule boundaries", async (context) => {
  const calls = recordFetch(context, (call) => call.method === "DELETE" ? { deleted: true } : { id: categoryId });
  const rules = [
    {
      id: "rule-1",
      zone_id: zoneId,
      treatment: {
        type: "rates",
        components: [
          { id: "first", title: "Exact rate", code: "vat", calculation: { type: "percentage", rate: { numerator: 1, denominator: 3 }, compound: true } },
          { id: "second", title: "Per item", code: null, calculation: { type: "fixed_per_unit", unit_amount: { amount: 42, currency: "eur" } } },
        ],
      },
      starts_at: 1_900_000_000_123,
      ends_at: null,
    },
    { id: "rule-2", zone_id: zoneId, treatment: { type: "zero_rated", reason: "Exports" }, starts_at: null, ends_at: 1_900_000_000_456 },
  ];
  const api = store().taxCategory;
  await api.create({ store_id: STORE_ID, id: categoryId, key: "standard", rules });
  await api.update({ store_id: STORE_ID, id: categoryId, expected_updated_at: 100, rules });
  assert.deepEqual(await api.delete({ store_id: STORE_ID, id: categoryId, expected_updated_at: 101 }), { deleted: true });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["POST", `/v1/stores/${STORE_ID}/tax-categories`, {}, { id: categoryId, key: "standard", rules }],
    ["PUT", `/v1/stores/${STORE_ID}/tax-categories/${categoryId}`, {}, { expected_updated_at: 100, rules }],
    ["DELETE", `/v1/stores/${STORE_ID}/tax-categories/${categoryId}`, { expected_updated_at: "101" }, null],
  ]);
  assert.equal("taxRule" in store(), false);
});

test("a shipping method carries its rates with explicit nulls, schedules and prices", async (context) => {
  const calls = recordFetch(context, () => ({ id: methodId }));
  const rates = [
    { id: "rate-1", zone_id: zoneId, shipping_profile_id: "profile", conditions: [], pricing: { type: "flat", amount: 495, free_above_subtotal: null }, delivery_estimate: null, starts_at: null, ends_at: null },
    {
      id: "rate-2",
      zone_id: zoneId,
      shipping_profile_id: "profile",
      conditions: [{ type: "minimum_weight_grams", grams: 1000 }],
      pricing: { type: "weight_tiered", tiers: [{ up_to_grams: 5000, amount: 900 }, { up_to_grams: null, amount: 1500 }], free_above_subtotal: 10_000 },
      delivery_estimate: { min_business_days: 1, max_business_days: 3 },
      starts_at: 1_900_000_000_123,
      ends_at: 1_900_000_000_456,
    },
  ];
  const api = store().shippingMethod;
  const create = { id: methodId, key: "courier", blocks: [], type: { type: "delivery" }, tax_category_id: categoryId, rates, status: { type: "active" } };
  await api.create({ store_id: STORE_ID, ...create });
  await api.update({ store_id: STORE_ID, id: methodId, expected_updated_at: 100, rates, status: { type: "archived" } });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/stores/${STORE_ID}/shipping-methods`, create],
    ["PUT", `/v1/stores/${STORE_ID}/shipping-methods/${methodId}`, { expected_updated_at: 100, rates, status: { type: "archived" } }],
  ]);
  for (const removed of ["shippingRate", "marketZone"]) assert.equal(removed in store(), false, removed);
});

const owners = [
  ["zone", "zones", { market_id: "market", key: "eu" }],
  ["shippingMethod", "shipping-methods", { key: "pickup", status: "active", type: "pickup", store_location_id: "location" }],
  ["shippingProfile", "shipping-profiles", { key: "bulky" }],
  ["taxCategory", "tax-categories", { key: "reduced" }],
];

for (const [owner, path, scope] of owners) {
  test(`${owner} keeps combined filters, reads by id or key, and deletes with the version`, async (context) => {
    let failure = null;
    const calls = recordFetch(context, (call) => {
      if (failure) return errorResponse(failure);
      if (call.method === "DELETE") return { deleted: true };
      return call.path.endsWith(path) ? { items: [], cursor: "after" } : { id: "record" };
    });
    const api = store()[owner];
    const filters = { store_id: STORE_ID, ...scope, sort_field: "updated_at", sort_direction: "asc", limit: 50, cursor: "previous" };
    assert.deepEqual(await api.find(filters), { items: [], cursor: "after" });
    await api.get({ store_id: STORE_ID, id: "record/1" });
    await api.getByKey({ store_id: STORE_ID, key: "by/key" });
    assert.deepEqual(await api.delete({ store_id: STORE_ID, id: "record", expected_updated_at: 1 }), { deleted: true });
    assert.deepEqual(calls.map(({ method, path: called, query }) => [method, called, query]), [
      ["GET", `/v1/stores/${STORE_ID}/${path}`, Object.fromEntries(Object.entries(filters).filter(([key]) => key !== "store_id").map(([key, value]) => [key, String(value)]))],
      ["GET", `/v1/stores/${STORE_ID}/${path}/record%2F1`, {}],
      ["GET", `/v1/stores/${STORE_ID}/${path}/by-key/by%2Fkey`, {}],
      ["DELETE", `/v1/stores/${STORE_ID}/${path}/record`, { expected_updated_at: "1" }],
    ]);
    for (const status of [403, 404, 409, 503]) {
      failure = status;
      const before = calls.length;
      await assert.rejects(api.find(filters), (error) => error.statusCode === status);
      assert.equal(calls.length - before, 1);
    }
    await assert.rejects(async () => api.find({ ...filters, store_id: undefined }), TypeError);
    await assert.rejects(async () => api.delete({ store_id: "chosen", id: "record", expected_updated_at: 1 }), TypeError);
  });
}

test("zones are created under an app-picked id inside their market and edited by version", async (context) => {
  const calls = recordFetch(context, () => ({ id: zoneId }));
  const api = store().zone;
  const areas = [{ type: "country", country: "BA" }, { type: "postal_code_prefix", country: "HR", prefix: "21" }];
  await api.create({ store_id: STORE_ID, id: zoneId, market_id: "market", key: "balkans", areas });
  await api.update({ store_id: STORE_ID, id: zoneId, expected_updated_at: 4, areas: areas.slice(0, 1) });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/stores/${STORE_ID}/zones`, { id: zoneId, market_id: "market", key: "balkans", areas }],
    ["PUT", `/v1/stores/${STORE_ID}/zones/${zoneId}`, { expected_updated_at: 4, areas: areas.slice(0, 1) }],
  ]);
  await assert.rejects(async () => api.create({ store_id: STORE_ID, id: "balkans", market_id: "market", key: "balkans", areas }), TypeError);
  assert.equal(calls.length, 2);
});
