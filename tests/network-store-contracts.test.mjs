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
    { type: "card", plan_id: ids.plan, network_provider_id: ids.picked, setup_intent_id: "seti_confirmed" },
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

test("network, login and plan changes keep their target and version", async (context) => {
  const calls = recordFetch(context, () => ({ id: ids.network }));
  const network = admin().network;
  const network_id = ids.network;
  const id = ids.picked;
  const sender = { from_name: "Network", from_address: "sign-in@network.example.test", sign_in_subject: "Your code", sign_in_body: "Code {{code}}" };
  await network.find({ limit: 20, cursor: "next" });
  await network.get({ id: network_id });
  await network.create({ id: network_id, name: "Network" });
  await network.update({ id: network_id, expected_updated_at: 3, name: "Network" });
  await network.provider.find({ network_id, limit: 50 });
  await network.provider.get({ network_id, id });
  await network.provider.connectResend({ network_id, id, api_key: "re_fixture", ...sender, store_addresses: { type: "domain", domain: "shops.network.example.test" } });
  await network.provider.replaceResendKey({ network_id, id, expected_updated_at: 4, api_key: "re_next" });
  await network.provider.updateResend({ network_id, id, expected_updated_at: 5, ...sender, store_addresses: { type: "off" } });
  await network.provider.connectStripe({ network_id, id, publishable_key: "pk_test_fixture", secret_key: "rk_test_fixture", webhook_secret: "whsec_fixture" });
  await network.provider.replaceStripeKeys({ network_id, id, expected_updated_at: 6, publishable_key: "pk_test_next", secret_key: "rk_test_next", webhook_secret: "whsec_next" });
  await network.provider.connectTwilio({ network_id, id, account_sid: `AC${"0".repeat(32)}`, auth_token: "twilio-token" });
  await network.provider.replaceTwilioAuthToken({ network_id, id, expected_updated_at: 7, auth_token: "twilio-next" });
  await network.provider.connectElevenLabs({ network_id, id, api_key: "el_fixture", region: "eu" });
  await network.provider.setUpElevenLabsAgain({ network_id, id, expected_updated_at: 8 });
  await network.provider.setStatus({ network_id, id, expected_updated_at: 9, status: "disabled" });
  await network.provider.delete({ network_id, id, expected_updated_at: 10 });
  await network.plan.find({ network_id, limit: 10, cursor: "plans" });
  await network.plan.update({ network_id, id: ids.plan, expected_updated_at: 11, price: { type: "monthly", amount: 1000, currency: "eur", months: 1, per: "staff_calendar", trial_days: 14 } });
  await network.plan.delete({ network_id, id: ids.plan, expected_updated_at: 12 });
  await network.delete({ id: network_id, expected_updated_at: 13 });
  const path = `/v1/networks/${network_id}`;
  const providers = `${path}/providers`;
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", "/v1/networks", { limit: "20", cursor: "next" }, null],
    ["GET", path, {}, null],
    ["POST", "/v1/networks", {}, { id: network_id, name: "Network" }],
    ["PATCH", path, {}, { expected_updated_at: 3, name: "Network" }],
    ["GET", providers, { limit: "50" }, null],
    ["GET", `${providers}/${id}`, {}, null],
    ["POST", `${providers}/resend`, {}, { id, api_key: "re_fixture", ...sender, store_addresses: { type: "domain", domain: "shops.network.example.test" } }],
    ["PUT", `${providers}/${id}/resend-key`, {}, { expected_updated_at: 4, api_key: "re_next" }],
    ["PUT", `${providers}/${id}/resend`, {}, { expected_updated_at: 5, ...sender, store_addresses: { type: "off" } }],
    ["POST", `${providers}/stripe`, {}, { id, publishable_key: "pk_test_fixture", secret_key: "rk_test_fixture", webhook_secret: "whsec_fixture" }],
    ["PUT", `${providers}/${id}/stripe-keys`, {}, { expected_updated_at: 6, publishable_key: "pk_test_next", secret_key: "rk_test_next", webhook_secret: "whsec_next" }],
    ["POST", `${providers}/twilio`, {}, { id, account_sid: `AC${"0".repeat(32)}`, auth_token: "twilio-token" }],
    ["PUT", `${providers}/${id}/twilio-auth-token`, {}, { expected_updated_at: 7, auth_token: "twilio-next" }],
    ["POST", `${providers}/elevenlabs`, {}, { id, api_key: "el_fixture", region: "eu" }],
    ["POST", `${providers}/${id}/elevenlabs-setup`, {}, { expected_updated_at: 8 }],
    ["PUT", `${providers}/${id}/status`, {}, { expected_updated_at: 9, status: "disabled" }],
    ["DELETE", `${providers}/${id}`, { expected_updated_at: "10" }, null],
    ["GET", `${path}/plans`, { limit: "10", cursor: "plans" }, null],
    ["PATCH", `${path}/plans/${ids.plan}`, {}, { expected_updated_at: 11, price: { type: "monthly", amount: 1000, currency: "eur", months: 1, per: "staff_calendar", trial_days: 14 } }],
    ["DELETE", `${path}/plans/${ids.plan}`, { expected_updated_at: "12" }, null],
    ["DELETE", path, { expected_updated_at: "13" }, null],
  ]);
  for (const removed of ["stripe", "email"]) assert.equal(removed in network, false, removed);
  for (const connect of ["connectResend", "connectStripe", "connectTwilio", "connectElevenLabs"]) {
    await assert.rejects(async () => network.provider[connect]({ network_id, id: "login" }), TypeError);
  }
  await assert.rejects(async () => network.create({ id: "network", name: "Network" }), TypeError);
  assert.equal(calls.length, 21);
});

