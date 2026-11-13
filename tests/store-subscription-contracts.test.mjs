import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";
import { ids, installGlobal, recordFetch } from "./helpers/arky-fixtures.mjs";

const storeId = "7b2d9e40-1c63-4f85-a9e7-3d0c5b8f2a16";
const subscription = {
  id: "d397ff50-690b-4da7-9fb9-17740e535d69",
  store_id: storeId,
  plan: { type: "active", plan_id: ids.plan, paid_until: 1_900_000_000_000, stripe_customer_id: "cus_store", stripe_payment_method_id: "pm_store", card: { brand: "visa", last4: "4242", exp_month: 12, exp_year: 2035 } },
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

test("changing a store plan sends its version and optional confirmed card setup, without keeping billing secrets in browser storage", async (context) => {
  const storage = new RecordingStorage();
  installGlobal(context, "localStorage", storage);
  installGlobal(context, "window", globalThis);
  const calls = recordFetch(context, () => subscription);
  const api = admin().store.subscription;
  for (const removed of ["retainSelection", "recoverSelection", "pendingSelection", "select", "createPortalSession", "reactivate"]) assert.equal(removed in api, false, removed);
  const card = { network_provider_id: ids.picked, setup_intent_id: "seti_confirmed" };
  const request = { store_id: storeId, plan_id: ids.plan, expected_updated_at: 1, card };
  assert.deepEqual(await api.changePlan(request), subscription);
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["PUT", `/v1/stores/${storeId}/subscription/plan`, { plan_id: ids.plan, expected_updated_at: 1, card }],
  ]);
  assert.deepEqual(storage.writes, []);
});

test("a lost plan change is not retried automatically and an explicit retry preserves the same version", async (context) => {
  const calls = recordFetch(context, (_call, count) => {
    if (count === 1) throw new TypeError("response connection was lost");
    return subscription;
  });
  const api = admin().store.subscription;
  const change = { store_id: storeId, plan_id: ids.plan, expected_updated_at: 1 };
  await assert.rejects(api.changePlan(change), /connection was lost/);
  assert.equal(calls.length, 1);
  assert.deepEqual(await api.changePlan(change), subscription);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[1].body, calls[0].body);
});

test("card setup names its network and the caller's stable id", async (context) => {
  const setup = { setup_intent_id: "seti_store", publishable_key: "pk_test_store", client_secret: "seti_store_secret_exact", runs_on: { type: "provider" } };
  const calls = recordFetch(context, () => setup);
  assert.deepEqual(await admin().store.subscription.createCardSetup({ network_id: ids.network, id: ids.picked }), setup);
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/networks/${ids.network}/card-setups`, { id: ids.picked }],
  ]);
  for (const id of [undefined, "card-setup", ids.picked.toUpperCase()]) {
    await assert.rejects(async () => admin().store.subscription.createCardSetup({ network_id: ids.network, id }), TypeError);
  }
  assert.equal(calls.length, 1);
});

test("subscription reads, a pending confirmation and ending a grant use the named store", async (context) => {
  const payment = { type: "stripe", payment_intent_id: "pi_store", publishable_key: "pk_test_store", client_secret: "pi_store_secret_exact", runs_on: { type: "provider" } };
  const calls = recordFetch(context, (call) => call.path.endsWith("/payment") ? payment : subscription);
  const api = admin().store.subscription;
  assert.deepEqual(await api.get({ store_id: storeId }), subscription);
  assert.deepEqual(await api.pendingPayment({ store_id: storeId }), payment);
  await api.endGrant({ store_id: storeId, plan_id: ids.plan, card: { network_provider_id: ids.picked, setup_intent_id: "seti_confirmed" }, expected_updated_at: 2 });
  await admin().store.usage.get({ store_id: storeId });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["GET", `/v1/stores/${storeId}/subscription`, null],
    ["GET", `/v1/stores/${storeId}/subscription/payment`, null],
    ["POST", `/v1/stores/${storeId}/subscription/end-grant`, { plan_id: ids.plan, card: { network_provider_id: ids.picked, setup_intent_id: "seti_confirmed" }, expected_updated_at: 2 }],
    ["GET", `/v1/stores/${storeId}/usage`, null],
  ]);
  for (const store_id of [undefined, "", "store-subscription", storeId.toUpperCase()]) {
    await assert.rejects(async () => api.changePlan({ store_id, plan_id: ids.plan, expected_updated_at: 2 }), TypeError);
    await assert.rejects(async () => api.get({ store_id }), TypeError);
  }
  assert.equal(calls.length, 4);
});

test("the plan read names its store and answers the plan the store is on with its status", async (context) => {
  const summary = {
    store_id: storeId,
    plan: { id: ids.plan, network_id: ids.network, name: "Medical", tier: 2, price: { type: "monthly", amount: 4_900, currency: "eur", months: 1, per: "staff_calendar", trial_days: 14 }, features: { members: { type: "max", count: 10 }, store_locations: { type: "max", count: 3 }, staff_calendars: { type: "max", count: 12 } }, created_at: 1, updated_at: 2 },
    status: { type: "trialing", trial_ends_at: 1_900_000_000_000 },
  };
  const calls = recordFetch(context, () => summary);
  const read = await admin().store.plan.get({ store_id: storeId });
  assert.deepEqual(read, summary);
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [["GET", `/v1/stores/${storeId}/plan`, {}, null]]);
  for (const store_id of [undefined, "", "store-plan", storeId.toUpperCase()]) {
    await assert.rejects(async () => admin().store.plan.get({ store_id }), TypeError);
  }
  assert.equal(calls.length, 1);
  assert.deepEqual(Object.keys(admin().store.plan), ["get"]);
});
