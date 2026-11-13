import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";
import { isSimulatedPayment as adminIsSimulatedPayment, mountCheckoutAction as adminMountCheckoutAction } from "../dist/admin.js";
import { ids, jsonResponse, recordFetch } from "./helpers/arky-fixtures.mjs";

const storeId = "1b7e4c92-6d35-4a18-8f02-9c3e5a7d1b46";
const optionId = "3c9d1f75-8a26-4e40-b7c1-2d6f8b0e4a93";
const providerId = "7f4a2d18-5c93-4b06-a1e8-6b0d3c9f2e75";
const planId = "9a1d6b34-2f87-4c5e-8d09-4e7b1c3a6f20";
const terms = { en: "Save this card for the store's agreed renewals." };
const body = { id: optionId, key: "card", blocks: [], status: "active", saved_card_terms: terms };

function admin() {
  return createAdmin({ apiUrl: "https://api.example.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
}

function requests(calls) {
  return calls.map(({ method, path, query, body: sent }) => [method, path, query, sent]);
}

test("store.create names a test store's live parent and answers that type, and requestDeletion closes it the ordinary way", async (context) => {
  const store = { id: storeId, name: "Agent test store", timezone: "Europe/Sarajevo", languages: ["en"], type: { type: "test", store_id: ids.store }, status: { type: "active" }, email_sending: { type: "allowed" }, created_at: 1, updated_at: 2 };
  const calls = recordFetch(context, () => store);
  const create = {
    id: storeId,
    type: { type: "test", store_id: ids.store },
    name: "Agent test store",
    timezone: "Europe/Sarajevo",
    languages: ["en"],
    market: { key: "eu", currency: "eur", tax_mode: "inclusive" },
    sales_channel: { key: "web" },
    location_address: { country: "BA", city: "Sarajevo", postal_code: "71000", street1: "1 Test Way" },
  };
  const made = await admin().store.create(create);
  assert.deepEqual(made.type, { type: "test", store_id: ids.store });
  await admin().store.requestDeletion({ id: storeId, confirmation: "Agent test store", expected_updated_at: 2 });
  assert.deepEqual(requests(calls), [
    ["POST", "/v1/stores", {}, create],
    ["POST", `/v1/stores/${storeId}/deletion`, {}, { confirmation: "Agent test store", expected_updated_at: 2 }],
  ]);
});

test("ArkyStripe and ArkyMonri logins connect with a keyless call, and their card options name the login, key, blocks, status and card wording", async (context) => {
  const stripeLogin = { id: providerId, store_id: storeId, type: { type: "arky_stripe", account_id: "acct_arky", livemode: false, publishable_key: "pk_test_arky_store", secret_key: "restricted", charges_enabled: true, account_checked_at: 2, webhook: { type: "awaiting_first_event", endpoint_id: "we_arky", enabled_events: [], previous_signing_secret: null } }, status: "active", created_at: 1, updated_at: 2 };
  const monriLogin = { ...stripeLogin, type: { type: "arky_monri", environment: "test" } };
  const arkyStripe = { id: optionId, store_id: storeId, key: "card", blocks: [], status: "active", type: { type: "arky_stripe", provider_id: providerId, provider_status: "active", provider_updated_at: 2, account_id: "acct_arky", livemode: false, publishable_key: "pk_test_arky_store", charges_enabled: true, account_checked_at: 2, webhook: { type: "awaiting_first_event", endpoint_id: "we_arky", enabled_events: [], previous_signing_secret: null }, saved_card_terms: terms }, created_at: 1, updated_at: 2 };
  const arkyMonri = { ...arkyStripe, type: { type: "arky_monri", provider_id: providerId, provider_status: "active", provider_updated_at: 2, environment: "test", saved_card_terms: terms } };
  const calls = recordFetch(context, (call) => call.path.includes("/store-providers/")
    ? (call.path.endsWith("/arky-stripe") ? stripeLogin : monriLogin)
    : (call.path.endsWith("/arky-stripe") ? arkyStripe : arkyMonri));
  const providers = admin().store.provider;
  const options = admin().store.paymentOption;
  for (const removed of ["arkyStripe", "arkyMonri"]) assert.equal(removed in options, false, removed);
  assert.deepEqual(await providers.connectArkyStripe({ store_id: storeId, id: providerId }), stripeLogin);
  assert.deepEqual(await providers.connectArkyMonri({ store_id: storeId, id: providerId }), monriLogin);
  const params = { store_id: storeId, provider_id: providerId, ...body };
  assert.deepEqual(await options.createArkyStripe(params), arkyStripe);
  assert.deepEqual(await options.createArkyMonri(params), arkyMonri);
  assert.deepEqual(requests(calls), [
    ["POST", `/v1/stores/${storeId}/store-providers/arky-stripe`, {}, { id: providerId }],
    ["POST", `/v1/stores/${storeId}/store-providers/arky-monri`, {}, { id: providerId }],
    ["POST", `/v1/stores/${storeId}/payment-options/arky-stripe`, {}, { provider_id: providerId, ...body }],
    ["POST", `/v1/stores/${storeId}/payment-options/arky-monri`, {}, { provider_id: providerId, ...body }],
  ]);
  await assert.rejects(async () => providers.connectArkyStripe({ store_id: storeId, id: "card" }), TypeError);
  await assert.rejects(async () => providers.connectArkyMonri({ store_id: "shop", id: providerId }), TypeError);
  await assert.rejects(async () => options.createArkyStripe({ ...params, id: "card" }), TypeError);
  await assert.rejects(async () => options.createArkyMonri({ ...params, id: "card" }), TypeError);
  await assert.rejects(async () => options.createArkyStripe({ ...params, store_id: "shop" }), TypeError);
  assert.equal(calls.length, 4);
});

test("Admin filters payment options by the Arky types", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: null }));
  await admin().store.paymentOption.find({ store_id: storeId, type_name: "arky_stripe" });
  await admin().store.paymentOption.find({ store_id: storeId, type_name: "arky_monri" });
  assert.deepEqual(calls.map((call) => call.query.type_name), ["arky_stripe", "arky_monri"]);
});

