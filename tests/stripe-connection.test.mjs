import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { errorResponse, ids, recordFetch } from "./helpers/arky-fixtures.mjs";

const TENANT_ID = "4c7a2e95-1d38-4b60-8f9e-0a5d3c7b2e14";
const OTHER_TENANT_ID = "a7c3e1f5-6b28-4d90-9e4a-2f8d0b6c1e73";
const savedCardTerms = { en: "Save this card for the Tenant's agreed renewals.", bs: "Sačuvaj karticu za prihvaćene obnove." };

const PROVIDER_ID = "6e1a9c42-3b75-4d08-8f2e-5c9d1a7b3e60";

function stripeLogin(webhook = { type: "not_configured" }) {
  return {
    id: PROVIDER_ID,
    tenant_id: TENANT_ID,
    type: { type: "stripe", account_id: "acct_merchant", livemode: false, publishable_key: "pk_test_merchant", secret_key: "restricted", charges_enabled: true, account_checked_at: 2, webhook },
    status: "active",
    created_at: 1,
    updated_at: 2,
  };
}

function stripeOption(webhook = { type: "not_configured" }) {
  return {
    id: ids.paymentOption,
    tenant_id: TENANT_ID,
    key: "stripe",
    blocks: [],
    status: "active",
    type: { type: "stripe", provider_id: PROVIDER_ID, provider_status: "active", provider_updated_at: 2, account_id: "acct_merchant", livemode: false, publishable_key: "pk_test_merchant", charges_enabled: true, account_checked_at: 2, webhook, saved_card_terms: savedCardTerms },
    created_at: 1,
    updated_at: 2,
  };
}

function admin() {
  return createAdmin({ apiUrl: "https://api.example.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
}

function stripe() {
  return admin().tenant.provider;
}

test("Stripe is connected with the merchant's own keys under an app-picked id, every later step names the login and its version, and a card option names the login", async (context) => {
  const calls = recordFetch(context, (call) => call.path.includes("/payment-options") ? stripeOption() : stripeLogin());
  const api = stripe();
  for (const removed of ["createWebhook", "rotateWebhookSecret"]) assert.equal(removed in api, false, removed);
  for (const removed of ["stripe", "arkyStripe"]) assert.equal(removed in admin().tenant.paymentOption, false, removed);
  const id = PROVIDER_ID;
  await api.connectStripe({ tenant_id: TENANT_ID, id, restricted_key: "rk_test_merchant", publishable_key: "pk_test_merchant" });
  await api.saveStripeWebhookSecret({ tenant_id: TENANT_ID, id, expected_updated_at: 2, signing_secret: "whsec_first", previous_secret_expires_at: null });
  await api.saveStripeWebhookSecret({ tenant_id: TENANT_ID, id, expected_updated_at: 3, signing_secret: "whsec_next", previous_secret_expires_at: 1_700_000_000_000 });
  await api.replaceStripeKeys({ tenant_id: TENANT_ID, id, expected_updated_at: 4, restricted_key: "rk_test_next", publishable_key: "pk_test_next" });
  await api.refreshStripe({ tenant_id: TENANT_ID, id, expected_updated_at: 5 });
  assert.deepEqual(await admin().tenant.paymentOption.createStripe({ tenant_id: TENANT_ID, provider_id: id, id: ids.paymentOption, key: "stripe", blocks: [], status: "active", saved_card_terms: savedCardTerms }), stripeOption());
  const base = `/v1/tenants/${TENANT_ID}/tenant-providers/stripe`;
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", base, { id, restricted_key: "rk_test_merchant", publishable_key: "pk_test_merchant" }],
    ["POST", `${base}/${id}/webhook-secret`, { expected_updated_at: 2, signing_secret: "whsec_first", previous_secret_expires_at: null }],
    ["POST", `${base}/${id}/webhook-secret`, { expected_updated_at: 3, signing_secret: "whsec_next", previous_secret_expires_at: 1_700_000_000_000 }],
    ["POST", `${base}/${id}/replace-keys`, { expected_updated_at: 4, restricted_key: "rk_test_next", publishable_key: "pk_test_next" }],
    ["POST", `${base}/${id}/refresh`, { expected_updated_at: 5 }],
    ["POST", `/v1/tenants/${TENANT_ID}/payment-options/stripe`, { provider_id: id, id: ids.paymentOption, key: "stripe", blocks: [], status: "active", saved_card_terms: savedCardTerms }],
  ]);
});

