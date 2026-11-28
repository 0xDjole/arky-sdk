import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { apiUrl, ids, recordFetch } from "./helpers/arky-fixtures.mjs";

function admin() {
  return createAdmin({ apiUrl, accountToken: `arky_at_${"a".repeat(42)}A` });
}

test("a_tenant_create_names_its_network_and_plan", async (context) => {
  const calls = recordFetch(context, (call) => ({ id: call.body.id, type: call.body.type }));
  const tenant = {
    id: ids.tenant,
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
    const input = { ...tenant, type: { type: "live", network_id: ids.network, plan, owner: { type: "caller" } } };
    assert.deepEqual(await client.tenant.create(input), { id: ids.tenant, type: input.type });
    assert.deepEqual(calls.at(-1).body, input);
  }
  const owned = { ...tenant, type: { type: "live", network_id: ids.network, plan: { type: "grant", plan_id: ids.plan }, owner: { type: "email", email: "owner@clinic.example.test", language: "bs" } } };
  await client.tenant.create(owned);
  assert.deepEqual(calls.at(-1).body.type.owner, { type: "email", email: "owner@clinic.example.test", language: "bs" });
  await client.tenant.create({ ...tenant, id: ids.otherTenant, type: { type: "test", live_tenant_id: ids.tenant } });
  assert.deepEqual(calls.at(-1).body.type, { type: "test", live_tenant_id: ids.tenant });
  assert.ok(calls.every((call) => call.path === "/v1/tenants" && call.method === "POST" && !("mode" in call.body)));
});

