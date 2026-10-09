import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { recordFetch } from "./helpers/arky-fixtures.mjs";

const storeId = "3b21b61d-7162-414c-a73a-888ccbc57c3e";
const subscriptionId = "d65211c1-743f-45fb-ab24-07221b1e3a7c";
const otherSubscriptionId = "5f2a8c63-1d47-4b90-a3e6-9c0b7d4e2f18";
const requirement = {
  unit: { type: "millilitres" },
  minimum_quantity: 5000,
  period: { type: "calendar_month", timezone: "Europe/Sarajevo" },
  qualifying_variants: [{ variant_id: "variant", contribution_per_unit: 250 }],
};

function subscriptions() {
  return createAdmin({ baseUrl: "https://api.example.test", apiToken: "contract" }).eshop.subscription;
}

test("the effective minimum is read at the caller's instant or at the Server's now, with the caller's request options", async (context) => {
  const result = { subscription: { id: subscriptionId, store_id: storeId }, company_id: "company", company_location_id: "branch", starts_at: 1, ends_at: null, evaluated_at: 1_700_000_000_123, initial: null, current: requirement };
  const calls = recordFetch(context, () => result);
  const api = subscriptions();
  const signal = new AbortController().signal;
  const input = { store_id: storeId, id: subscriptionId, at: 1_700_000_000_123 };
  assert.deepEqual(await api.purchaseRequirement(input, { signal, headers: { "x-read-trace": "effective-rule" } }), result);
  assert.deepEqual(input, { store_id: storeId, id: subscriptionId, at: 1_700_000_000_123 });
  assert.equal(calls[0].path, `/v1/stores/${storeId}/subscriptions/${subscriptionId}/purchase-requirement`);
  assert.deepEqual(calls[0].query, { at: "1700000000123" });
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].body, null);
  assert.equal(calls[0].signal, signal);
  assert.equal(calls[0].headers.get("x-read-trace"), "effective-rule");
  await api.purchaseRequirement({ store_id: storeId, id: subscriptionId });
  assert.equal(calls[1].url.search, "");
  for (const at of [-9_007_199_254_740_991, 0, 9_007_199_254_740_991]) {
    await api.purchaseRequirement({ store_id: storeId, id: subscriptionId, at });
    assert.equal(calls.at(-1).query.at, String(at));
  }
  const count = calls.length;
  for (const at of [Number.NaN, Number.POSITIVE_INFINITY]) {
    await assert.rejects(async () => api.purchaseRequirement({ store_id: storeId, id: subscriptionId, at }), /requires a finite number/);
  }
  await assert.rejects(async () => api.purchaseRequirement({ id: subscriptionId }), TypeError);
  assert.equal(calls.length, count);
});

test("a minimum change is reviewed and accepted with the subscription version, and a transfer names both subscriptions", async (context) => {
  const calls = recordFetch(context, () => ({ subscription: { id: subscriptionId }, created: [], withdrawn: [], timeline: [] }));
  const api = subscriptions();
  const change = { subscription_id: subscriptionId, expected_updated_at: 1_700_000_000_000, requirement, reason: "Contract renegotiated" };
  const removal = { ...change, requirement: null, reason: "Minimum waived" };
  const transfer = {
    from: { subscription_id: subscriptionId, expected_updated_at: 1_700_000_000_000 },
    to: { subscription_id: otherSubscriptionId, expected_updated_at: 1_700_000_000_500 },
    requirement,
    reason: "Branch moved",
  };
  await api.reviewPurchaseRequirementChange({ store_id: storeId, ...change });
  await api.changePurchaseRequirement({ store_id: storeId, ...removal });
  await api.transferPurchaseRequirement({ store_id: storeId, ...transfer });
  const base = `/v1/stores/${storeId}/subscriptions/purchase-requirement`;
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `${base}/review`, change],
    ["POST", `${base}/accept`, removal],
    ["POST", `${base}/transfer`, transfer],
  ]);
});