test("ArkyResend connects with a keyless call that names the login and its domains", async (context) => {
  const connection = { id: providerId, store_id: storeId, type: { type: "arky_resend" }, status: "active", created_at: 1, updated_at: 2 };
  const calls = recordFetch(context, () => connection);
  const api = admin().store.provider;
  const params = { store_id: storeId, id: providerId, domains: ["shop.example.test"] };
  assert.deepEqual(await api.connectArkyResend(params), connection);
  assert.deepEqual(requests(calls), [
    ["POST", `/v1/stores/${storeId}/store-providers/arky-resend`, {}, { id: providerId, domains: ["shop.example.test"] }],
  ]);
  await assert.rejects(async () => api.connectArkyResend({ ...params, id: "resend" }), TypeError);
  await assert.rejects(async () => api.connectArkyResend({ ...params, store_id: "shop" }), TypeError);
  assert.equal(calls.length, 1);
  assert.equal("emailProvider" in admin().notification, false);
});

test("pay, decline and expire each post to the store's own control with no body and answer nothing", async (context) => {
  const calls = recordFetch(context, () => new Response(null, { status: 204 }));
  const { payments } = admin().store.simulator;
  const params = { store_id: storeId, payment_id: ids.payment };
  assert.equal(await payments.pay(params), undefined);
  assert.equal(await payments.decline(params), undefined);
  assert.equal(await payments.expire(params), undefined);
  await payments.pay({ store_id: storeId, payment_id: "payment/one" });
  const base = `/v1/stores/${storeId}/simulator/payments`;
  assert.deepEqual(requests(calls), [
    ["POST", `${base}/${ids.payment}/pay`, {}, null],
    ["POST", `${base}/${ids.payment}/decline`, {}, null],
    ["POST", `${base}/${ids.payment}/expire`, {}, null],
    ["POST", `${base}/payment%2Fone/pay`, {}, null],
  ]);
  for (const call of calls) assert.equal(call.headers.get("authorization"), "Bearer arky_at_ttttttttttttttttttttttttttttttttttttttttttA");
  await assert.rejects(async () => payments.pay({ store_id: "shop", payment_id: ids.payment }), TypeError);
  assert.equal(calls.length, 4);
});

test("a control's refusal reaches the caller as Arky's own error", async (context) => {
  recordFetch(context, () => jsonResponse({ message: "This store is live", error: "SIMULATOR.LIVE_STORE", status_code: 403, validation_errors: [] }, 403));
  await assert.rejects(admin().store.simulator.payments.pay({ store_id: storeId, payment_id: ids.payment }), (error) => {
    assert.equal(error.code, "SIMULATOR.LIVE_STORE");
    assert.equal(error.statusCode, 403);
    return true;
  });
});

