import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";
import { apiUrl, errorResponse, ids, publishableKey, recordFetch, visitorStorage, visitorToken } from "./helpers/arky-fixtures.mjs";

const store = "56c82765-4f5a-47e9-bd6d-dba7c6354919";
const otherStore = "e5f1a9c3-7b24-4d68-a0e2-9c4b7d1f3e85";
const memberId = "0d4b8c62-3a75-4f0e-9a52-3e2bb2a3d5f1";
const methodId = "4c2e7b19-6f3a-4d8e-b1c5-9a0d2e7f3b64";
const groupId = "7e3a9c51-2b84-4d6f-a0c7-5e1d3b9f2a68";
const revisionId = "5b1e9d37-2c84-4a06-b3f9-7d2e0c4a8f61";
const catalogId = "e4c8a2f6-1b73-4d95-a0e7-5f2c9b6d3a18";
const version = 1_700_000_000_000;

function members() {
  return createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop.customerGroupMember;
}

function change(member = { id: memberId }) {
  return { customer_group_member: member, created: null, withdrawn: null };
}

test("cancelling, pausing, resuming and revoking each send one action with the member version and no hidden identity", async (context) => {
  const result = { id: memberId, status: { type: "active" } };
  const calls = recordFetch(context, () => result);
  const api = members();
  const actions = [
    ["cancel", "cancel", {}],
    ["pause", "pause", { reason: "Customer is travelling" }],
    ["resume", "resume", {}],
    ["revoke", "revoke", { reason: "Contract ended early" }],
  ];
  for (const [call, verb, fields] of actions) {
    const params = { store_id: store, id: memberId, expected_updated_at: version, ...fields };
    const before = structuredClone(params);
    assert.deepEqual(await api[call](params), result);
    assert.deepEqual(await api[call](params), result);
    assert.deepEqual(params, before);
    assert.deepEqual(calls.at(-1).body, calls.at(-2).body);
    assert.deepEqual(calls.at(-1).body, { expected_updated_at: version, ...fields });
    assert.equal(calls.at(-1).path, `/v1/stores/${store}/customer-group-members/${memberId}/${verb}`);
  }
  await assert.rejects(async () => api.pause({ id: memberId, expected_updated_at: 1, reason: "Travel" }), TypeError);
  assert.equal(calls.length, 8);
  assert.ok(calls.every((call) => call.method === "POST" && call.url.search === "" && !("store_id" in call.body) && !("id" in call.body)));
  for (const removed of ["control", "calendarOptions", "changeCalendar", "changePaymentMethod", "changePlan", "reviewCalendarChange", "reviewPaymentMethodChange", "reviewPlanChange"]) {
    assert.equal(removed in api, false, removed);
  }
});

test("a skipped purchase, a payment method, a scheduled end, a switch and a withdrawal go to the named store with the same body", async (context) => {
  const calls = recordFetch(context, (call) => /\/(review-switch|switch|withdraw-revision)$/.test(call.path) ? change() : { id: memberId });
  const api = members();
  const switchTo = { expected_updated_at: version, to_customer_group_id: groupId, reason: "Upgrade" };
  const before = structuredClone(switchTo);
  await api.skipNext({ store_id: store, id: memberId, expected_updated_at: version, occurrence_index: 4 });
  await api.selectPaymentMethod({ store_id: otherStore, id: memberId, expected_updated_at: version, payment_method_id: methodId });
  await api.scheduleEnd({ store_id: store, id: memberId, expected_updated_at: version, end_at: 1_800_000_000_000 });
  assert.deepEqual(await api.reviewSwitch({ store_id: store, id: memberId, ...switchTo }), change());
  await api.switch({ store_id: store, id: memberId, ...switchTo, catalog_id: catalogId });
  await api.withdrawRevision({ store_id: store, id: memberId, expected_updated_at: version, revision_id: revisionId, reason: "Entered by mistake" });
  assert.deepEqual(switchTo, before);
  const base = `/v1/stores/${store}/customer-group-members/${memberId}`;
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["POST", `${base}/skip-next`, { expected_updated_at: version, occurrence_index: 4 }],
    ["POST", `/v1/stores/${otherStore}/customer-group-members/${memberId}/select-payment-method`, { expected_updated_at: version, payment_method_id: methodId }],
    ["POST", `${base}/schedule-end`, { expected_updated_at: version, end_at: 1_800_000_000_000 }],
    ["POST", `${base}/review-switch`, switchTo],
    ["POST", `${base}/switch`, { ...switchTo, catalog_id: catalogId }],
    ["POST", `${base}/withdraw-revision`, { expected_updated_at: version, revision_id: revisionId, reason: "Entered by mistake" }],
  ]);
  assert.equal("catalog_id" in calls[3].body, false);
  assert.equal("rentals" in calls[4].body, false);
  await assert.rejects(async () => api.selectPaymentMethod({ id: memberId, expected_updated_at: version, payment_method_id: methodId }), TypeError);
  assert.equal(calls.length, 6);
  assert.ok(calls.every((call) => call.url.search === "" && !("store_id" in call.body)));
});