test("checking a Stripe login's setup is a live read of the webhook the merchant makes and every problem found", async (context) => {
  const setup = {
    webhook_address: "https://api.example.test/v1/webhooks/stripe",
    events: ["checkout.session.completed", "payment_intent.succeeded", "charge.refunded"],
    webhook_id: "we_merchant",
    problems: [
      { type: "charges_disabled" },
      { type: "webhook_secret_missing" },
      { type: "webhook_unreadable" },
      { type: "webhook_missing" },
      { type: "webhook_duplicated", webhook_ids: ["we_merchant", "we_other"] },
      { type: "webhook_disabled" },
      { type: "webhook_events_missing", events: ["charge.refunded"] },
      { type: "webhook_replaced", saved_webhook_id: "we_previous" },
    ],
  };
  const calls = recordFetch(context, () => setup);
  assert.deepEqual(await stripe().checkStripeSetup({ tenant_id: TENANT_ID, id: PROVIDER_ID }), setup);
  await stripe().checkStripeSetup({ tenant_id: TENANT_ID, id: "login/one" });
  const base = `/v1/tenants/${TENANT_ID}/tenant-providers/stripe`;
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", `${base}/${PROVIDER_ID}/setup`, {}, null],
    ["GET", `${base}/login%2Fone/setup`, {}, null],
  ]);
  await assert.rejects(async () => stripe().checkStripeSetup({ tenant_id: "tenant/other", id: PROVIDER_ID }), TypeError);
  assert.equal(calls.length, 2);
});

test("Stripe steps keep the explicit tenant they were called with and refuse an invented id or tenant before any request", async (context) => {
  const calls = recordFetch(context, () => stripeLogin());
  const client = admin();
  assert.equal("setTenantId" in client, false);
  const params = { tenant_id: TENANT_ID, id: PROVIDER_ID, expected_updated_at: 7, restricted_key: "rk_test_scope", publishable_key: "pk_test_scope" };
  const pending = client.tenant.provider.replaceStripeKeys(params);
  params.tenant_id = OTHER_TENANT_ID;
  await pending;
  assert.equal(calls[0].path, `/v1/tenants/${TENANT_ID}/tenant-providers/stripe/${PROVIDER_ID}/replace-keys`);
  const connect = { tenant_id: TENANT_ID, id: PROVIDER_ID, restricted_key: "rk", publishable_key: "pk" };
  for (const id of [undefined, "provider/one", PROVIDER_ID.toUpperCase()]) {
    await assert.rejects(async () => client.tenant.provider.connectStripe({ ...connect, id }), {
      name: "TypeError",
      message: "The tenant provider id must be a canonical UUID v4 picked by the app",
    });
  }
  const option = { tenant_id: TENANT_ID, provider_id: PROVIDER_ID, id: ids.paymentOption, key: "stripe", blocks: [], status: "active", saved_card_terms: savedCardTerms };
  for (const id of [undefined, "option/one", ids.paymentOption.toUpperCase()]) {
    await assert.rejects(async () => client.tenant.paymentOption.createStripe({ ...option, id }), {
      name: "TypeError",
      message: "The payment option id must be a canonical UUID v4 picked by the app",
    });
  }
  for (const tenant_id of [undefined, "tenant/other"]) {
    await assert.rejects(async () => client.tenant.provider.connectStripe({ ...connect, tenant_id }), {
      name: "TypeError",
      message: "A Tenant target must be an explicit canonical UUID-v4",
    });
    await assert.rejects(async () => client.tenant.provider.refreshStripe({ tenant_id, id: PROVIDER_ID, expected_updated_at: 1 }), TypeError);
  }
  assert.equal(calls.length, 1);
});

test("editing Stripe wording sends its exact languages and version without changing merchant keys", async (context) => {
  const changedTerms = { bs: "Nova izričita saglasnost.\n\nSamo ugovorene obnove." };
  const result = stripeOption();
  result.type.saved_card_terms = changedTerms;
  const calls = recordFetch(context, () => result);
  const api = admin().tenant.paymentOption;
  assert.deepEqual(await api.update({ tenant_id: TENANT_ID, id: ids.paymentOption, expected_updated_at: 7, blocks: [], status: "active", saved_card_terms: changedTerms }), result);
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["PUT", `/v1/tenants/${TENANT_ID}/payment-options/${ids.paymentOption}`, { expected_updated_at: 7, blocks: [], status: "active", saved_card_terms: changedTerms }],
  ]);
  assert.equal(result.type.saved_card_terms.en, undefined);
});

test("a refused Stripe step propagates the Server's code once without a retry", async (context) => {
  const calls = recordFetch(context, () => errorResponse(409, "PAYMENT_OPTION.STALE", "The payment option changed"));
  await assert.rejects(stripe().saveStripeWebhookSecret({ tenant_id: TENANT_ID, id: PROVIDER_ID, expected_updated_at: 2, signing_secret: "whsec_first", previous_secret_expires_at: null }), (error) => {
    assert.equal(error.statusCode, 409);
    assert.equal(error.code, "PAYMENT_OPTION.STALE");
    return true;
  });
  assert.equal(calls.length, 1);
});
