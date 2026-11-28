import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { errorResponse, ids, recordFetch } from "./helpers/arky-fixtures.mjs";

const TENANT_ID = "9a4c2e71-5d38-4b06-8f1a-2c7e9b3d5f40";
const OTHER_TENANT_ID = "1f6b8d23-4e97-4a50-b2c8-7d0e5a9c3f16";
const savedCardTerms = { bs: "Kartica će se koristiti za vaše prihvaćene obnove." };

const PROVIDER_ID = "3d8a5c17-6e29-4b40-9f1c-8a2e7d5b0c63";

function admin() {
  return createAdmin({ apiUrl: "https://api.example.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
}

function paymentOptions() {
  return admin().tenant.paymentOption;
}

function providers() {
  return admin().tenant.provider;
}

test("a Monri login is connected with the app-picked id and explicit credentials once to the named tenant and returns the safe record", async (context) => {
  let failure = null;
  const login = { id: PROVIDER_ID, tenant_id: TENANT_ID, type: { type: "monri", environment: "test" }, status: "active", created_at: 1, updated_at: 1 };
  const calls = recordFetch(context, () => failure ? errorResponse(failure) : login);
  const api = providers();
  const input = { id: PROVIDER_ID, environment: "test", merchant_key: "submitted-secret", authenticity_token: "submitted-token" };
  for (const tenant_id of [TENANT_ID, OTHER_TENANT_ID]) {
    assert.deepEqual(await api.connectMonri({ ...input, tenant_id }), login);
    const call = calls.at(-1);
    assert.equal(call.path, `/v1/tenants/${tenant_id}/tenant-providers/monri`);
    assert.equal(call.method, "POST");
    assert.deepEqual(call.body, input);
  }
  assert.equal(calls.length, 2);
  for (const tenant_id of [undefined, "default", "selected"]) {
    await assert.rejects(async () => api.connectMonri({ ...input, tenant_id }), TypeError);
  }
  for (const id of [undefined, "provider", PROVIDER_ID.toUpperCase()]) {
    await assert.rejects(async () => api.connectMonri({ ...input, id, tenant_id: TENANT_ID }), {
      name: "TypeError",
      message: "The tenant provider id must be a canonical UUID v4 picked by the app",
    });
  }
  assert.equal(calls.length, 2);
  for (const status of [403, 409, 503]) {
    failure = status;
    await assert.rejects(api.connectMonri({ ...input, tenant_id: TENANT_ID }), (error) => error.statusCode === status);
  }
  assert.equal(calls.length, 5);
});

test("a Monri card option names its login, its saved-card wording and its own app-picked id, and sends no credentials", async (context) => {
  const result = { id: ids.paymentOption, tenant_id: TENANT_ID, key: "cards", blocks: [], status: "disabled", type: { type: "monri", provider_id: PROVIDER_ID, provider_status: "active", provider_updated_at: 1, environment: "test", saved_card_terms: savedCardTerms }, created_at: 1, updated_at: 1 };
  const calls = recordFetch(context, () => result);
  const input = { provider_id: PROVIDER_ID, id: ids.paymentOption, key: "cards", blocks: [], status: "disabled", saved_card_terms: savedCardTerms };
  assert.deepEqual(await paymentOptions().createMonri({ ...input, tenant_id: TENANT_ID }), result);
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/tenants/${TENANT_ID}/payment-options/monri`, input],
  ]);
  for (const removed of ["environment", "merchant_key", "authenticity_token", "tenant_id"]) assert.equal(removed in calls[0].body, false, removed);
  await assert.rejects(async () => paymentOptions().createMonri({ ...input, id: "cards", tenant_id: TENANT_ID }), {
    name: "TypeError",
    message: "The payment option id must be a canonical UUID v4 picked by the app",
  });
  assert.equal(calls.length, 1);
  assert.equal("monri" in paymentOptions(), false);
});

test("a new Monri merchant key replaces the saved one with the login's version, keeping the authenticity token", async (context) => {
  let failure = null;
  const result = { id: PROVIDER_ID, tenant_id: TENANT_ID, type: { type: "monri", environment: "live" }, status: "active", created_at: 1, updated_at: 3 };
  const calls = recordFetch(context, () => failure ? errorResponse(409, failure, "Refused") : result);
  const api = providers();
  const request = { tenant_id: TENANT_ID, id: PROVIDER_ID, expected_updated_at: 2, merchant_key: "next-merchant-key" };
  assert.deepEqual(await api.replaceMonriMerchantKey(request), result);
  await api.replaceMonriMerchantKey({ ...request, tenant_id: OTHER_TENANT_ID, id: "login/one" });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/tenants/${TENANT_ID}/tenant-providers/monri/${PROVIDER_ID}/replace-merchant-key`, { expected_updated_at: 2, merchant_key: "next-merchant-key" }],
    ["POST", `/v1/tenants/${OTHER_TENANT_ID}/tenant-providers/monri/login%2Fone/replace-merchant-key`, { expected_updated_at: 2, merchant_key: "next-merchant-key" }],
  ]);
  for (const removed of ["authenticity_token", "environment", "tenant_id", "id"]) assert.equal(removed in calls[0].body, false, removed);
  await assert.rejects(async () => api.replaceMonriMerchantKey({ ...request, tenant_id: "default" }), TypeError);
  assert.equal(calls.length, 2);
  for (const code of ["PAYMENT_OPTION.MERCHANT_KEY_UNCHANGED", "PAYMENT_OPTION.NOT_MONRI"]) {
    failure = code;
    await assert.rejects(api.replaceMonriMerchantKey(request), (error) => error.statusCode === 409 && error.code === code);
  }
  assert.equal(calls.length, 4);
});