test("a switch whose catalog can't sell the new group is refused as TARGET_NOT_PRICED and never retried from another catalog", async (context) => {
  const calls = recordFetch(context, () => errorResponse(409, "CUSTOMER_GROUP_MEMBER.TARGET_NOT_PRICED", "This catalog doesn't sell the new group to this buyer"));
  const api = members();
  const switchTo = { store_id: store, id: memberId, expected_updated_at: version, to_customer_group_id: groupId, catalog_id: catalogId, reason: "Upgrade" };
  for (const call of ["reviewSwitch", "switch"]) {
    await assert.rejects(api[call](switchTo), (error) => {
      assert.equal(error.code, "CUSTOMER_GROUP_MEMBER.TARGET_NOT_PRICED");
      assert.equal(error.statusCode, 409);
      return true;
    });
  }
  const base = `/v1/stores/${store}/customer-group-members/${memberId}`;
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["POST", `${base}/review-switch`, { expected_updated_at: version, to_customer_group_id: groupId, catalog_id: catalogId, reason: "Upgrade" }],
    ["POST", `${base}/switch`, { expected_updated_at: version, to_customer_group_id: groupId, catalog_id: catalogId, reason: "Upgrade" }],
  ]);
});

test("the calendar and purchase access read the member's next occurrence and grants with the exact catalog, channel and variants", async (context) => {
  const calendar = {
    customer_group_member: { id: memberId },
    next: { type: "period", occurrence_index: 4, period: { from: 1, to: 2 } },
    after_skip: { type: "period", occurrence_index: 5, period: { from: 2, to: 3 } },
  };
  const access = { customer_group_member_id: memberId, catalog_id: catalogId, sales_channel_id: ids.channel, as_of: 1, grants: [], cursor: null };
  const calls = recordFetch(context, (call) => call.path.endsWith("/calendar") ? calendar : access);
  const api = members();
  assert.deepEqual(await api.calendar({ store_id: store, id: memberId }), calendar);
  assert.deepEqual(await api.purchaseAccess({ store_id: store, id: memberId, catalog_id: catalogId, sales_channel_id: ids.channel, variant_ids: [ids.variant], limit: 10, cursor: "next" }), access);
  const base = `/v1/stores/${store}/customer-group-members/${memberId}`;
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", `${base}/calendar`, {}, null],
    ["GET", `${base}/purchase-access`, { catalog_id: catalogId, sales_channel_id: ids.channel, variant_ids: JSON.stringify([ids.variant]), limit: "10", cursor: "next" }, null],
  ]);
});