test("network, login and plan changes keep their target and version", async (context) => {
  const calls = recordFetch(context, () => ({ id: ids.network }));
  const network = admin().network;
  const network_id = ids.network;
  const id = ids.picked;
  const sender = { from_name: "Network", from_address: "sign-in@network.example.test", sign_in_subject: "Your code", sign_in_body: "Code {{code}}" };
  const memberNotice = { member_login_changed_subject: "Your sign-in changed", member_login_changed_body: "{{email}} now signs you in" };
  const emailTexts = {
    type: "on",
    texts: [{ language: "bs", code_subject: "Vaš kod", code_body: "Kod {{code}}", invite_subject: "Poziv", invite_body: "Kod {{code}}", login_changed_subject: "Prijava promijenjena", login_changed_body: "{{email}}" }],
  };
  const smsTexts = { type: "on", sender_name: "Klinika", texts: [{ language: "bs", code_body: "Kod {{code}}", invite_body: "Poziv {{code}}", login_changed_body: "{{number}}" }] };
  await network.find({ limit: 20, cursor: "next" });
  await network.get({ id: network_id });
  await network.create({ id: network_id, name: "Network", type: { type: "isolated" } });
  await network.update({ id: network_id, expected_updated_at: 3, name: "Network" });
  await network.update({ id: network_id, expected_updated_at: 14, type: { type: "connected" } });
  await network.provider.find({ network_id, limit: 50 });
  await network.provider.get({ network_id, id });
  await network.provider.connectResend({ network_id, id, api_key: "re_fixture", ...sender, ...memberNotice, tenant_addresses: { type: "domain", domain: "shops.network.example.test" }, user_texts: emailTexts });
  await network.provider.replaceResendKey({ network_id, id, expected_updated_at: 4, api_key: "re_next" });
  await network.provider.updateResend({ network_id, id, expected_updated_at: 5, ...sender, tenant_addresses: { type: "off" } });
  await network.provider.replaceEmailUserTexts({ network_id, id, expected_updated_at: 15, user_texts: { type: "off" } });
  await network.provider.connectStripe({ network_id, id, publishable_key: "pk_test_fixture", secret_key: "rk_test_fixture", webhook_secret: "whsec_fixture" });
  await network.provider.replaceStripeKeys({ network_id, id, expected_updated_at: 6, publishable_key: "pk_test_next", secret_key: "rk_test_next", webhook_secret: "whsec_next" });
  await network.provider.connectTwilio({ network_id, id, account_sid: `AC${"0".repeat(32)}`, auth_token: "twilio-token", user_texts: smsTexts });
  await network.provider.replaceTwilioAuthToken({ network_id, id, expected_updated_at: 7, auth_token: "twilio-next" });
  await network.provider.replaceSmsUserTexts({ network_id, id, expected_updated_at: 16, user_texts: { type: "off" } });
  await network.provider.connectElevenLabs({ network_id, id, api_key: "el_fixture", region: "eu" });
  await network.provider.setUpElevenLabsAgain({ network_id, id, expected_updated_at: 8 });
  await network.provider.setStatus({ network_id, id, expected_updated_at: 9, status: "disabled" });
  await network.provider.delete({ network_id, id, expected_updated_at: 10 });
  await network.plan.find({ network_id, limit: 10, cursor: "plans" });
  await network.plan.update({ network_id, id: ids.plan, expected_updated_at: 11, access: { type: "public", price: { type: "monthly", amount: 1000, currency: "eur", months: 1, trial: { type: "days", period: 14 } } } });
  await network.plan.delete({ network_id, id: ids.plan, expected_updated_at: 12 });
  await network.delete({ id: network_id, expected_updated_at: 13 });
  const path = `/v1/networks/${network_id}`;
  const providers = `${path}/providers`;
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", "/v1/networks", { limit: "20", cursor: "next" }, null],
    ["GET", path, {}, null],
    ["POST", "/v1/networks", {}, { id: network_id, name: "Network", type: { type: "isolated" } }],
    ["PATCH", path, {}, { expected_updated_at: 3, name: "Network" }],
    ["PATCH", path, {}, { expected_updated_at: 14, type: { type: "connected" } }],
    ["GET", providers, { limit: "50" }, null],
    ["GET", `${providers}/${id}`, {}, null],
    ["POST", `${providers}/resend`, {}, { id, api_key: "re_fixture", ...sender, ...memberNotice, tenant_addresses: { type: "domain", domain: "shops.network.example.test" }, user_texts: emailTexts }],
    ["PUT", `${providers}/${id}/resend-key`, {}, { expected_updated_at: 4, api_key: "re_next" }],
    ["PUT", `${providers}/${id}/resend`, {}, { expected_updated_at: 5, ...sender, tenant_addresses: { type: "off" } }],
    ["PUT", `${providers}/${id}/email-user-texts`, {}, { expected_updated_at: 15, user_texts: { type: "off" } }],
    ["POST", `${providers}/stripe`, {}, { id, publishable_key: "pk_test_fixture", secret_key: "rk_test_fixture", webhook_secret: "whsec_fixture" }],
    ["PUT", `${providers}/${id}/stripe-keys`, {}, { expected_updated_at: 6, publishable_key: "pk_test_next", secret_key: "rk_test_next", webhook_secret: "whsec_next" }],
    ["POST", `${providers}/twilio`, {}, { id, account_sid: `AC${"0".repeat(32)}`, auth_token: "twilio-token", user_texts: smsTexts }],
    ["PUT", `${providers}/${id}/twilio-auth-token`, {}, { expected_updated_at: 7, auth_token: "twilio-next" }],
    ["PUT", `${providers}/${id}/sms-user-texts`, {}, { expected_updated_at: 16, user_texts: { type: "off" } }],
    ["POST", `${providers}/elevenlabs`, {}, { id, api_key: "el_fixture", region: "eu" }],
    ["POST", `${providers}/${id}/elevenlabs-setup`, {}, { expected_updated_at: 8 }],
    ["PUT", `${providers}/${id}/status`, {}, { expected_updated_at: 9, status: "disabled" }],
    ["DELETE", `${providers}/${id}`, { expected_updated_at: "10" }, null],
    ["GET", `${path}/plans`, { limit: "10", cursor: "plans" }, null],
    ["PATCH", `${path}/plans/${ids.plan}`, {}, { expected_updated_at: 11, access: { type: "public", price: { type: "monthly", amount: 1000, currency: "eur", months: 1, trial: { type: "days", period: 14 } } } }],
    ["DELETE", `${path}/plans/${ids.plan}`, { expected_updated_at: "12" }, null],
    ["DELETE", path, { expected_updated_at: "13" }, null],
  ]);
  for (const removed of ["stripe", "email"]) assert.equal(removed in network, false, removed);
  for (const connect of ["connectResend", "connectStripe", "connectTwilio", "connectElevenLabs"]) {
    await assert.rejects(async () => network.provider[connect]({ network_id, id: "login" }), TypeError);
  }
  await assert.rejects(async () => network.create({ id: "network", name: "Network", type: { type: "isolated" } }), TypeError);
  assert.equal(calls.length, 24);
});

