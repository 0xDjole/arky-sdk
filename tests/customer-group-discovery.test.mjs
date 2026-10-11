import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront, initialize } from "../dist/storefront.js";
import { apiUrl, publishableKey, SessionStorage } from "./helpers/arky-fixtures.mjs";

const storefrontMemberCalls = [
  "calendar", "cancel", "find", "findOrders", "get", "getRevision", "pause", "purchaseAccess", "resume",
  "reviewSwitch", "selectPaymentMethod", "skipNext", "switch", "withdrawRevision",
];

test("the storefront reads groups, offerings and the shopper's own members under eshop, with no join, assign or email consent calls", () => {
  const client = createStorefront(publishableKey, { apiUrl, sessionStorage: new SessionStorage() });
  const store = initialize(publishableKey, { apiUrl, sessionStorage: new SessionStorage() });
  for (const removed of ["customer_groups", "customer_group_members", "customer_group_email_consents", "subscription_plans", "subscription_offerings"]) {
    assert.equal(removed in client, false, removed);
    assert.equal(removed in store, false, removed);
  }
  for (const facade of [client, store]) {
    assert.deepEqual(Object.keys(facade.eshop.customerGroup).sort(), ["find", "get"]);
    assert.deepEqual(Object.keys(facade.eshop.customerGroupOffering).sort(), ["get"]);
    assert.deepEqual(Object.keys(facade.eshop.customerGroupMember).sort(), storefrontMemberCalls);
    for (const removed of ["assign", "join", "revoke", "scheduleEnd", "transferPurchaseRequirement", "changePurchaseRequirement", "correctTaxClassification"]) {
      assert.equal(removed in facade.eshop.customerGroupMember, false, removed);
    }
    assert.equal("subscription" in facade.eshop, false);
  }
});

test("group and member transport keeps combined predicates, empty continuations and app-picked ids", async (context) => {
  const store = "56c82765-4f5a-47e9-bd6d-dba7c6354919";
  const groupId = "cf8a15f4-1489-40a1-a850-a98b7e311699";
  const offeringId = "a3d5f7b9-2c4e-4a6b-8d0f-1e3a5c7e9b2d";
  const memberId = "e245588f-0542-4bb3-97c8-23de326627d1";
  const customerId = "70b5f662-f3d8-48c9-8c16-c60dd4ff1703";
  const cursor = "opaque:/+==next";
  const groupFields = { key: "members", blocks: [], term: { type: "permanent" }, entitlements: [], purchase_requirement: null, tax_policies: [], status: { type: "active" }, starts_at: null, ends_at: null };
  const group = { id: groupId, store_id: store, ...groupFields, created_at: 1, updated_at: 1 };
  const subject = { type: "customer", customer_id: customerId };
  const member = { id: memberId, store_id: store, customer_group_id: groupId, subject, type: { type: "permanent" }, status: { type: "active" }, access_end_at: null, created_at: 1, updated_at: 1 };
  const replies = [{ items: [], cursor }, { items: [group], cursor: null }, group, group, { items: [], cursor }, { items: [member], cursor: null }, member, member, null];
  const calls = [];
  context.mock.method(globalThis, "fetch", async (input, init = {}) => {
    calls.push({ url: new URL(input), method: init.method ?? "GET", headers: new Headers(init.headers), body: init.body ? JSON.parse(init.body) : null });
    const reply = replies.shift();
    if (reply === null) return new Response(null, { status: 204 });
    return new Response(JSON.stringify(reply), { status: 200, headers: { "content-type": "application/json" } });
  });
  const admin = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" });
  const filter = { store_id: store, customer_group_offering_id: offeringId, status: { type: "active" }, query: "members", limit: 20 };
  const page = await admin.eshop.customerGroup.find(filter);
  assert.deepEqual(page, { items: [], cursor });
  assert.equal(calls.length, 1);
  assert.deepEqual(Object.fromEntries(calls[0].url.searchParams), { customer_group_offering_id: offeringId, status: JSON.stringify({ type: "active" }), query: "members", limit: "20" });
  assert.deepEqual(await admin.eshop.customerGroup.find({ ...filter, cursor: page.cursor }), { items: [group], cursor: null });
  assert.deepEqual(await admin.eshop.customerGroup.getByKey({ store_id: store, key: group.key }), group);
  assert.deepEqual(await admin.eshop.customerGroup.create({ store_id: store, id: groupId, ...groupFields }), group);
  const members = { store_id: store, customer_group_id: groupId, customer_id: customerId, status: "active", limit: 20 };
  assert.deepEqual(await admin.eshop.customerGroupMember.find(members), { items: [], cursor });
  assert.deepEqual(await admin.eshop.customerGroupMember.find({ ...members, cursor }), { items: [member], cursor: null });
  assert.deepEqual(await admin.eshop.customerGroupMember.get({ store_id: store, id: memberId }), member);
  assert.deepEqual(await admin.eshop.customerGroupMember.assign({ store_id: store, id: memberId, customer_group_id: groupId, subject, access_end_at: null }), member);
  assert.equal(await admin.eshop.customerGroup.delete({ store_id: store, id: groupId, expected_updated_at: 1 }), undefined);
  assert.ok(calls.every((call) => call.url.pathname.startsWith(`/v1/stores/${store}/`) && call.headers.get("authorization") === "Bearer arky_api_test"));
  assert.deepEqual(Object.fromEntries(calls[1].url.searchParams), { customer_group_offering_id: offeringId, status: JSON.stringify({ type: "active" }), query: "members", limit: "20", cursor });
  assert.equal(calls[2].url.pathname, `/v1/stores/${store}/customer-groups/by-key/members`);
  assert.deepEqual(calls[3].body, { id: groupId, ...groupFields });
  assert.deepEqual(Object.fromEntries(calls[5].url.searchParams), { customer_group_id: groupId, customer_id: customerId, status: "active", limit: "20", cursor });
  assert.equal(calls[6].url.pathname, `/v1/stores/${store}/customer-group-members/${memberId}`);
  assert.equal(calls[7].method, "POST");
  assert.equal(calls[7].url.pathname, `/v1/stores/${store}/customer-group-members`);
  assert.deepEqual(calls[7].body, { id: memberId, customer_group_id: groupId, subject, access_end_at: null });
  assert.equal(calls[8].method, "DELETE");
  assert.equal(calls[8].url.pathname, `/v1/stores/${store}/customer-groups/${groupId}`);
  assert.equal(calls[8].url.search, "?expected_updated_at=1");
  assert.equal(calls.length, 9);
  await assert.rejects(async () => admin.eshop.customerGroupMember.assign({ store_id: store, id: "member", customer_group_id: groupId, subject, access_end_at: null }), TypeError);
  await assert.rejects(async () => admin.eshop.customerGroup.create({ store_id: store, id: undefined, ...groupFields }), TypeError);
  await assert.rejects(async () => admin.eshop.customerGroupMember.find({ ...members, store_id: undefined }), TypeError);
  assert.equal(calls.length, 9);
  for (const removed of ["add", "remove", "lookup", "execute", "join", "findCommands", "update", "delete"]) assert.equal(removed in admin.eshop.customerGroupMember, false, removed);
  assert.equal("usage" in admin.eshop.customerGroup, false);
});
