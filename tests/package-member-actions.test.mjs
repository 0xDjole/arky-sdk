import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";
import { apiUrl, errorResponse, fixedIdFactories, ids, publishableKey, recordFetch, visitorStorage, visitorToken } from "./helpers/arky-fixtures.mjs";

const store = "56c82765-4f5a-47e9-bd6d-dba7c6354919";
const otherStore = "e5f1a9c3-7b24-4d68-a0e2-9c4b7d1f3e85";
const memberId = "0d4b8c62-3a75-4f0e-9a52-3e2bb2a3d5f1";
const methodId = "4c2e7b19-6f3a-4d8e-b1c5-9a0d2e7f3b64";
const memberPackageId = "7e3a9c51-2b84-4d6f-a0c7-5e1d3b9f2a68";
const revisionId = "5b1e9d37-2c84-4a06-b3f9-7d2e0c4a8f61";
const packageId = "e4c8a2f6-1b73-4d95-a0e7-5f2c9b6d3a18";
const version = 1_700_000_000_000;
const choices = [{ package_item_id: "dc78a8a7-27c3-47c2-8063-2f62c7f7a661", variant_id: ids.variant }];

function members() {
  return createAdmin({ apiUrl: "https://api.example.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" }).eshop.packageMember;
}

function change(member = { id: memberId }) {
  return { package_member: member, created: null, withdrawn: null };
}

test("cancelling, pausing, resuming and revoking each send one action with the member version and no hidden identity", async (context) => {
  const result = { id: memberId, status: { type: "active" } };
  const calls = recordFetch(context, () => result);
  const api = members();
  const actions = [
    ["cancel", "cancel", { notify_customer: false }],
    ["pause", "pause", { reason: "Customer is travelling", resumes: { type: "at", at: 1_800_000_000_000 } }],
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
    assert.equal(calls.at(-1).path, `/v1/stores/${store}/package-members/${memberId}/${verb}`);
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
  const switchTo = { expected_updated_at: version, to_package_id: memberPackageId, choices, price: { package_id: packageId, package_item_id: ids.packageItem, price_id: ids.price }, deliveries: [], reason: "Upgrade" };
  const before = structuredClone(switchTo);
  await api.skipNext({ store_id: store, id: memberId, expected_updated_at: version, occurrence_index: 4 });
  await api.selectPaymentMethod({ store_id: otherStore, id: memberId, expected_updated_at: version, payment_method_id: methodId });
  await api.scheduleEnd({ store_id: store, id: memberId, expected_updated_at: version, end_at: 1_800_000_000_000, notify_customer: true });
  assert.deepEqual(await api.reviewSwitch({ store_id: store, id: memberId, ...switchTo }), change());
  await api.switch({ store_id: store, id: memberId, ...switchTo });
  await api.withdrawRevision({ store_id: store, id: memberId, expected_updated_at: version, revision_id: revisionId, reason: "Entered by mistake" });
  assert.deepEqual(switchTo, before);
  const base = `/v1/stores/${store}/package-members/${memberId}`;
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["POST", `${base}/skip-next`, { expected_updated_at: version, occurrence_index: 4 }],
    ["POST", `/v1/stores/${otherStore}/package-members/${memberId}/select-payment-method`, { expected_updated_at: version, payment_method_id: methodId }],
    ["POST", `${base}/schedule-end`, { expected_updated_at: version, end_at: 1_800_000_000_000, notify_customer: true }],
    ["POST", `${base}/review-switch`, switchTo],
    ["POST", `${base}/switch`, switchTo],
    ["POST", `${base}/withdraw-revision`, { expected_updated_at: version, revision_id: revisionId, reason: "Entered by mistake" }],
  ]);
  assert.equal("language" in calls[2].body, false);
  assert.equal("rentals" in calls[4].body, false);
  await assert.rejects(async () => api.selectPaymentMethod({ id: memberId, expected_updated_at: version, payment_method_id: methodId }), TypeError);
  assert.equal(calls.length, 6);
  assert.ok(calls.every((call) => call.url.search === "" && !("store_id" in call.body)));
});

