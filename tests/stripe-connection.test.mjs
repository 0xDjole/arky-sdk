import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { errorResponse, ids, recordFetch } from "./helpers/arky-fixtures.mjs";

const STORE_ID = "4c7a2e95-1d38-4b60-8f9e-0a5d3c7b2e14";
const OTHER_STORE_ID = "a7c3e1f5-6b28-4d90-9e4a-2f8d0b6c1e73";

function stripeOption(webhook = { type: "not_created" }) {
  return {
    id: ids.paymentOption,
    store_id: STORE_ID,
    key: "stripe",
    blocks: [],
    status: "active",
    type: { type: "stripe", account_id: "acct_merchant", livemode: false, publishable_key: "pk_test_merchant", charges_enabled: true, account_checked_at: 2, webhook },
    created_at: 1,
    updated_at: 2,
  };
}

function stripe() {
  return createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_stripe" }).store.paymentOption.stripe;
}

test("Stripe is connected with the merchant's own keys under an app-picked id, and every later step names the option and its version", async (context) => {
  const calls = recordFetch(context, () => stripeOption());
  const api = stripe();
  assert.deepEqual(Object.keys(api).sort(), ["connect", "createWebhook", "refresh", "replaceKeys", "rotateWebhookSecret"]);
  const id = ids.paymentOption;
  await api.connect({ store_id: STORE_ID, id, key: "stripe", blocks: [], status: "active", restricted_key: "rk_test_merchant", publishable_key: "pk_test_merchant" });
  await api.createWebhook({ store_id: STORE_ID, id, expected_updated_at: 2 });
  await api.rotateWebhookSecret({ store_id: STORE_ID, id, expected_updated_at: 3, signing_secret: "whsec_next", previous_secret_expires_at: 1_700_000_000_000 });
  await api.replaceKeys({ store_id: STORE_ID, id, expected_updated_at: 4, restricted_key: "rk_test_next", publishable_key: "pk_test_next" });
  await api.refresh({ store_id: STORE_ID, id, expected_updated_at: 5 });
  const base = `/v1/stores/${STORE_ID}/payment-options/stripe`;
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", base, { id, key: "stripe", blocks: [], status: "active", restricted_key: "rk_test_merchant", publishable_key: "pk_test_merchant" }],
    ["POST", `${base}/${id}/create-webhook`, { expected_updated_at: 2 }],
    ["POST", `${base}/${id}/rotate-webhook-secret`, { expected_updated_at: 3, signing_secret: "whsec_next", previous_secret_expires_at: 1_700_000_000_000 }],
    ["POST", `${base}/${id}/replace-keys`, { expected_updated_at: 4, restricted_key: "rk_test_next", publishable_key: "pk_test_next" }],
    ["POST", `${base}/${id}/refresh`, { expected_updated_at: 5 }],
  ]);
});

test("Stripe steps keep the explicit store they were called with and refuse an invented id or store before any request", async (context) => {
  const calls = recordFetch(context, () => stripeOption());
  const client = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_stripe" });
  assert.equal("setStoreId" in client, false);
  const params = { store_id: STORE_ID, id: ids.paymentOption, expected_updated_at: 7, restricted_key: "rk_test_scope", publishable_key: "pk_test_scope" };
  const pending = client.store.paymentOption.stripe.replaceKeys(params);
  params.store_id = OTHER_STORE_ID;
  await pending;
  assert.equal(calls[0].path, `/v1/stores/${STORE_ID}/payment-options/stripe/${ids.paymentOption}/replace-keys`);
  const connect = { store_id: STORE_ID, id: ids.paymentOption, key: "stripe", blocks: [], status: "active", restricted_key: "rk", publishable_key: "pk" };
  for (const id of [undefined, "provider/one", ids.paymentOption.toUpperCase()]) {
    await assert.rejects(async () => client.store.paymentOption.stripe.connect({ ...connect, id }), {
      name: "TypeError",
      message: "The payment option id must be a canonical UUID v4 picked by the app",
    });
  }
  for (const store_id of [undefined, "store/other"]) {
    await assert.rejects(async () => client.store.paymentOption.stripe.connect({ ...connect, store_id }), {
      name: "TypeError",
      message: "A Store target must be an explicit canonical UUID-v4",
    });
    await assert.rejects(async () => client.store.paymentOption.stripe.refresh({ store_id, id: ids.paymentOption, expected_updated_at: 1 }), TypeError);
  }
  assert.equal(calls.length, 1);
});

test("a refused Stripe step propagates the Server's code once without a retry", async (context) => {
  const calls = recordFetch(context, () => errorResponse(409, "PAYMENT_OPTION.STALE", "The payment option changed"));
  await assert.rejects(stripe().createWebhook({ store_id: STORE_ID, id: ids.paymentOption, expected_updated_at: 2 }), (error) => {
    assert.equal(error.statusCode, 409);
    assert.equal(error.code, "PAYMENT_OPTION.STALE");
    return true;
  });
  assert.equal(calls.length, 1);
});
