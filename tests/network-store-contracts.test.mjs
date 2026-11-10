import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { apiUrl, ids, recordFetch } from "./helpers/arky-fixtures.mjs";

function admin() {
  return createAdmin({ apiUrl, accountToken: `arky_at_${"a".repeat(42)}A` });
}

test("a_store_create_names_its_network_and_plan", async (context) => {
  const calls = recordFetch(context, (call) => ({ id: call.body.id, type: call.body.type }));
  const store = {
    id: ids.store,
    name: "Shop",
    timezone: "Europe/Sarajevo",
    languages: ["en"],
    market: { key: "eu", currency: "eur", tax_mode: "inclusive" },
    sales_channel: { key: "web" },
    location_address: { country: "BA" },
  };
  const client = admin();
  for (const plan of [
    { type: "free", plan_id: ids.plan },
    { type: "card", plan_id: ids.plan, setup_intent_id: "seti_confirmed" },
    { type: "grant", plan_id: ids.plan },
  ]) {
    const input = { ...store, type: { type: "live", network_id: ids.network, plan } };
    assert.deepEqual(await client.store.create(input), { id: ids.store, type: input.type });
    assert.deepEqual(calls.at(-1).body, input);
  }
  await client.store.create({ ...store, id: ids.otherStore, type: { type: "test", store_id: ids.store } });
  assert.deepEqual(calls.at(-1).body.type, { type: "test", store_id: ids.store });
  assert.ok(calls.every((call) => call.path === "/v1/stores" && call.method === "POST" && !("mode" in call.body)));
});

test("network and plan changes keep their target and version", async (context) => {
  const calls = recordFetch(context, () => ({ id: ids.network }));
  const network = admin().network;
  await network.find({ limit: 20, cursor: "next" });
  await network.get({ id: ids.network });
  await network.update({ id: ids.network, expected_updated_at: 3, name: "Network" });
  await network.stripe.set({ id: ids.network, expected_updated_at: 4, publishable_key: "pk_test_fixture", secret_key: "sk_test_fixture", webhook_secret: "whsec_fixture" });
  await network.email.replaceResendKey({ id: ids.network, expected_updated_at: 5, api_key: "re_fixture" });
  await network.plan.find({ network_id: ids.network, limit: 10, cursor: "plans" });
  await network.plan.update({ network_id: ids.network, id: ids.plan, expected_updated_at: 6, price: { type: "monthly", amount: 1000, currency: "eur", months: 1, trial_days: 14 } });
  await network.plan.delete({ network_id: ids.network, id: ids.plan, expected_updated_at: 7 });
  await network.stripe.remove({ id: ids.network, expected_updated_at: 8 });
  await network.delete({ id: ids.network, expected_updated_at: 9 });
  const path = `/v1/networks/${ids.network}`;
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", "/v1/networks", { limit: "20", cursor: "next" }, null],
    ["GET", path, {}, null],
    ["PATCH", path, {}, { expected_updated_at: 3, name: "Network" }],
    ["PUT", `${path}/stripe`, {}, { expected_updated_at: 4, publishable_key: "pk_test_fixture", secret_key: "sk_test_fixture", webhook_secret: "whsec_fixture" }],
    ["PUT", `${path}/email/resend`, {}, { expected_updated_at: 5, api_key: "re_fixture" }],
    ["GET", `${path}/plans`, { limit: "10", cursor: "plans" }, null],
    ["PATCH", `${path}/plans/${ids.plan}`, {}, { expected_updated_at: 6, price: { type: "monthly", amount: 1000, currency: "eur", months: 1, trial_days: 14 } }],
    ["DELETE", `${path}/plans/${ids.plan}`, { expected_updated_at: "7" }, null],
    ["DELETE", `${path}/stripe`, { expected_updated_at: "8" }, null],
    ["DELETE", path, { expected_updated_at: "9" }, null],
  ]);
});

