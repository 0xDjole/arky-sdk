import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";
import { ids, installGlobal, recordFetch } from "./helpers/arky-fixtures.mjs";

const tenantId = "7b2d9e40-1c63-4f85-a9e7-3d0c5b8f2a16";
const subscription = {
  id: "d397ff50-690b-4da7-9fb9-17740e535d69",
  tenant_id: tenantId,
  plan: {
    type: "active",
    plan_id: ids.plan,
    paid_until: 1_900_000_000_000,
    anchor: 1_897_000_000_000,
    card: { type: "stripe", network_provider_id: ids.picked, stripe_customer_id: "cus_tenant", stripe_payment_method_id: "pm_tenant", brand: "visa", last4: "4242", exp_month: 12, exp_year: 2035 },
  },
  trial_used: false,
  created_at: 1,
  updated_at: 2,
};

class RecordingStorage {
  constructor() {
    this.writes = [];
  }

  getItem() {
    return null;
  }

  setItem(key, value) {
    this.writes.push([key, value]);
  }

  removeItem() {}
}

function admin() {
  return createAdmin({ apiUrl: "https://api.example.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
}

test("changing a tenant plan sends its version and optional confirmed card setup, without keeping billing secrets in browser storage", async (context) => {
  const storage = new RecordingStorage();
  installGlobal(context, "localStorage", storage);
  installGlobal(context, "window", globalThis);
  const calls = recordFetch(context, () => subscription);
  const api = admin().tenant.subscription;
  for (const removed of ["retainSelection", "recoverSelection", "pendingSelection", "select", "createPortalSession", "reactivate"]) assert.equal(removed in api, false, removed);
  const card = { network_provider_id: ids.picked, setup_intent_id: "seti_confirmed" };
  const request = { tenant_id: tenantId, plan_id: ids.plan, expected_updated_at: 1, card };
  assert.deepEqual(await api.changePlan(request), subscription);
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["PUT", `/v1/tenants/${tenantId}/subscription/plan`, { plan_id: ids.plan, expected_updated_at: 1, card }],
  ]);
  assert.deepEqual(storage.writes, []);
});

test("a lost plan change is not retried automatically and an explicit retry preserves the same version", async (context) => {
  const calls = recordFetch(context, (_call, count) => {
    if (count === 1) throw new TypeError("response connection was lost");
    return subscription;
  });
  const api = admin().tenant.subscription;
  const change = { tenant_id: tenantId, plan_id: ids.plan, expected_updated_at: 1 };
  await assert.rejects(api.changePlan(change), /connection was lost/);
  assert.equal(calls.length, 1);
  assert.deepEqual(await api.changePlan(change), subscription);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[1].body, calls[0].body);
});

