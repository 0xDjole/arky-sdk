import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { recordFetch } from "./helpers/arky-fixtures.mjs";

const storeId = "3b21b61d-7162-414c-a73a-888ccbc57c3e";
const memberId = "d65211c1-743f-45fb-ab24-07221b1e3a7c";
const otherMemberId = "5f2a8c63-1d47-4b90-a3e6-9c0b7d4e2f18";
const minimum = {
  type: "per_month",
  quantity: 5000,
  counts: { type: "variants", variant_ids: ["variant"] },
  scope: { type: "per_location" },
};

function members() {
  return createAdmin({ apiUrl: "https://api.example.test", secretKey: "contract" }).eshop.packageMember;
}

test("the effective minimum is read at the caller's instant or at the Server's now, with the caller's request options", async (context) => {
  const result = { package_member: { id: memberId, store_id: storeId }, starts_at: 1, timezone: "Europe/Sarajevo", ends_at: null, evaluated_at: 1_700_000_000_123, initial: { type: "none" }, current: minimum };
  const calls = recordFetch(context, () => result);
  const api = members();
  const signal = new AbortController().signal;
  const input = { store_id: storeId, id: memberId, at: 1_700_000_000_123 };
  assert.deepEqual(await api.getMinimum(input, { signal, headers: { "x-read-trace": "effective-rule" } }), result);
  assert.deepEqual(input, { store_id: storeId, id: memberId, at: 1_700_000_000_123 });
  assert.equal(calls[0].path, `/v1/stores/${storeId}/package-members/${memberId}/minimum`);
  assert.deepEqual(calls[0].query, { at: "1700000000123" });
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].body, null);
  assert.equal(calls[0].signal, signal);
  assert.equal(calls[0].headers.get("x-read-trace"), "effective-rule");
  await api.getMinimum({ store_id: storeId, id: memberId });
  assert.equal(calls[1].url.search, "");
  for (const at of [-9_007_199_254_740_991, 0, 9_007_199_254_740_991]) {
    await api.getMinimum({ store_id: storeId, id: memberId, at });
    assert.equal(calls.at(-1).query.at, String(at));
  }
  const count = calls.length;
  for (const at of [Number.NaN, Number.POSITIVE_INFINITY]) {
    await assert.rejects(async () => api.getMinimum({ store_id: storeId, id: memberId, at }), /requires a finite number/);
  }
  await assert.rejects(async () => api.getMinimum({ id: memberId }), TypeError);
  assert.equal(calls.length, count);
});

test("a minimum change is reviewed and accepted with the member version, and a transfer names both members", async (context) => {
  const answer = { package_member: { id: memberId }, created: null, withdrawn: null };
  const calls = recordFetch(context, (call) => call.path.endsWith("/transfer-minimum") ? { from: answer, to: { ...answer, package_member: { id: otherMemberId } } } : answer);
  const api = members();
  const change = { expected_updated_at: 1_700_000_000_000, minimum, reason: "Contract renegotiated" };
  const removal = { ...change, minimum: { type: "none" }, reason: "Minimum waived" };
  const transfer = {
    from: { package_member_id: memberId, expected_updated_at: 1_700_000_000_000 },
    to: { package_member_id: otherMemberId, expected_updated_at: 1_700_000_000_500 },
    minimum,
    reason: "Location moved",
  };
  await api.reviewMinimum({ store_id: storeId, id: memberId, ...change });
  await api.changeMinimum({ store_id: storeId, id: memberId, ...removal });
  const moved = await api.transferMinimum({ store_id: storeId, ...transfer });
  assert.equal(moved.to.package_member.id, otherMemberId);
  const base = `/v1/stores/${storeId}/package-members`;
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `${base}/${memberId}/review-minimum`, change],
    ["POST", `${base}/${memberId}/change-minimum`, removal],
    ["POST", `${base}/transfer-minimum`, transfer],
  ]);
  assert.ok(calls.every((call) => call.url.search === "" && !("store_id" in call.body) && !("id" in call.body)));
  for (const removed of ["reviewMinimumChange", "reviewTaxCorrection", "correctTaxClassification"]) assert.equal(removed in api, false, removed);
});