test("store children, wipes and subscription actions send only their own inputs", async (context) => {
  const calls = recordFetch(context, () => ({ id: ids.store }));
  const store = admin().store;
  await store.testStores.find({ store_id: ids.store, limit: 10, cursor: "children" });
  await store.wipe({ id: ids.store, confirmation: "Shop", expected_updated_at: 1 });
  await store.subscription.createCardSetup({ network_id: ids.network, id: ids.picked });
  await store.subscription.setCard({ store_id: ids.store, expected_updated_at: 2, network_provider_id: ids.picked, setup_intent_id: "seti_confirmed" });
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
    ["PUT", `${path}/subscription/card`, {}, { expected_updated_at: 2, network_provider_id: ids.picked, setup_intent_id: "seti_confirmed" }],
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

test("billing and network email webhook inspection retains the network and its login on reads and resolutions", async (context) => {
  const calls = recordFetch(context, () => ({ id: ids.picked }));
  const platform = admin().platform;
  const network_provider_id = ids.plan;
  await platform.stripeBillingEvent.find({ network_id: ids.network, network_provider_id, status: "review", limit: 20, cursor: "billing" });
  await platform.stripeBillingEvent.resolve({ network_id: ids.network, network_provider_id, id: ids.picked, expected_updated_at: 2, resolution: "apply" });
  await platform.resendEvent.find({ network_id: ids.network, network_provider_id, status: "unmatched", limit: 10, cursor: "email" });
  await platform.resendEvent.resolve({ network_id: ids.network, network_provider_id, id: ids.picked, expected_updated_at: 3, resolution: "ignore", reason: "Reviewed" });
  await platform.resendEvent.resolve({ network_id: ids.network, network_provider_id, id: ids.picked, expected_updated_at: 4, resolution: "apply" });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", "/v1/platform/incoming-webhooks/stripe-billing", { network_id: ids.network, network_provider_id, status: "review", limit: "20", cursor: "billing" }, null],
    ["POST", `/v1/platform/incoming-webhooks/stripe-billing/${ids.picked}/resolve`, {}, { network_id: ids.network, network_provider_id, expected_updated_at: 2, resolution: "apply" }],
    ["GET", "/v1/platform/incoming-webhooks/resend", { network_id: ids.network, network_provider_id, status: "unmatched", limit: "10", cursor: "email" }, null],
    ["POST", `/v1/platform/incoming-webhooks/resend/${ids.picked}/resolve`, {}, { network_id: ids.network, network_provider_id, expected_updated_at: 3, resolution: "ignore", reason: "Reviewed" }],
    ["POST", `/v1/platform/incoming-webhooks/resend/${ids.picked}/resolve`, {}, { network_id: ids.network, network_provider_id, expected_updated_at: 4, resolution: "apply" }],
  ]);
});