test("a switch whose price source can't sell the new package is refused as TARGET_NOT_PRICED and never retried from another package", async (context) => {
  const calls = recordFetch(context, () => errorResponse(409, "PACKAGE_MEMBER.TARGET_NOT_PRICED", "This package doesn't sell the new package to this buyer"));
  const api = members();
  const switchTo = { store_id: store, id: memberId, expected_updated_at: version, to_package_id: memberPackageId, choices, price: { package_id: packageId, package_item_id: ids.packageItem, price_id: ids.price }, deliveries: [], reason: "Upgrade" };
  for (const call of ["reviewSwitch", "switch"]) {
    await assert.rejects(api[call](switchTo), (error) => {
      assert.equal(error.code, "PACKAGE_MEMBER.TARGET_NOT_PRICED");
      assert.equal(error.statusCode, 409);
      return true;
    });
  }
  const base = `/v1/stores/${store}/package-members/${memberId}`;
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["POST", `${base}/review-switch`, { expected_updated_at: version, to_package_id: memberPackageId, choices, price: { package_id: packageId, package_item_id: ids.packageItem, price_id: ids.price }, deliveries: [], reason: "Upgrade" }],
    ["POST", `${base}/switch`, { expected_updated_at: version, to_package_id: memberPackageId, choices, price: { package_id: packageId, package_item_id: ids.packageItem, price_id: ids.price }, deliveries: [], reason: "Upgrade" }],
  ]);
});

test("a renewing switch names a delivery for the new package's shipping profile, and a switch without it is refused as DELIVERY_REQUIRED", async (context) => {
  const address = { name: "Customer", company: null, street1: "2 New Street", street2: null, city: "Sarajevo", state: null, postal_code: "71000", country: "BA", phone: null, email: null };
  const delivery = {
    id: "8a3f6c21-4d97-4b05-9e18-2c7b5d0a3f64",
    package_item_ids: [choices[0].package_item_id],
    destination: { type: "delivery", address },
    shipping_method_id: methodId,
    shipping_profile_id: "fb14f4a3-a278-43f5-8497-f0d9a8ee2548",
    base_fee: 600,
  };
  let refuse = true;
  const calls = recordFetch(context, () => refuse
    ? errorResponse(409, "PACKAGE_MEMBER.DELIVERY_REQUIRED", "The new package ships or lends goods of a shipping profile the member's terms don't deliver; name a delivery for them")
    : change());
  const api = members();
  const switchTo = { store_id: store, id: memberId, expected_updated_at: version, to_package_id: memberPackageId, choices, price: { package_id: packageId, package_item_id: ids.packageItem, price_id: ids.price }, deliveries: [], reason: "Add the print edition" };
  await assert.rejects(api.reviewSwitch(switchTo), (error) => {
    assert.equal(error.code, "PACKAGE_MEMBER.DELIVERY_REQUIRED");
    assert.equal(error.statusCode, 409);
    return true;
  });
  refuse = false;
  const named = { ...switchTo, deliveries: [delivery] };
  const before = structuredClone(named);
  assert.deepEqual(await api.reviewSwitch(named), change());
  assert.deepEqual(await api.switch(named), change());
  assert.deepEqual(named, before);
  const base = `/v1/stores/${store}/package-members/${memberId}`;
  const { store_id: _store, id: _id, ...body } = named;
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["POST", `${base}/review-switch`, { ...body, deliveries: [] }],
    ["POST", `${base}/review-switch`, body],
    ["POST", `${base}/switch`, body],
  ]);
});

test("the calendar reads the member's next occurrence and the one after a skip", async (context) => {
  const calendar = {
    package_member: { id: memberId },
    next: { type: "period", occurrence_index: 4, period: { from: 1, to: 2 } },
    after_skip: { type: "period", occurrence_index: 5, period: { from: 2, to: 3 } },
  };
  const calls = recordFetch(context, () => calendar);
  const api = members();
  assert.deepEqual(await api.getCalendar({ store_id: store, id: memberId }), calendar);
  const base = `/v1/stores/${store}/package-members/${memberId}`;
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", `${base}/calendar`, {}, null],
  ]);
});

