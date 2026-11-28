import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";
import { apiUrl, errorResponse, fixedIdFactories, storefrontIdentity, recordFetch } from "./helpers/arky-fixtures.mjs";

const TENANT_ID = "5c9e1a37-8d24-4f60-b3a5-0e7f2c4d6b18";
const OTHER_TENANT_ID = "a0d6f2b8-3e51-4c79-9f24-7b1e5a3c8d60";
const marketId = "4e8b2d61-7c35-4a09-9f1e-2b6d8a0c3e57";

function tenant() {
  return createAdmin({ apiUrl: "https://api.example.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" }).tenant;
}

test("market changes use the named tenant, an app-picked id and the version, without routing fields in the body", async (context) => {
  let failure = null;
  const calls = recordFetch(context, () => failure ? errorResponse(failure, "MARKET.REFUSED", "failed") : { id: marketId });
  const api = tenant().market;
  const create = { id: marketId, key: "europe", currency: "eur", tax_mode: "inclusive" };
  const update = { expected_updated_at: 123, payment_option_ids: ["5b8c1e47-3d29-4a6f-9c15-7e0d2f4a8b31"] };
  for (const tenant_id of [TENANT_ID, OTHER_TENANT_ID]) {
    await api.create({ tenant_id, ...create });
    await api.update({ tenant_id, id: marketId, ...update });
    await api.delete({ tenant_id, id: marketId, expected_updated_at: 124 });
    assert.deepEqual(calls.slice(-3).map(({ method, path, query, body }) => [method, path, query, body]), [
      ["POST", `/v1/tenants/${tenant_id}/markets`, {}, create],
      ["PUT", `/v1/tenants/${tenant_id}/markets/${marketId}`, {}, update],
      ["DELETE", `/v1/tenants/${tenant_id}/markets/${marketId}`, { expected_updated_at: "124" }, null],
    ]);
    assert.equal("tax_mode" in calls.at(-2).body, false);
  }
  for (const tenant_id of [undefined, "default", "selected"]) {
    await assert.rejects(async () => api.create({ tenant_id, ...create }), TypeError);
    await assert.rejects(async () => api.update({ tenant_id, id: marketId, ...update }), TypeError);
    await assert.rejects(async () => api.delete({ tenant_id, id: marketId, expected_updated_at: 124 }), TypeError);
  }
  await assert.rejects(async () => api.create({ tenant_id: TENANT_ID, ...create, id: "europe" }), {
    name: "TypeError",
    message: "The market id must be a canonical UUID v4 picked by the app",
  });
  assert.equal(calls.length, 6);
  for (const status of [403, 409, 503]) {
    failure = status;
    const before = calls.length;
    await assert.rejects(api.create({ tenant_id: TENANT_ID, ...create }), (error) => error.statusCode === status);
    await assert.rejects(api.update({ tenant_id: TENANT_ID, id: marketId, ...update }), (error) => error.statusCode === status);
    await assert.rejects(api.delete({ tenant_id: TENANT_ID, id: marketId, expected_updated_at: 124 }), (error) => error.statusCode === status);
    assert.equal(calls.length - before, 3);
  }
});

for (const [owner, path, params] of [
  ["market", "markets", { key: "trade", currency: "eur", status: "active", sort_field: "updated_at", sort_direction: "asc", limit: 1, cursor: "previous" }],
  ["location", "locations", { key: "warehouse", status: "archived", sort_field: "updated_at", sort_direction: "asc", limit: 1, cursor: "previous" }],
  ["paymentOption", "payment-options", { key: "cards", type_name: "stripe", status: "disabled", sort_field: "updated_at", sort_direction: "asc", limit: 1, cursor: "previous" }],
]) {
  test(`${owner} lists one bounded page with its filters and keeps the continuation`, async (context) => {
    let failure = null;
    const calls = recordFetch(context, () => failure ? errorResponse(failure) : { items: [], cursor: "next" });
    const api = tenant()[owner];
    assert.deepEqual(await api.find({ tenant_id: TENANT_ID, ...params }), { items: [], cursor: "next" });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].path, `/v1/tenants/${TENANT_ID}/${path}`);
    assert.deepEqual(calls[0].query, Object.fromEntries(Object.entries(params).map(([key, value]) => [key, String(value)])));
    for (const status of [403, 409, 503]) {
      failure = status;
      await assert.rejects(api.find({ tenant_id: TENANT_ID, ...params }), (error) => error.statusCode === status);
    }
  });
}

test("exact configuration reads never fall back to a search or a create", async (context) => {
  let failure = null;
  const calls = recordFetch(context, () => failure ? errorResponse(failure) : { id: "exact" });
  const api = tenant();
  await api.market.getByKey({ tenant_id: TENANT_ID, key: "trade" });
  await api.location.getByKey({ tenant_id: TENANT_ID, key: "warehouse" });
  await api.market.get({ tenant_id: TENANT_ID, id: marketId });
  await api.location.get({ tenant_id: TENANT_ID, id: "location-id" });
  await api.paymentOption.getByKey({ tenant_id: TENANT_ID, key: "processor" });
  await api.paymentOption.get({ tenant_id: TENANT_ID, id: "exact" });
  assert.deepEqual(calls.map((call) => call.path), [
    `/v1/tenants/${TENANT_ID}/markets/by-key/trade`,
    `/v1/tenants/${TENANT_ID}/locations/by-key/warehouse`,
    `/v1/tenants/${TENANT_ID}/markets/${marketId}`,
    `/v1/tenants/${TENANT_ID}/locations/location-id`,
    `/v1/tenants/${TENANT_ID}/payment-options/key/processor`,
    `/v1/tenants/${TENANT_ID}/payment-options/exact`,
  ]);
  assert.ok(calls.every((call) => call.url.search === "" && call.method === "GET"));
  assert.equal("getByType" in api.paymentOption, false);
  for (const status of [404, 409, 503]) {
    failure = status;
    const before = calls.length;
    await assert.rejects(api.paymentOption.getByKey({ tenant_id: TENANT_ID, key: "processor" }), (error) => error.statusCode === status);
    await assert.rejects(api.market.getByKey({ tenant_id: TENANT_ID, key: "trade" }), (error) => error.statusCode === status);
    assert.equal(calls.length - before, 2);
  }
});

test("storefront markets and locations are listed in pages within the named tenant and sales channel, with only the fields the Server knows", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: "next" }));
  const client = createStorefront(storefrontIdentity, { visitorIdentity: { user_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, market: "configured" });
  for (const owner of ["market", "location"]) {
    assert.deepEqual(await client.tenant[owner].find({ key: "trade", sort_field: "updated_at", limit: 1, cursor: "previous", sort_direction: "asc" }), { items: [], cursor: "next" });
    const call = calls.at(-1);
    assert.equal(call.path, `/v1/storefront/${owner === "market" ? "markets" : "locations"}`);
    assert.deepEqual(call.query, { key: "trade", sort_field: "updated_at", limit: "1", cursor: "previous", sort_direction: "asc" });
    for (const unknown of ["query", "pickup_point", "status", "tenant_id"]) assert.equal(unknown in call.query, false, unknown);
    assert.equal(call.headers.get("authorization"), null);
  }
  assert.equal(calls.length, 2);
});