test("tenant children, wipes and subscription actions send only their own inputs", async (context) => {
  const calls = recordFetch(context, () => ({ id: ids.tenant }));
  const tenant = admin().tenant;
  await tenant.testTenants.find({ tenant_id: ids.tenant, limit: 10, cursor: "children" });
  await tenant.wipe({ id: ids.tenant, confirmation: "Shop", expected_updated_at: 1 });
  await tenant.subscription.createCardSetup({ network_id: ids.network, id: ids.picked, tenant_id: ids.tenant });
  await tenant.subscription.setCard({ tenant_id: ids.tenant, expected_updated_at: 2, network_provider_id: ids.picked, setup_intent_id: "seti_confirmed" });
  await tenant.subscription.changePlan({ tenant_id: ids.tenant, expected_updated_at: 3, plan_id: ids.plan });
  await tenant.subscription.pendingPayment({ tenant_id: ids.tenant });
  await tenant.subscription.cancel({ tenant_id: ids.tenant, expected_updated_at: 4 });
  await tenant.subscription.grant({ tenant_id: ids.tenant, expected_updated_at: 5, plan_id: ids.plan });
  await tenant.subscription.endGrant({ tenant_id: ids.tenant, expected_updated_at: 6, plan_id: ids.plan });
  const path = `/v1/tenants/${ids.tenant}`;
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", `${path}/test-tenants`, { limit: "10", cursor: "children" }, null],
    ["POST", `${path}/wipe`, {}, { confirmation: "Shop", expected_updated_at: 1 }],
    ["POST", `/v1/networks/${ids.network}/card-setups`, {}, { id: ids.picked, tenant_id: ids.tenant }],
    ["PUT", `${path}/subscription/card`, {}, { expected_updated_at: 2, network_provider_id: ids.picked, setup_intent_id: "seti_confirmed" }],
    ["PUT", `${path}/subscription/plan`, {}, { expected_updated_at: 3, plan_id: ids.plan }],
    ["GET", `${path}/subscription/payment`, {}, null],
    ["POST", `${path}/subscription/cancel`, {}, { expected_updated_at: 4 }],
    ["POST", `${path}/subscription/grant`, {}, { expected_updated_at: 5, plan_id: ids.plan }],
    ["POST", `${path}/subscription/end-grant`, {}, { expected_updated_at: 6, plan_id: ids.plan }],
  ]);
});

test("the tenant list filters by type and status, and the test tenants of a page's live tenants come in one read", async (context) => {
  const testTenant = { id: ids.otherTenant, type: { type: "test", live_tenant_id: ids.tenant } };
  const calls = recordFetch(context, (call) => (call.path === "/v1/tenants/test-tenants" ? { items: [testTenant], cursor: "more" } : { items: [], cursor: null }));
  const tenant = admin().tenant;
  await tenant.find({ type: "live", status: "active", limit: 20 });
  await tenant.find({ status: "wiping_suspended" });
  assert.deepEqual(await tenant.testTenants.findByLiveTenants({ live_tenant_ids: [ids.tenant, ids.otherTenant], limit: 50 }), { items: [testTenant], cursor: "more" });
  await tenant.testTenants.findByLiveTenants({ live_tenant_ids: [ids.tenant, ids.otherTenant], cursor: "more" });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", "/v1/tenants", { type: "live", status: "active", limit: "20" }, null],
    ["GET", "/v1/tenants", { status: "wiping_suspended" }, null],
    ["GET", "/v1/tenants/test-tenants", { live_tenant_ids: JSON.stringify([ids.tenant, ids.otherTenant]), limit: "50" }, null],
    ["GET", "/v1/tenants/test-tenants", { live_tenant_ids: JSON.stringify([ids.tenant, ids.otherTenant]), cursor: "more" }, null],
  ]);
});