test("a network's stores page by the network with the opaque continuation", async (context) => {
  const store = { id: ids.store, name: "Shop", timezone: "Europe/Sarajevo", languages: ["en"], type: { type: "live", account_id: ids.account, network_id: ids.network }, status: { type: "active" }, email_sending: { type: "allowed" }, created_at: 2, updated_at: 2 };
  const calls = recordFetch(context, (_call, count) => count === 1 ? { items: [store], cursor: "next:+/=" } : { items: [], cursor: null });
  const stores = admin().network.store;
  const first = await stores.find({ network_id: ids.network, limit: 1 });
  assert.deepEqual(first, { items: [store], cursor: "next:+/=" });
  await stores.find({ network_id: ids.network, limit: 1, cursor: first.cursor });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", `/v1/networks/${ids.network}/stores`, { limit: "1" }, null],
    ["GET", `/v1/networks/${ids.network}/stores`, { limit: "1", cursor: "next:+/=" }, null],
  ]);
  for (const network_id of [undefined, "", "network", ids.network.toUpperCase()]) {
    await assert.rejects(async () => stores.find({ network_id }), TypeError);
  }
  assert.equal(calls.length, 2);
});

test("network roles, members and store agreements keep their network, target and version", async (context) => {
  const calls = recordFetch(context, () => ({ id: ids.picked }));
  const client = admin();
  const network = client.network;
  const network_id = ids.network;
  const id = ids.picked;
  const permissions = [{ type: "stores", access: "write" }, { type: "support" }];
  await network.role.find({ network_id, limit: 20, cursor: "roles" });
  await network.role.get({ network_id, id });
  await network.role.create({ network_id, id, key: "support", permissions });
  await network.role.update({ network_id, id, expected_updated_at: 2, key: "support", permissions: [{ type: "admin" }] });
  await network.role.delete({ network_id, id, expected_updated_at: 3 });
  await network.member.find({ network_id, limit: 10, cursor: "members" });
  await network.member.invite({ network_id, id, contact: { email: "team@example.test", language: "bs" }, role_ids: [ids.plan] });
  await network.member.updateRoles({ network_id, id, expected_updated_at: 4, role_ids: [ids.plan] });
  await network.member.changeStatus({ network_id, id, expected_updated_at: 5, status: { type: "disabled" } });
  await network.member.remove({ network_id, id, expected_updated_at: 6 });
  await network.member.resetSecondFactor({ network_id, id });
  await network.member.getOwn({ network_id });
  await network.member.acceptInvite({ network_id, expected_updated_at: 7 });
  await network.store.getAgreement({ network_id, store_id: ids.store });
  await client.store.agreement.get({ store_id: ids.store });
  const path = `/v1/networks/${network_id}`;
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", `${path}/roles`, { limit: "20", cursor: "roles" }, null],
    ["GET", `${path}/roles/${id}`, {}, null],
    ["POST", `${path}/roles`, {}, { id, key: "support", permissions }],
    ["PUT", `${path}/roles/${id}`, {}, { expected_updated_at: 2, key: "support", permissions: [{ type: "admin" }] }],
    ["DELETE", `${path}/roles/${id}`, { expected_updated_at: "3" }, null],
    ["GET", `${path}/members`, { limit: "10", cursor: "members" }, null],
    ["POST", `${path}/members`, {}, { id, contact: { email: "team@example.test", language: "bs" }, role_ids: [ids.plan] }],
    ["PUT", `${path}/members/${id}/roles`, {}, { expected_updated_at: 4, role_ids: [ids.plan] }],
    ["PUT", `${path}/members/${id}/status`, {}, { expected_updated_at: 5, status: { type: "disabled" } }],
    ["DELETE", `${path}/members/${id}`, { expected_updated_at: "6" }, null],
    ["POST", `${path}/members/${id}/second-factor/reset`, {}, null],
    ["GET", `${path}/membership`, {}, null],
    ["POST", `${path}/membership/accept`, {}, { expected_updated_at: 7 }],
    ["GET", `${path}/stores/${ids.store}/agreement`, {}, null],
    ["GET", `/v1/stores/${ids.store}/agreement`, {}, null],
  ]);
  await assert.rejects(async () => network.role.create({ network_id, id: "role", key: "support", permissions }), TypeError);
  await assert.rejects(async () => network.member.invite({ network_id, id: "member", contact: { email: "a@example.test", language: "en" }, role_ids: [] }), TypeError);
  await assert.rejects(async () => network.store.getAgreement({ network_id, store_id: "store" }), TypeError);
  assert.equal(calls.length, 15);
});

