import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront, initialize } from "../dist/storefront.js";
import { apiUrl, ids, publishableKey, recordFetch, visitorStorage, visitorToken } from "./helpers/arky-fixtures.mjs";

const STORE_ID = "9e4c7a21-3b58-4f06-8d1a-6c2e0b9f5a37";
const methodId = "3c7e1a95-4d28-4b60-9f13-8e2a5d0c7b46";
const owners = [
  { type: "customer", customer_id: ids.customer },
  { type: "company", company_id: ids.company, branches: { type: "all" } },
  { type: "company", company_id: ids.company, branches: { type: "only", company_location_id: ids.companyLocation } },
];

function surfaceApi(surface) {
  if (surface === "admin") return createAdmin({ baseUrl: apiUrl, apiToken: "arky_api_contract" }).eshop.paymentMethod;
  const make = surface === "initialized" ? initialize : createStorefront;
  return make(publishableKey, { apiUrl, sessionStorage: visitorStorage() }).eshop.paymentMethod;
}

function base(surface) {
  return surface === "admin" ? `/v1/stores/${STORE_ID}/payment-methods` : "/v1/storefront/payment-methods";
}

function target(surface) {
  return surface === "admin" ? { store_id: STORE_ID } : {};
}

for (const surface of ["admin", "storefront", "initialized"]) {
  test(`${surface} saved-method setup keeps the owner, the app-picked id and the explicit consent`, async (context) => {
    const calls = recordFetch(context, () => ({ id: methodId }));
    const api = surfaceApi(surface);
    for (const owner of owners) {
      const request = { ...target(surface), id: methodId, owner, payment_option_id: ids.paymentOption, terms_version: "2026-01", accept_storage_and_off_session_use: true };
      const before = structuredClone(request);
      await api.requestSetup(request);
      assert.deepEqual(request, before);
    }
    assert.equal(calls.length, owners.length);
    calls.forEach((call, index) => {
      assert.equal(call.method, "POST");
      assert.equal(call.path, `${base(surface)}/setup`);
      assert.deepEqual(call.body, { id: methodId, owner: owners[index], payment_option_id: ids.paymentOption, terms_version: "2026-01", accept_storage_and_off_session_use: true });
      if (surface !== "admin") {
        assert.equal(call.headers.get("authorization"), `Bearer ${visitorToken}`);
        assert.equal(call.headers.get("x-arky-publishable-key"), publishableKey);
      }
    });
    for (const id of [undefined, "card", methodId.toUpperCase()]) {
      await assert.rejects(async () => api.requestSetup({ ...target(surface), id, owner: owners[0], payment_option_id: ids.paymentOption, terms_version: "2026-01", accept_storage_and_off_session_use: true }), {
        name: "TypeError",
        message: "The payment method id must be a canonical UUID v4 picked by the app",
      });
    }
    assert.equal(calls.length, owners.length);
  });

  test(`${surface} method discovery and setup steps name the method and carry its version`, async (context) => {
    const calls = recordFetch(context, (call) => call.method === "GET" && call.path === base(surface) ? { items: [], cursor: null } : { id: methodId });
    const api = surfaceApi(surface);
    const filters = { company_id: ids.company, company_location_id: ids.companyLocation, payment_option_id: ids.paymentOption, limit: 5, cursor: "next" };
    await api.find({ ...target(surface), ...filters, ...(surface === "admin" ? { customer_id: ids.customer } : {}) });
    await api.get({ ...target(surface), id: methodId });
    await api.startSetup({ ...target(surface), id: methodId });
    await api.completeSetup({ ...target(surface), id: methodId });
    await api.cancelSetup({ ...target(surface), id: methodId, expected_updated_at: 5 });
    await api.revoke({ ...target(surface), id: methodId, expected_updated_at: 6 });
    const path = `${base(surface)}/${methodId}`;
    assert.deepEqual(calls.map(({ method, path: called, body }) => [method, called, body]), [
      ["GET", base(surface), null],
      ["GET", path, null],
      ["POST", `${path}/setup/start`, null],
      ["POST", `${path}/setup/complete`, null],
      ["POST", `${path}/setup/cancel`, { expected_updated_at: 5 }],
      ["POST", `${path}/revoke`, { expected_updated_at: 6 }],
    ]);
    const expectedQuery = Object.fromEntries(Object.entries(filters).map(([key, value]) => [key, String(value)]));
    if (surface === "admin") expectedQuery.customer_id = ids.customer;
    assert.deepEqual(calls[0].query, expectedQuery);
    assert.ok(calls.every((call) => !call.href.includes("store_id")));
  });
}

test("Admin payment methods refuse a missing store before any request", async (context) => {
  const calls = recordFetch(context, () => ({ id: methodId }));
  const api = surfaceApi("admin");
  await assert.rejects(async () => api.get({ id: methodId }), TypeError);
  await assert.rejects(async () => api.revoke({ store_id: "store", id: methodId, expected_updated_at: 1 }), TypeError);
  assert.equal(calls.length, 0);
});