test("emails.find reads a page of the store's simulated emails, for one recipient when named", async (context) => {
  const email = { id: "em_1", from: "shop@shop.example.test", to: ["buyer@example.test"], cc: [], bcc: [], reply_to: [], subject: "Your code", html: null, text: "123456", headers: {}, tags: [{ name: "store_id", value: storeId }], message_id: "<em_1@simulator>", last_event: "email.sent", idempotency_key: null, created_at: 5 };
  const calls = recordFetch(context, () => ({ items: [email], cursor: "next" }));
  const { emails } = admin().store.simulator;
  assert.deepEqual(await emails.find({ store_id: storeId, to: "buyer@example.test", limit: 10, cursor: "previous" }), { items: [email], cursor: "next" });
  assert.deepEqual(await emails.find({ store_id: storeId }), { items: [email], cursor: "next" });
  const path = `/v1/stores/${storeId}/simulator/emails`;
  assert.deepEqual(requests(calls), [
    ["GET", path, { to: "buyer@example.test", limit: "10", cursor: "previous" }, null],
    ["GET", path, {}, null],
  ]);
});

test("sms.find reads a page of the store's simulated SMS, for one number when named", async (context) => {
  const sms = { id: "SM1", from: "+15005550006", to: "+38761000001", body: "Your sign-in code is 123456.", status: "queued", error_code: null, created_at: 5 };
  const calls = recordFetch(context, () => ({ items: [sms], cursor: "next" }));
  const { sms: simulated } = admin().store.simulator;
  assert.deepEqual(await simulated.find({ store_id: storeId, to: "+38761000001", limit: 10, cursor: "previous" }), { items: [sms], cursor: "next" });
  assert.deepEqual(await simulated.find({ store_id: storeId }), { items: [sms], cursor: "next" });
  const path = `/v1/stores/${storeId}/simulator/sms`;
  assert.deepEqual(requests(calls), [
    ["GET", path, { to: "+38761000001", limit: "10", cursor: "previous" }, null],
    ["GET", path, {}, null],
  ]);
});

test("calls.start rings one of the store's simulated numbers from a caller or a withheld number and answers the call", async (context) => {
  const call = { id: "CA1", from: "+15550001111", to: "+38761000001", status: "in-progress", created_at: 5 };
  const withheld = { ...call, id: "CA2", from: null };
  const calls = recordFetch(context, (_call, index) => (index === 1 ? call : withheld));
  const { calls: simulated } = admin().store.simulator;
  const request = { store_id: storeId, to: "+38761000001", from: "+15550001111" };
  const original = structuredClone(request);
  assert.deepEqual(await simulated.start(request), call);
  assert.deepEqual(request, original);
  assert.deepEqual(await simulated.start({ store_id: storeId, to: "+38761000001", from: null }), withheld);
  const path = `/v1/stores/${storeId}/simulator/calls`;
  assert.deepEqual(requests(calls), [
    ["POST", path, {}, { to: "+38761000001", from: "+15550001111" }],
    ["POST", path, {}, { to: "+38761000001", from: null }],
  ]);
  await assert.rejects(async () => simulated.start({ store_id: "shop", to: "+38761000001", from: null }), TypeError);
  assert.equal(calls.length, 2);
});

test("planned outcomes are made under the app's id, listed and removed through the store's own path", async (context) => {
  const plan = { id: planId, provider: "resend", operation: "send_email", matching: { type: "to", address: "buyer@example.test" }, outcome: { type: "rate_limited", retry_after_seconds: 2 }, created_at: 7 };
  const calls = recordFetch(context, (call) => (call.method === "POST" ? plan : call.method === "DELETE" ? { deleted: true } : { items: [plan], cursor: null }));
  const { plannedOutcomes } = admin().store.simulator;
  const { created_at: _createdAt, ...request } = plan;
  assert.deepEqual(await plannedOutcomes.create({ store_id: storeId, ...request }), plan);
  assert.deepEqual(await plannedOutcomes.find({ store_id: storeId, limit: 5, cursor: "previous" }), { items: [plan], cursor: null });
  assert.deepEqual(await plannedOutcomes.remove({ store_id: storeId, id: planId }), { deleted: true });
  const path = `/v1/stores/${storeId}/simulator/planned-outcomes`;
  assert.deepEqual(requests(calls), [
    ["POST", path, {}, request],
    ["GET", path, { limit: "5", cursor: "previous" }, null],
    ["DELETE", `${path}/${planId}`, {}, null],
  ]);
  await assert.rejects(async () => plannedOutcomes.create({ store_id: storeId, ...request, id: "plan-1" }), TypeError);
  assert.equal(calls.length, 3);
});

test("the Admin entry point carries the simulator helpers and the mounts Admin's own screens use", async () => {
  assert.equal(adminIsSimulatedPayment({ type: "none" }), false);
  assert.equal(await adminMountCheckoutAction({ action: { type: "none" }, element: "#payment" }), null);
});
