import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";
import { installGlobal, recordFetch } from "./helpers/arky-fixtures.mjs";

const storeId = "7b2d9e40-1c63-4f85-a9e7-3d0c5b8f2a16";
const selection = {
  id: "d397ff50-690b-4da7-9fb9-17740e535d69",
  store_id: storeId,
  plan: { type: "none" },
  trial_used: false,
  created_at: 1,
  updated_at: 2,
  payment_action: {
    type: "stripe_embedded_checkout",
    publishable_key: "pk_test_subscription",
    client_secret: "cs_store_subscription_secret_exact",
    expires_at: 1_800_000_000_000,
  },
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
  return createAdmin({ baseUrl: "https://api.example.test", apiToken: "contract-token" });
}

test("picking a store plan is one plain request with the plan and the return page, and keeps nothing in the browser", async (context) => {
  const storage = new RecordingStorage();
  installGlobal(context, "localStorage", storage);
  installGlobal(context, "window", globalThis);
  const calls = recordFetch(context, () => selection);
  const api = admin().store.subscription;
  for (const removed of ["retainSelection", "recoverSelection", "pendingSelection", "cancel", "reactivate"]) assert.equal(removed in api, false, removed);
  const answer = await api.select({ store_id: storeId, plan_id: "plan_basic_monthly_v1", return_url: "https://merchant.test/settings/billing" });
  assert.equal(answer.payment_action.client_secret, "cs_store_subscription_secret_exact");
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/stores/${storeId}/subscription`, { plan_id: "plan_basic_monthly_v1", return_url: "https://merchant.test/settings/billing" }],
  ]);
  assert.deepEqual(storage.writes, []);
});

test("a lost plan pick isn't retried behind the caller's back, and the next pick is a fresh request", async (context) => {
  const calls = recordFetch(context, (_call, count) => {
    if (count === 1) throw new TypeError("response connection was lost");
    return selection;
  });
  const api = admin().store.subscription;
  const pick = { store_id: storeId, plan_id: "plan_basic_monthly_v1", return_url: "https://merchant.test/settings/billing" };
  await assert.rejects(api.select(pick), /connection was lost/);
  assert.equal(calls.length, 1);
  assert.deepEqual(await api.select(pick), selection);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[1].body, calls[0].body);
});

test("billing reads, the provider portal and the end of a granted plan use the named store's routes", async (context) => {
  const calls = recordFetch(context, (call) => call.path.endsWith("/portal") ? { portal_url: "https://billing.stripe.test/session" } : selection);
  const api = admin().store.subscription;
  await api.get({ store_id: storeId });
  assert.deepEqual(await api.createPortalSession({ store_id: storeId, return_url: "https://merchant.test/billing" }), { portal_url: "https://billing.stripe.test/session" });
  await api.endGrant({ store_id: storeId, expected_updated_at: 2 });
  await admin().store.usage.find({ store_id: storeId });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["GET", `/v1/stores/${storeId}/subscription`, null],
    ["POST", `/v1/stores/${storeId}/subscription/portal`, { return_url: "https://merchant.test/billing" }],
    ["POST", `/v1/stores/${storeId}/subscription/end-grant`, { expected_updated_at: 2 }],
    ["GET", `/v1/stores/${storeId}/usage`, null],
  ]);
  for (const store_id of [undefined, "", "store-subscription", storeId.toUpperCase()]) {
    await assert.rejects(async () => api.select({ store_id, plan_id: "plan", return_url: "https://merchant.test" }), TypeError);
    await assert.rejects(async () => api.get({ store_id }), TypeError);
  }
  assert.equal(calls.length, 4);
});