test("payment option availability sends the version, blocks and status without resending credentials", async (context) => {
  const result = { id: ids.paymentOption, tenant_id: TENANT_ID, status: "disabled", type: { type: "monri", provider_id: PROVIDER_ID, provider_status: "active", provider_updated_at: 1, environment: "test", saved_card_terms: savedCardTerms } };
  const calls = recordFetch(context, () => result);
  const input = { tenant_id: TENANT_ID, id: ids.paymentOption, expected_updated_at: 1000, blocks: [], status: "disabled", saved_card_terms: savedCardTerms };
  assert.deepEqual(await paymentOptions().update(input), result);
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["PUT", `/v1/tenants/${TENANT_ID}/payment-options/${ids.paymentOption}`, { expected_updated_at: 1000, blocks: [], status: "disabled", saved_card_terms: savedCardTerms }],
  ]);
});

test("a local payment option update explicitly carries no saved-card wording", async (context) => {
  const result = { id: ids.paymentOption, tenant_id: TENANT_ID, status: "active", type: { type: "manual" } };
  const calls = recordFetch(context, () => result);
  await paymentOptions().update({ tenant_id: TENANT_ID, id: ids.paymentOption, expected_updated_at: 1001, blocks: [], status: "active", saved_card_terms: null });
  assert.deepEqual(calls[0].body, { expected_updated_at: 1001, blocks: [], status: "active", saved_card_terms: null });
});

test("payment options are listed with native filters and read by id or by key", async (context) => {
  const calls = recordFetch(context, (call) => call.path.endsWith("payment-options") ? { items: [], cursor: null } : { id: ids.paymentOption });
  const api = paymentOptions();
  await api.find({ tenant_id: TENANT_ID, limit: 5, cursor: "next" });
  await api.get({ tenant_id: TENANT_ID, id: ids.paymentOption });
  await api.getByKey({ tenant_id: TENANT_ID, key: "cards/eu" });
  assert.deepEqual(calls.map(({ path, query }) => [path, query]), [
    [`/v1/tenants/${TENANT_ID}/payment-options`, { limit: "5", cursor: "next" }],
    [`/v1/tenants/${TENANT_ID}/payment-options/${ids.paymentOption}`, {}],
    [`/v1/tenants/${TENANT_ID}/payment-options/key/cards%2Feu`, {}],
  ]);
});