test("card setup names its network, the caller's stable id and the tenant the card is for", async (context) => {
  const setup = { setup_intent_id: "seti_tenant", publishable_key: "pk_test_tenant", client_secret: "seti_tenant_secret_exact", runs_on: { type: "provider" } };
  const calls = recordFetch(context, () => setup);
  assert.deepEqual(await admin().tenant.subscription.createCardSetup({ network_id: ids.network, id: ids.picked, tenant_id: tenantId }), setup);
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/networks/${ids.network}/card-setups`, { id: ids.picked, tenant_id: tenantId }],
  ]);
  for (const id of [undefined, "card-setup", ids.picked.toUpperCase()]) {
    await assert.rejects(async () => admin().tenant.subscription.createCardSetup({ network_id: ids.network, id, tenant_id: tenantId }), TypeError);
  }
  for (const tenant_id of [undefined, "tenant", tenantId.toUpperCase()]) {
    await assert.rejects(async () => admin().tenant.subscription.createCardSetup({ network_id: ids.network, id: ids.picked, tenant_id }), TypeError);
  }
  assert.equal(calls.length, 1);
});

test("subscription reads, a pending confirmation and ending a grant use the named tenant", async (context) => {
  const payment = { type: "stripe", payment_intent_id: "pi_tenant", publishable_key: "pk_test_tenant", client_secret: "pi_tenant_secret_exact", runs_on: { type: "provider" } };
  const calls = recordFetch(context, (call) => call.path.endsWith("/payment") ? payment : subscription);
  const api = admin().tenant.subscription;
  assert.deepEqual(await api.get({ tenant_id: tenantId }), subscription);
  assert.deepEqual(await api.pendingPayment({ tenant_id: tenantId }), payment);
  await api.endGrant({ tenant_id: tenantId, plan_id: ids.plan, card: { network_provider_id: ids.picked, setup_intent_id: "seti_confirmed" }, expected_updated_at: 2 });
  await admin().tenant.usage.get({ tenant_id: tenantId });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["GET", `/v1/tenants/${tenantId}/subscription`, null],
    ["GET", `/v1/tenants/${tenantId}/subscription/payment`, null],
    ["POST", `/v1/tenants/${tenantId}/subscription/end-grant`, { plan_id: ids.plan, card: { network_provider_id: ids.picked, setup_intent_id: "seti_confirmed" }, expected_updated_at: 2 }],
    ["GET", `/v1/tenants/${tenantId}/usage`, null],
  ]);
  for (const tenant_id of [undefined, "", "tenant-subscription", tenantId.toUpperCase()]) {
    await assert.rejects(async () => api.changePlan({ tenant_id, plan_id: ids.plan, expected_updated_at: 2 }), TypeError);
    await assert.rejects(async () => api.get({ tenant_id }), TypeError);
  }
  assert.equal(calls.length, 4);
});

test("the plan read names its tenant and answers the plan the tenant is on with its status", async (context) => {
  const summary = {
    tenant_id: tenantId,
    plan: { id: ids.plan, network_id: ids.network, name: "Medical", tier: 2, access: { type: "public", price: { type: "monthly", amount: 4_900, currency: "eur", months: 1, trial: { type: "days", period: 14 } } }, features: { members: { type: "max", count: 10 }, tenant_locations: { type: "max", count: 3 }, booking_resources: { type: "max", count: 12 } }, created_at: 1, updated_at: 2 },
    status: { type: "trialing", trial_ends_at: 1_900_000_000_000 },
  };
  const calls = recordFetch(context, () => summary);
  const read = await admin().tenant.plan.get({ tenant_id: tenantId });
  assert.deepEqual(read, summary);
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [["GET", `/v1/tenants/${tenantId}/plan`, {}, null]]);
  for (const tenant_id of [undefined, "", "tenant-plan", tenantId.toUpperCase()]) {
    await assert.rejects(async () => admin().tenant.plan.get({ tenant_id }), TypeError);
  }
  assert.equal(calls.length, 1);
  assert.deepEqual(Object.keys(admin().tenant.plan), ["get"]);
});

test("the tenant owner reports a plan payment the bank checked and lists the plan's charges, and a platform Admin lists and settles the charges waiting for a person", async (context) => {
  const tenantId = "5a7c9e1b-3d2f-4b6a-8c0e-2f4a6c8e0b1d";
  const networkId = "6b8d0f2a-4e3c-4d7b-9e1f-3a5c7e9b1d2f";
  const providerId = "7c9e1b3d-5f4a-4e8c-8f2a-4b6d8f0a2c3e";
  const chargeId = "8d0f2a4c-6b5e-4f9d-9a3b-5c7e9b1d3f4a";
  const charge = {
    id: chargeId,
    tenant_id: tenantId,
    purpose: { type: "renewal", plan_id: networkId, starts_at: 1, anchor: 1, months: 1 },
    money: { amount: 2900, currency: "eur" },
    type: { type: "stripe", network_provider_id: providerId, stripe_customer_id: "cus_1", stripe_payment_method_id: "pm_1", status: { type: "action_reported", stripe_payment_intent_id: "pi_1", attempts: 1 } },
    waits_for_owner: true,
    created_at: 1,
    updated_at: 2,
  };
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push([init.method ?? "GET", parsed.pathname, Object.fromEntries(parsed.searchParams), init.body ? JSON.parse(String(init.body)) : null]);
    const body = parsed.pathname.endsWith("/report") || parsed.pathname.endsWith("/settle") ? charge : { items: [charge], cursor: null };
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  });
  const admin = createAdmin({ apiUrl: "https://api.subscription.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  assert.deepEqual(await admin.tenant.subscription.reportPayment({ tenant_id: tenantId, payment_intent_id: "pi_1" }), charge);
  await admin.tenant.subscription.findCharges({ tenant_id: tenantId, limit: 10 });
  await admin.platform.tenantPlanCharge.find({ network_id: networkId, network_provider_id: providerId, limit: 20 });
  await admin.platform.tenantPlanCharge.settle({ id: chargeId, tenant_id: tenantId, expected_updated_at: 2, outcome: { type: "refunded", stripe_refund_id: "re_1" } });
  assert.deepEqual(calls, [
    ["POST", `/v1/tenants/${tenantId}/subscription/payment/report`, {}, { payment_intent_id: "pi_1" }],
    ["GET", `/v1/tenants/${tenantId}/subscription/charges`, { limit: "10" }, null],
    ["GET", "/v1/platform/tenant-plan-charges", { network_id: networkId, network_provider_id: providerId, limit: "20" }, null],
    ["POST", `/v1/platform/tenant-plan-charges/${chargeId}/settle`, {}, { tenant_id: tenantId, expected_updated_at: 2, outcome: { type: "refunded", stripe_refund_id: "re_1" } }],
  ]);
});