test("network sign-in requires the exact network before sending its code request", async (context) => {
  const result = { session_id: ids.session, verification_expires_at: 1_900_000_000_000 };
  const calls = recordFetch(context, () => result);
  const auth = createAdmin({ apiUrl }).account.auth;
  assert.deepEqual(await auth.requestCode({ session_id: ids.session, network_id: ids.network, email: "owner@example.test", language: "bs" }), result);
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", "/v1/auth/code", { session_id: ids.session, email: "owner@example.test", network_id: ids.network, language: "bs" }],
  ]);
  for (const network_id of [undefined, "", "network", ids.network.toUpperCase()]) {
    await assert.rejects(auth.requestCode({ session_id: ids.session, network_id, email: "owner@example.test", language: "bs" }), TypeError);
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

test("a network's SMS reports are posts a platform Admin lists by the network's Twilio login and resolves by version", async (context) => {
  const post = {
    id: ids.picked,
    provider_event_id: "SM1:delivered",
    type: { type: "network_twilio_sms", network_id: ids.network, network_provider_id: ids.plan, outgoing_message_id: ids.submission, event: { type: "delivered", message_sid: "SM1" } },
    status: { type: "review", reason: "A different final report", to: { type: "outgoing_message", outgoing_message_id: ids.submission } },
    created_at: 1,
    updated_at: 2,
  };
  const calls = recordFetch(context, (call) => (call.method === "GET" ? { items: [post], cursor: null } : post));
  const platform = admin().platform;
  const network_provider_id = ids.plan;
  assert.deepEqual(await platform.networkSmsPost.find({ network_id: ids.network, network_provider_id, status: "review", limit: 25, cursor: "sms" }), { items: [post], cursor: null });
  assert.deepEqual(await platform.networkSmsPost.resolve({ network_id: ids.network, network_provider_id, id: ids.picked, expected_updated_at: 2, resolution: "ignore", reason: "Reviewed" }), post);
  await platform.networkSmsPost.resolve({ network_id: ids.network, network_provider_id, id: ids.picked, expected_updated_at: 3, resolution: "apply" });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", "/v1/platform/incoming-webhooks/twilio", { network_id: ids.network, network_provider_id, status: "review", limit: "25", cursor: "sms" }, null],
    ["POST", `/v1/platform/incoming-webhooks/twilio/${ids.picked}/resolve`, {}, { network_id: ids.network, network_provider_id, expected_updated_at: 2, resolution: "ignore", reason: "Reviewed" }],
    ["POST", `/v1/platform/incoming-webhooks/twilio/${ids.picked}/resolve`, {}, { network_id: ids.network, network_provider_id, expected_updated_at: 3, resolution: "apply" }],
  ]);
});

test("a network's tenants page by the network with the opaque continuation", async (context) => {
  const tenant = { id: ids.tenant, name: "Shop", timezone: "Europe/Sarajevo", languages: ["en"], type: { type: "live", account_id: ids.account, network_id: ids.network }, status: { type: "active" }, email_sending: { type: "allowed" }, invoicing: { type: "arky" }, created_at: 2, updated_at: 2 };
  const calls = recordFetch(context, (_call, count) => count === 1 ? { items: [tenant], cursor: "next:+/=" } : { items: [], cursor: null });
  const tenants = admin().network.tenant;
  const first = await tenants.find({ network_id: ids.network, limit: 1 });
  assert.deepEqual(first, { items: [tenant], cursor: "next:+/=" });
  await tenants.find({ network_id: ids.network, limit: 1, cursor: first.cursor });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", `/v1/networks/${ids.network}/tenants`, { limit: "1" }, null],
    ["GET", `/v1/networks/${ids.network}/tenants`, { limit: "1", cursor: "next:+/=" }, null],
  ]);
  for (const network_id of [undefined, "", "network", ids.network.toUpperCase()]) {
    await assert.rejects(async () => tenants.find({ network_id }), TypeError);
  }
  assert.equal(calls.length, 2);
});