test("a live store create carries the network's agreement only when it is given", async (context) => {
  const calls = recordFetch(context, (call) => ({ id: call.body.id }));
  const input = {
    id: ids.store,
    name: "Clinic",
    timezone: "Europe/Sarajevo",
    languages: ["bs"],
    market: { key: "ba", currency: "bam", tax_mode: "inclusive" },
    sales_channel: { key: "web" },
    location_address: { country: "BA" },
    type: { type: "live", network_id: ids.network, plan: { type: "free", plan_id: ids.plan } },
  };
  const client = admin();
  await client.store.create({ ...input, agreement: { id: ids.picked, document: "Processing agreement v1" } });
  await client.store.create(input);
  assert.deepEqual(calls[0].body.agreement, { id: ids.picked, document: "Processing agreement v1" });
  assert.equal("agreement" in calls[1].body, false);
});

test("a store's suspension and its lifting send only the reason and the version they read", async (context) => {
  const suspended = { type: "suspended", reason: "Unpaid since March", at: 1_900_000_000_000 };
  const calls = recordFetch(context, (call) => ({ id: ids.store, status: call.path.endsWith("/suspend") ? suspended : { type: "active" } }));
  const store = admin().store;
  assert.deepEqual(await store.suspend({ store_id: ids.store, expected_updated_at: 3, reason: "Unpaid since March" }), { id: ids.store, status: suspended });
  assert.deepEqual(await store.resume({ store_id: ids.store, expected_updated_at: 4 }), { id: ids.store, status: { type: "active" } });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["POST", `/v1/stores/${ids.store}/suspend`, {}, { expected_updated_at: 3, reason: "Unpaid since March" }],
    ["POST", `/v1/stores/${ids.store}/resume`, {}, { expected_updated_at: 4 }],
  ]);
  await assert.rejects(async () => store.suspend({ store_id: "store", expected_updated_at: 3, reason: "Unpaid" }), TypeError);
  await assert.rejects(async () => store.resume({ store_id: "store", expected_updated_at: 4 }), TypeError);
  assert.equal(calls.length, 2);
});

test("a network's clinic read names its network and clinic and answers the counts, city and owner email", async (context) => {
  const clinic = {
    id: ids.store,
    name: "Clinic",
    timezone: "Europe/Sarajevo",
    languages: ["bs"],
    type: { type: "live", account_id: ids.account, network_id: ids.network },
    status: { type: "active" },
    email_sending: { type: "allowed" },
    created_at: 2,
    updated_at: 2,
    owner_email: "owner@clinic.example.test",
    city: "Sarajevo",
    counts: { staff_calendars: 3, members: 5, customers: 120 },
  };
  const calls = recordFetch(context, () => clinic);
  const stores = admin().network.store;
  assert.deepEqual(await stores.get({ network_id: ids.network, store_id: ids.store }), clinic);
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", `/v1/networks/${ids.network}/stores/${ids.store}`, {}, null],
  ]);
  await assert.rejects(async () => stores.get({ network_id: ids.network, store_id: "store" }), TypeError);
  await assert.rejects(async () => stores.get({ network_id: "network", store_id: ids.store }), TypeError);
  assert.equal(calls.length, 1);
});
