import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";
import { apiUrl, errorResponse, publishableKey, recordFetch } from "./helpers/arky-fixtures.mjs";

const STORE_ID = "5c9e1a37-8d24-4f60-b3a5-0e7f2c4d6b18";
const OTHER_STORE_ID = "a0d6f2b8-3e51-4c79-9f24-7b1e5a3c8d60";
const marketId = "4e8b2d61-7c35-4a09-9f1e-2b6d8a0c3e57";

function store() {
  return createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).store;
}

test("market changes use the named store, an app-picked id and the version, without routing fields in the body", async (context) => {
  let failure = null;
  const calls = recordFetch(context, () => failure ? errorResponse(failure, "MARKET.REFUSED", "failed") : { id: marketId });
  const api = store().market;
  const create = { id: marketId, key: "europe", currency: "eur", tax_mode: "inclusive" };
  const update = { expected_updated_at: 123, tax_mode: "exclusive", payment_option_ids: ["5b8c1e47-3d29-4a6f-9c15-7e0d2f4a8b31"] };
  for (const store_id of [STORE_ID, OTHER_STORE_ID]) {
    await api.create({ store_id, ...create });
    await api.update({ store_id, id: marketId, ...update });
    await api.delete({ store_id, id: marketId, expected_updated_at: 124 });
    assert.deepEqual(calls.slice(-3).map(({ method, path, query, body }) => [method, path, query, body]), [
      ["POST", `/v1/stores/${store_id}/markets`, {}, create],
      ["PUT", `/v1/stores/${store_id}/markets/${marketId}`, {}, update],
      ["DELETE", `/v1/stores/${store_id}/markets/${marketId}`, { expected_updated_at: "124" }, null],
    ]);
  }
  for (const store_id of [undefined, "default", "selected"]) {
    await assert.rejects(async () => api.create({ store_id, ...create }), TypeError);
    await assert.rejects(async () => api.update({ store_id, id: marketId, ...update }), TypeError);
    await assert.rejects(async () => api.delete({ store_id, id: marketId, expected_updated_at: 124 }), TypeError);
  }
  await assert.rejects(async () => api.create({ store_id: STORE_ID, ...create, id: "europe" }), {
    name: "TypeError",
    message: "The market id must be a canonical UUID v4 picked by the app",
  });
  assert.equal(calls.length, 6);
  for (const status of [403, 409, 503]) {
    failure = status;
    const before = calls.length;
    await assert.rejects(api.create({ store_id: STORE_ID, ...create }), (error) => error.statusCode === status);
    await assert.rejects(api.update({ store_id: STORE_ID, id: marketId, ...update }), (error) => error.statusCode === status);
    await assert.rejects(api.delete({ store_id: STORE_ID, id: marketId, expected_updated_at: 124 }), (error) => error.statusCode === status);
    assert.equal(calls.length - before, 3);
  }
});

for (const [owner, path, params] of [
  ["market", "markets", { key: "trade", currency: "eur", status: "active", sort_field: "updated_at", sort_direction: "asc", limit: 1, cursor: "previous" }],
  ["location", "locations", { query: "warehouse", status: "archived", sort_field: "key", sort_direction: "asc", limit: 1, cursor: "previous" }],
  ["paymentOption", "payment-options", { key: "cards", type_name: "stripe", status: "disabled", sort_field: "updated_at", sort_direction: "asc", limit: 1, cursor: "previous" }],
]) {
  test(`${owner} lists one bounded page with its filters and keeps the continuation`, async (context) => {
    let failure = null;
    const calls = recordFetch(context, () => failure ? errorResponse(failure) : { items: [], cursor: "next" });
    const api = store()[owner];
    assert.deepEqual(await api.list({ store_id: STORE_ID, ...params }), { items: [], cursor: "next" });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].path, `/v1/stores/${STORE_ID}/${path}`);
    assert.deepEqual(calls[0].query, Object.fromEntries(Object.entries(params).map(([key, value]) => [key, String(value)])));
    for (const status of [403, 409, 503]) {
      failure = status;
      await assert.rejects(api.list({ store_id: STORE_ID, ...params }), (error) => error.statusCode === status);
    }
  });
}

test("exact configuration reads never fall back to a search or a create", async (context) => {
  let failure = null;
  const calls = recordFetch(context, () => failure ? errorResponse(failure) : { id: "exact" });
  const api = store();
  await api.market.getByKey({ store_id: STORE_ID, key: "trade" });
  await api.location.getByKey({ store_id: STORE_ID, key: "warehouse" });
  await api.market.get({ store_id: STORE_ID, id: marketId });
  await api.location.get({ store_id: STORE_ID, id: "location-id" });
  await api.paymentOption.getByKey({ store_id: STORE_ID, key: "processor" });
  await api.paymentOption.get({ store_id: STORE_ID, id: "exact" });
  assert.deepEqual(calls.map((call) => call.path), [
    `/v1/stores/${STORE_ID}/markets/by-key/trade`,
    `/v1/stores/${STORE_ID}/locations/by-key/warehouse`,
    `/v1/stores/${STORE_ID}/markets/${marketId}`,
    `/v1/stores/${STORE_ID}/locations/location-id`,
    `/v1/stores/${STORE_ID}/payment-options/key/processor`,
    `/v1/stores/${STORE_ID}/payment-options/exact`,
  ]);
  assert.ok(calls.every((call) => call.url.search === "" && call.method === "GET"));
  assert.equal("getByType" in api.paymentOption, false);
  for (const status of [404, 409, 503]) {
    failure = status;
    const before = calls.length;
    await assert.rejects(api.paymentOption.getByKey({ store_id: STORE_ID, key: "processor" }), (error) => error.statusCode === status);
    await assert.rejects(api.market.getByKey({ store_id: STORE_ID, key: "trade" }), (error) => error.statusCode === status);
    assert.equal(calls.length - before, 2);
  }
});

test("storefront markets and locations are listed in pages within the publishable key's store, with only the fields the Server knows", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: "next" }));
  const client = createStorefront(publishableKey, { apiUrl, market: "configured" });
  for (const owner of ["market", "location"]) {
    assert.deepEqual(await client.store[owner].list({ key: "trade", sort_field: "updated_at", limit: 1, cursor: "previous", sort_direction: "asc" }), { items: [], cursor: "next" });
    const call = calls.at(-1);
    assert.equal(call.path, `/v1/storefront/${owner === "market" ? "markets" : "locations"}`);
    assert.deepEqual(call.query, { key: "trade", sort_field: "updated_at", limit: "1", cursor: "previous", sort_direction: "asc" });
    for (const unknown of ["query", "pickup_point", "status", "store_id"]) assert.equal(unknown in call.query, false, unknown);
    assert.equal(call.headers.get("authorization"), null);
  }
  assert.equal(calls.length, 2);
});
