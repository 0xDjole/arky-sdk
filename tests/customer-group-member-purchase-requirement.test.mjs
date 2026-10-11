import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { recordFetch } from "./helpers/arky-fixtures.mjs";

const storeId = "3b21b61d-7162-414c-a73a-888ccbc57c3e";
const memberId = "d65211c1-743f-45fb-ab24-07221b1e3a7c";
const otherMemberId = "5f2a8c63-1d47-4b90-a3e6-9c0b7d4e2f18";
const entitlementId = "0b9a4b7e-51a1-4d5f-9d9f-7a0e3f9ce0a1";
const requirement = {
  unit: { type: "millilitres" },
  minimum_quantity: 5000,
  period: { type: "calendar_month", timezone: "Europe/Sarajevo" },
  qualifying_variants: [{ variant_id: "variant", contribution_per_unit: 250 }],
  scope: { type: "per_location" },
};

function members() {
  return createAdmin({ baseUrl: "https://api.example.test", apiToken: "contract" }).eshop.customerGroupMember;
}

test("the effective minimum is read at the caller's instant or at the Server's now, with the caller's request options", async (context) => {
  const result = { customer_group_member: { id: memberId, store_id: storeId }, starts_at: 1, ends_at: null, evaluated_at: 1_700_000_000_123, initial: null, current: requirement };
  const calls = recordFetch(context, () => result);
  const api = members();
  const signal = new AbortController().signal;
  const input = { store_id: storeId, id: memberId, at: 1_700_000_000_123 };
  assert.deepEqual(await api.purchaseRequirement(input, { signal, headers: { "x-read-trace": "effective-rule" } }), result);
  assert.deepEqual(input, { store_id: storeId, id: memberId, at: 1_700_000_000_123 });
  assert.equal(calls[0].path, `/v1/stores/${storeId}/customer-group-members/${memberId}/purchase-requirement`);
  assert.deepEqual(calls[0].query, { at: "1700000000123" });
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].body, null);
  assert.equal(calls[0].signal, signal);
  assert.equal(calls[0].headers.get("x-read-trace"), "effective-rule");
  await api.purchaseRequirement({ store_id: storeId, id: memberId });
  assert.equal(calls[1].url.search, "");
  for (const at of [-9_007_199_254_740_991, 0, 9_007_199_254_740_991]) {
    await api.purchaseRequirement({ store_id: storeId, id: memberId, at });
    assert.equal(calls.at(-1).query.at, String(at));
  }
  const count = calls.length;
  for (const at of [Number.NaN, Number.POSITIVE_INFINITY]) {
    await assert.rejects(async () => api.purchaseRequirement({ store_id: storeId, id: memberId, at }), /requires a finite number/);
  }
  await assert.rejects(async () => api.purchaseRequirement({ id: memberId }), TypeError);
  assert.equal(calls.length, count);
});

test("a minimum change and a tax correction are reviewed and accepted with the member version, and a transfer names both members", async (context) => {
  const answer = { customer_group_member: { id: memberId }, created: null, withdrawn: null };
  const calls = recordFetch(context, (call) => call.path.endsWith("/transfer-purchase-requirement") ? { from: answer, to: { ...answer, customer_group_member: { id: otherMemberId } } } : answer);
  const api = members();
  const change = { expected_updated_at: 1_700_000_000_000, requirement, reason: "Contract renegotiated" };
  const removal = { ...change, requirement: null, reason: "Minimum waived" };
  const correction = { expected_updated_at: 1_700_000_000_100, changes: [{ entitlement_id: entitlementId, tax_category_id: "reduced" }], reason: "Wrong rate" };
  const transfer = {
    from: { customer_group_member_id: memberId, expected_updated_at: 1_700_000_000_000 },
    to: { customer_group_member_id: otherMemberId, expected_updated_at: 1_700_000_000_500 },
    requirement,
    reason: "Location moved",
  };
  await api.reviewPurchaseRequirement({ store_id: storeId, id: memberId, ...change });
  await api.changePurchaseRequirement({ store_id: storeId, id: memberId, ...removal });
  await api.reviewTaxCorrection({ store_id: storeId, id: memberId, ...correction });
  await api.correctTaxClassification({ store_id: storeId, id: memberId, ...correction });
  const moved = await api.transferPurchaseRequirement({ store_id: storeId, ...transfer });
  assert.equal(moved.to.customer_group_member.id, otherMemberId);
  const base = `/v1/stores/${storeId}/customer-group-members`;
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `${base}/${memberId}/review-purchase-requirement`, change],
    ["POST", `${base}/${memberId}/change-purchase-requirement`, removal],
    ["POST", `${base}/${memberId}/review-tax-correction`, correction],
    ["POST", `${base}/${memberId}/correct-tax-classification`, correction],
    ["POST", `${base}/transfer-purchase-requirement`, transfer],
  ]);
  assert.ok(calls.every((call) => call.url.search === "" && !("store_id" in call.body) && !("id" in call.body)));
  for (const removed of ["reviewPurchaseRequirementChange"]) assert.equal(removed in api, false, removed);
});