test("store children, wipes and subscription actions send only their own inputs", async (context) => {
  const calls = recordFetch(context, () => ({ id: ids.store }));
  const store = admin().store;
  await store.testStores.find({ store_id: ids.store, limit: 10, cursor: "children" });
  await store.wipe({ id: ids.store, confirmation: "Shop", expected_updated_at: 1 });
  await store.subscription.createCardSetup({ network_id: ids.network, id: ids.picked });
  await store.subscription.setCard({ store_id: ids.store, expected_updated_at: 2, setup_intent_id: "seti_confirmed" });
  await store.subscription.changePlan({ store_id: ids.store, expected_updated_at: 3, plan_id: ids.plan });
  await store.subscription.pendingPayment({ store_id: ids.store });
  await store.subscription.cancel({ store_id: ids.store, expected_updated_at: 4 });
  await store.subscription.grant({ store_id: ids.store, expected_updated_at: 5, plan_id: ids.plan });
  await store.subscription.endGrant({ store_id: ids.store, expected_updated_at: 6, plan_id: ids.plan });
  const path = `/v1/stores/${ids.store}`;
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", `${path}/test-stores`, { limit: "10", cursor: "children" }, null],
    ["POST", `${path}/wipe`, {}, { confirmation: "Shop", expected_updated_at: 1 }],
    ["POST", `/v1/networks/${ids.network}/card-setups`, {}, { id: ids.picked }],
    ["PUT", `${path}/subscription/card`, {}, { expected_updated_at: 2, setup_intent_id: "seti_confirmed" }],
    ["PUT", `${path}/subscription/plan`, {}, { expected_updated_at: 3, plan_id: ids.plan }],
    ["GET", `${path}/subscription/payment`, {}, null],
    ["POST", `${path}/subscription/cancel`, {}, { expected_updated_at: 4 }],
    ["POST", `${path}/subscription/grant`, {}, { expected_updated_at: 5, plan_id: ids.plan }],
    ["POST", `${path}/subscription/end-grant`, {}, { expected_updated_at: 6, plan_id: ids.plan }],
  ]);
});

test("network sign-in requires the exact network before sending its code request", async (context) => {
  const result = { session_id: ids.session, verification_expires_at: 1_900_000_000_000 };
  const calls = recordFetch(context, () => result);
  const auth = createAdmin({ apiUrl }).account.auth;
  assert.deepEqual(await auth.requestCode({ session_id: ids.session, network_id: ids.network, email: "owner@example.test" }), result);
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", "/v1/auth/code", { session_id: ids.session, network_id: ids.network, email: "owner@example.test" }],
  ]);
  for (const network_id of [undefined, "", "network", ids.network.toUpperCase()]) {
    await assert.rejects(auth.requestCode({ session_id: ids.session, network_id, email: "owner@example.test" }), TypeError);
  }
  assert.equal(calls.length, 1);
});

test("billing and network email webhook inspection retains the network on reads and resolutions", async (context) => {
  const calls = recordFetch(context, () => ({ id: ids.picked }));
  const platform = admin().platform;
  await platform.stripeBillingEvent.find({ network_id: ids.network, status: "review", limit: 20, cursor: "billing" });
  await platform.stripeBillingEvent.resolve({ network_id: ids.network, id: ids.picked, expected_updated_at: 2, resolution: "apply" });
  await platform.resendEvent.find({ network_id: ids.network, status: "unmatched", limit: 10, cursor: "email" });
  await platform.resendEvent.resolve({ network_id: ids.network, id: ids.picked, expected_updated_at: 3, resolution: "ignore", reason: "Reviewed" });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", "/v1/platform/incoming-webhooks/stripe-billing", { network_id: ids.network, status: "review", limit: "20", cursor: "billing" }, null],
    ["POST", `/v1/platform/incoming-webhooks/stripe-billing/${ids.picked}/resolve`, {}, { network_id: ids.network, expected_updated_at: 2, resolution: "apply" }],
    ["GET", "/v1/platform/incoming-webhooks/resend", { network_id: ids.network, status: "unmatched", limit: "10", cursor: "email" }, null],
    ["POST", `/v1/platform/incoming-webhooks/resend/${ids.picked}/resolve`, {}, { network_id: ids.network, expected_updated_at: 3, resolution: "ignore", reason: "Reviewed" }],
  ]);
});