test("a buyer acts on and reads their own member through storefront routes and gets their own view back", async (context) => {
  const self = { id: memberId, status: { type: "paused", cause: { type: "requested", resumes: { type: "never" } }, paused_at: 5 } };
  const revision = {
    revision: { id: revisionId },
    terms: {},
    package: { id: memberPackageId, key: "gold-2025", blocks: [{ id: ids.line, key: "name", type: "text", value: "Gold" }] },
  };
  const calls = recordFetch(context, (call) => {
    if (/\/(review-switch|switch|withdraw-revision)$/.test(call.path)) return change(self);
    if (call.path.endsWith("/calendar")) return { package_member: self, next: null, after_skip: null };
    if (call.method === "GET" && (call.path.endsWith("/orders") || call.path === "/v1/storefront/package-members")) return { items: [], cursor: null };
    if (call.path.includes("/revisions/")) return revision;
    return self;
  });
  const api = createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, sessionStorage: visitorStorage() }).eshop.packageMember;
  const switchTo = { id: memberId, expected_updated_at: version, to_package_id: memberPackageId, choices, price: { package_id: packageId, package_item_id: ids.packageItem, price_id: ids.price }, deliveries: [], reason: "Upgrade" };
  assert.deepEqual(await api.pause({ id: memberId, expected_updated_at: 5, reason: "Travel", resumes: { type: "never" } }), self);
  await api.resume({ id: memberId, expected_updated_at: 6 });
  await api.cancel({ id: memberId, expected_updated_at: 7 });
  await api.skipNext({ id: memberId, expected_updated_at: 8, occurrence_index: 3 });
  await api.selectPaymentMethod({ id: memberId, expected_updated_at: 9, payment_method_id: methodId });
  assert.deepEqual(await api.reviewSwitch(switchTo), change(self));
  await api.switch(switchTo);
  await api.withdrawRevision({ id: memberId, expected_updated_at: 10, revision_id: revisionId, reason: "Changed my mind" });
  await api.getCalendar({ id: memberId });
  await api.get({ id: memberId });
  assert.deepEqual(await api.getRevision({ package_member_id: memberId, revision_id: revisionId }), revision);
  await api.findOrders({ id: memberId, limit: 5, cursor: "next" });
  await api.find({ company_location_id: ids.companyLocation, status: "active", limit: 5 });
  const base = `/v1/storefront/package-members/${memberId}`;
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.query, call.body]), [
    ["POST", `${base}/pause`, {}, { expected_updated_at: 5, reason: "Travel", resumes: { type: "never" } }],
    ["POST", `${base}/resume`, {}, { expected_updated_at: 6 }],
    ["POST", `${base}/cancel`, {}, { expected_updated_at: 7 }],
    ["POST", `${base}/skip-next`, {}, { expected_updated_at: 8, occurrence_index: 3 }],
    ["POST", `${base}/select-payment-method`, {}, { expected_updated_at: 9, payment_method_id: methodId }],
    ["POST", `${base}/review-switch`, {}, { expected_updated_at: version, to_package_id: memberPackageId, choices, price: { package_id: packageId, package_item_id: ids.packageItem, price_id: ids.price }, deliveries: [], reason: "Upgrade" }],
    ["POST", `${base}/switch`, {}, { expected_updated_at: version, to_package_id: memberPackageId, choices, price: { package_id: packageId, package_item_id: ids.packageItem, price_id: ids.price }, deliveries: [], reason: "Upgrade" }],
    ["POST", `${base}/withdraw-revision`, {}, { expected_updated_at: 10, revision_id: revisionId, reason: "Changed my mind" }],
    ["GET", `${base}/calendar`, {}, null],
    ["GET", base, {}, null],
    ["GET", `${base}/revisions/${revisionId}`, {}, null],
    ["GET", `${base}/orders`, { limit: "5", cursor: "next" }, null],
    ["GET", "/v1/storefront/package-members", { company_location_id: ids.companyLocation, status: "active", limit: "5" }, null],
  ]);
  for (const call of calls) {
    assert.equal(call.headers.get("authorization"), `Bearer ${visitorToken}`);
    assert.equal(call.headers.has("x-arky-sales-channel"), false);
    assert.equal(call.body !== null && "store_id" in call.body, false);
    assert.equal("sales_channel_id" in call.query, false);
  }
});