test("network roles, members and tenant agreements keep their network, target and version", async (context) => {
  const calls = recordFetch(context, () => ({ id: ids.picked }));
  const client = admin();
  const network = client.network;
  const network_id = ids.network;
  const id = ids.picked;
  const permissions = [{ type: "network_tenants", network_id, action: "write" }, { type: "network_logins", network_id }];
  await network.role.find({ network_id, limit: 20, cursor: "roles" });
  await network.role.get({ network_id, id });
  await network.role.create({ network_id, id, key: "desk", permissions });
  await network.role.update({ network_id, id, expected_updated_at: 2, key: "desk", permissions: [{ type: "network_admin", network_id }] });
  await network.role.delete({ network_id, id, expected_updated_at: 3 });
  await network.member.find({ network_id, limit: 10, cursor: "members" });
  await network.member.invite({ network_id, id, contact: { email: "team@example.test", language: "bs" }, role_ids: [ids.plan] });
  await network.member.updateRoles({ network_id, id, expected_updated_at: 4, role_ids: [ids.plan] });
  await network.member.changeStatus({ network_id, id, expected_updated_at: 5, status: { type: "disabled" } });
  await network.member.remove({ network_id, id, expected_updated_at: 6 });
  await network.member.resetSecondFactor({ network_id, id });
  await network.member.getOwn({ network_id });
  await network.member.acceptInvite({ network_id, expected_updated_at: 7 });
  await network.tenant.getAgreement({ network_id, tenant_id: ids.tenant });
  await client.tenant.agreement.get({ tenant_id: ids.tenant });
  const path = `/v1/networks/${network_id}`;
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", `${path}/roles`, { limit: "20", cursor: "roles" }, null],
    ["GET", `${path}/roles/${id}`, {}, null],
    ["POST", `${path}/roles`, {}, { id, key: "desk", permissions }],
    ["PUT", `${path}/roles/${id}`, {}, { expected_updated_at: 2, key: "desk", permissions: [{ type: "network_admin", network_id }] }],
    ["DELETE", `${path}/roles/${id}`, { expected_updated_at: "3" }, null],
    ["GET", `${path}/members`, { limit: "10", cursor: "members" }, null],
    ["POST", `${path}/members`, {}, { id, contact: { email: "team@example.test", language: "bs" }, role_ids: [ids.plan] }],
    ["PUT", `${path}/members/${id}/roles`, {}, { expected_updated_at: 4, role_ids: [ids.plan] }],
    ["PUT", `${path}/members/${id}/status`, {}, { expected_updated_at: 5, status: { type: "disabled" } }],
    ["DELETE", `${path}/members/${id}`, { expected_updated_at: "6" }, null],
    ["POST", `${path}/members/${id}/second-factor/reset`, {}, null],
    ["GET", `${path}/membership`, {}, null],
    ["POST", `${path}/membership/accept`, {}, { expected_updated_at: 7 }],
    ["GET", `${path}/tenants/${ids.tenant}/agreement`, {}, null],
    ["GET", `/v1/tenants/${ids.tenant}/agreement`, {}, null],
  ]);
  await assert.rejects(async () => network.role.create({ network_id, id: "role", key: "desk", permissions }), TypeError);
  await assert.rejects(async () => network.member.invite({ network_id, id: "member", contact: { email: "a@example.test", language: "en" }, role_ids: [] }), TypeError);
  await assert.rejects(async () => network.tenant.getAgreement({ network_id, tenant_id: "tenant" }), TypeError);
  assert.equal(calls.length, 15);
});

test("a live tenant create carries the network's agreement only when it is given", async (context) => {
  const calls = recordFetch(context, (call) => ({ id: call.body.id }));
  const input = {
    id: ids.tenant,
    name: "Clinic",
    timezone: "Europe/Sarajevo",
    languages: ["bs"],
    market: { key: "ba", currency: "bam", tax_mode: "inclusive" },
    sales_channel: { key: "web" },
    location_address: { country: "BA" },
    type: { type: "live", network_id: ids.network, plan: { type: "free", plan_id: ids.plan }, owner: { type: "caller" } },
  };
  const client = admin();
  await client.tenant.create({ ...input, agreement: { id: ids.picked, document: "Processing agreement v1" } });
  await client.tenant.create(input);
  assert.deepEqual(calls[0].body.agreement, { id: ids.picked, document: "Processing agreement v1" });
  assert.equal("agreement" in calls[1].body, false);
});