test("a buyer acts on and reads their own member through storefront routes and gets their own view back", async (context) => {
  const self = { id: memberId, status: { type: "paused", paused_at: 5 } };
  const calls = recordFetch(context, (call) => {
    if (/\/(review-switch|switch|withdraw-revision)$/.test(call.path)) return change(self);
    if (call.path.endsWith("/calendar")) return { customer_group_member: self, next: null, after_skip: null };
    if (call.path.endsWith("/purchase-access")) return { customer_group_member_id: memberId, catalog_id: catalogId, sales_channel_id: ids.channel, as_of: 1, grants: [], cursor: null };
    if (call.method === "GET" && (call.path.endsWith("/orders") || call.path === "/v1/storefront/customer-group-members")) return { items: [], cursor: null };
    if (call.path.includes("/revisions/")) return { revision: { id: revisionId }, terms: {} };
    return self;
  });
  const api = createStorefront(publishableKey, { apiUrl, sessionStorage: visitorStorage() }).eshop.customerGroupMember;
  const switchTo = { id: memberId, expected_updated_at: version, to_customer_group_id: groupId, reason: "Upgrade" };
  assert.deepEqual(await api.pause({ id: memberId, expected_updated_at: 5, reason: "Travel" }), self);
  await api.resume({ id: memberId, expected_updated_at: 6 });
  await api.cancel({ id: memberId, expected_updated_at: 7 });
  await api.skipNext({ id: memberId, expected_updated_at: 8, occurrence_index: 3 });
  await api.selectPaymentMethod({ id: memberId, expected_updated_at: 9, payment_method_id: methodId });
  assert.deepEqual(await api.reviewSwitch(switchTo), change(self));
  await api.switch({ ...switchTo, catalog_id: catalogId });
  await api.withdrawRevision({ id: memberId, expected_updated_at: 10, revision_id: revisionId, reason: "Changed my mind" });
  await api.calendar({ id: memberId });
  await api.purchaseAccess({ id: memberId, catalog_id: catalogId, variant_ids: [ids.variant], limit: 5 });
  await api.get({ id: memberId });
  await api.getRevision({ customer_group_member_id: memberId, revision_id: revisionId });
  await api.findOrders({ id: memberId, limit: 5, cursor: "next" });
  await api.find({ company_location_id: ids.companyLocation, status: "active", limit: 5 });
  const base = `/v1/storefront/customer-group-members/${memberId}`;
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.query, call.body]), [
    ["POST", `${base}/pause`, {}, { expected_updated_at: 5, reason: "Travel" }],
    ["POST", `${base}/resume`, {}, { expected_updated_at: 6 }],
    ["POST", `${base}/cancel`, {}, { expected_updated_at: 7 }],
    ["POST", `${base}/skip-next`, {}, { expected_updated_at: 8, occurrence_index: 3 }],
    ["POST", `${base}/select-payment-method`, {}, { expected_updated_at: 9, payment_method_id: methodId }],
    ["POST", `${base}/review-switch`, {}, { expected_updated_at: version, to_customer_group_id: groupId, reason: "Upgrade" }],
    ["POST", `${base}/switch`, {}, { expected_updated_at: version, to_customer_group_id: groupId, reason: "Upgrade", catalog_id: catalogId }],
    ["POST", `${base}/withdraw-revision`, {}, { expected_updated_at: 10, revision_id: revisionId, reason: "Changed my mind" }],
    ["GET", `${base}/calendar`, {}, null],
    ["GET", `${base}/purchase-access`, { catalog_id: catalogId, variant_ids: JSON.stringify([ids.variant]), limit: "5" }, null],
    ["GET", base, {}, null],
    ["GET", `${base}/revisions/${revisionId}`, {}, null],
    ["GET", `${base}/orders`, { limit: "5", cursor: "next" }, null],
    ["GET", "/v1/storefront/customer-group-members", { company_location_id: ids.companyLocation, status: "active", limit: "5" }, null],
  ]);
  for (const call of calls) {
    assert.equal(call.headers.get("authorization"), `Bearer ${visitorToken}`);
    assert.equal(call.headers.has("x-arky-sales-channel"), false);
    assert.equal(call.body !== null && "store_id" in call.body, false);
    assert.equal("sales_channel_id" in call.query, false);
  }
});