test("a tenant's suspension and its lifting send only the reason and the version they read", async (context) => {
  const suspended = { type: "suspended", reason: "Unpaid since March", at: 1_900_000_000_000 };
  const calls = recordFetch(context, (call) => ({ id: ids.tenant, status: call.path.endsWith("/suspend") ? suspended : { type: "active" } }));
  const tenant = admin().tenant;
  assert.deepEqual(await tenant.suspend({ tenant_id: ids.tenant, expected_updated_at: 3, reason: "Unpaid since March" }), { id: ids.tenant, status: suspended });
  assert.deepEqual(await tenant.resume({ tenant_id: ids.tenant, expected_updated_at: 4 }), { id: ids.tenant, status: { type: "active" } });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["POST", `/v1/tenants/${ids.tenant}/suspend`, {}, { expected_updated_at: 3, reason: "Unpaid since March" }],
    ["POST", `/v1/tenants/${ids.tenant}/resume`, {}, { expected_updated_at: 4 }],
  ]);
  await assert.rejects(async () => tenant.suspend({ tenant_id: "tenant", expected_updated_at: 3, reason: "Unpaid" }), TypeError);
  await assert.rejects(async () => tenant.resume({ tenant_id: "tenant", expected_updated_at: 4 }), TypeError);
  assert.equal(calls.length, 2);
});

test("a network's clinic read names its network and clinic and answers the counts, city and owner email", async (context) => {
  const clinic = {
    id: ids.tenant,
    name: "Clinic",
    timezone: "Europe/Sarajevo",
    languages: ["bs"],
    type: { type: "live", account_id: ids.account, network_id: ids.network },
    status: { type: "active" },
    email_sending: { type: "allowed" },
    invoicing: { type: "outside" },
    created_at: 2,
    updated_at: 2,
    owner_email: "owner@clinic.example.test",
    city: "Sarajevo",
    counts: { members: 5, users: 120 },
    default_location_id: ids.otherCompanyLocation,
  };
  const calls = recordFetch(context, () => clinic);
  const tenants = admin().network.tenant;
  assert.deepEqual(await tenants.get({ network_id: ids.network, tenant_id: ids.tenant }), clinic);
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", `/v1/networks/${ids.network}/tenants/${ids.tenant}`, {}, null],
  ]);
  await assert.rejects(async () => tenants.get({ network_id: ids.network, tenant_id: "tenant" }), TypeError);
  await assert.rejects(async () => tenants.get({ network_id: "network", tenant_id: ids.tenant }), TypeError);
  assert.equal(calls.length, 1);
});

test("a network names a tenant's owner by email, and a tenant names its default branch, each under the version it read", async (context) => {
  const calls = recordFetch(context, () => ({ id: ids.tenant }));
  const api = admin();
  const branch = "2b4d6f8a-0c1e-4a3b-9d5f-7b9d1f3a5c7e";
  await api.network.tenant.nameOwner({ network_id: ids.network, tenant_id: ids.tenant, email: "owner@clinic.example.test", language: "bs", expected_updated_at: 5 });
  await api.tenant.nameDefaultLocation({ id: ids.tenant, tenant_location_id: branch, expected_updated_at: 6 });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["PUT", `/v1/networks/${ids.network}/tenants/${ids.tenant}/owner`, {}, { email: "owner@clinic.example.test", language: "bs", expected_updated_at: 5 }],
    ["PUT", `/v1/tenants/${ids.tenant}/default-location`, {}, { tenant_location_id: branch, expected_updated_at: 6 }],
  ]);
  await assert.rejects(async () => api.network.tenant.nameOwner({ network_id: ids.network, tenant_id: "tenant", email: "owner@clinic.example.test", language: "bs", expected_updated_at: 5 }), TypeError);
  await assert.rejects(async () => api.tenant.nameDefaultLocation({ id: ids.tenant, tenant_location_id: "branch", expected_updated_at: 6 }), TypeError);
  assert.equal(calls.length, 2);
});

test("the network's team reads several tenants' subscriptions by tenant ids in one request", async (context) => {
  const network_id = "2a4c6e8b-0d1f-4a3c-9e5b-7d9f1b3c5e8a";
  const calls = recordFetch(context, () => []);
  assert.deepEqual(await admin().network.tenant.findSubscriptions({ network_id, ids: [ids.tenant, ids.otherTenant] }), []);
  assert.deepEqual(calls.map(({ method, path, query }) => [method, path, query]), [
    ["GET", `/v1/networks/${network_id}/tenant-subscriptions`, { ids: JSON.stringify([ids.tenant, ids.otherTenant]) }],
  ]);
});
