import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront, initialize } from "../dist/storefront.js";
import { apiUrl, publishableKey, SessionStorage } from "./helpers/arky-fixtures.mjs";

test("the storefront has no group membership, join or email consent calls", () => {
  const client = createStorefront(publishableKey, { apiUrl, sessionStorage: new SessionStorage() });
  const store = initialize(publishableKey, { apiUrl, sessionStorage: new SessionStorage() });
  for (const removed of ["customer_groups", "customer_group_members", "customer_group_email_consents"]) {
    assert.equal(removed in client, false, removed);
    assert.equal(removed in store, false, removed);
  }
});

test("group and member transport keeps combined predicates, empty continuations and app-picked ids", async (context) => {
  const store = "56c82765-4f5a-47e9-bd6d-dba7c6354919";
  const groupId = "cf8a15f4-1489-40a1-a850-a98b7e311699";
  const memberId = "e245588f-0542-4bb3-97c8-23de326627d1";
  const customerId = "70b5f662-f3d8-48c9-8c16-c60dd4ff1703";
  const cursor = "opaque:/+==next";
  const group = { id: groupId, store_id: store, key: "members", status: { type: "active" }, created_at: 1, updated_at: 1 };
  const member = { id: memberId, store_id: store, customer_group_id: groupId, customer_id: customerId, created_at: 1 };
  const replies = [{ items: [], cursor }, { items: [group], cursor: null }, group, group, { items: [], cursor }, { items: [member], cursor: null }, member, member, member, { ...group, status: { type: "deleting" } }];
  const calls = [];
  context.mock.method(globalThis, "fetch", async (input, init = {}) => {
    calls.push({ url: new URL(input), method: init.method ?? "GET", headers: new Headers(init.headers), body: init.body ? JSON.parse(init.body) : null });
    return new Response(JSON.stringify(replies.shift()), { status: 200, headers: { "content-type": "application/json" } });
  });
  const admin = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" });
  const filter = { store_id: store, key: group.key, status: "active", limit: 20 };
  const page = await admin.eshop.customerGroup.find(filter);
  assert.deepEqual(page, { items: [], cursor });
  assert.equal(calls.length, 1);
  assert.deepEqual(Object.fromEntries(calls[0].url.searchParams), { key: group.key, status: "active", limit: "20" });
  assert.deepEqual(await admin.eshop.customerGroup.find({ ...filter, cursor: page.cursor }), { items: [group], cursor: null });
  assert.deepEqual(await admin.eshop.customerGroup.getByKey({ store_id: store, key: group.key }), group);
  assert.deepEqual(await admin.eshop.customerGroup.create({ store_id: store, id: groupId, key: "members" }), group);
  const members = { store_id: store, customer_group_id: groupId, customer_id: customerId, limit: 20 };
  assert.deepEqual(await admin.eshop.customerGroupMember.find(members), { items: [], cursor });
  assert.deepEqual(await admin.eshop.customerGroupMember.find({ ...members, cursor }), { items: [member], cursor: null });
  assert.deepEqual(await admin.eshop.customerGroupMember.get({ store_id: store, id: memberId }), member);
  assert.deepEqual(await admin.eshop.customerGroupMember.add({ store_id: store, id: memberId, customer_group_id: groupId, customer_id: customerId }), member);
  assert.deepEqual(await admin.eshop.customerGroupMember.remove({ store_id: store, id: memberId }), member);
  assert.deepEqual((await admin.eshop.customerGroup.delete({ store_id: store, id: groupId, expected_updated_at: 1 })).status, { type: "deleting" });
  assert.ok(calls.every((call) => call.url.pathname.startsWith(`/v1/stores/${store}/`) && call.headers.get("authorization") === "Bearer arky_api_test"));
  assert.deepEqual(Object.fromEntries(calls[1].url.searchParams), { key: group.key, status: "active", limit: "20", cursor });
  assert.equal(calls[2].url.pathname, `/v1/stores/${store}/customer-groups/by-key/members`);
  assert.deepEqual(calls[3].body, { id: groupId, key: "members" });
  assert.deepEqual(Object.fromEntries(calls[5].url.searchParams), { customer_group_id: groupId, customer_id: customerId, limit: "20", cursor });
  assert.equal(calls[6].url.pathname, `/v1/stores/${store}/customer-group-members/${memberId}`);
  assert.deepEqual(calls[7].body, { id: memberId, customer_group_id: groupId, customer_id: customerId });
  assert.equal(calls[8].method, "DELETE");
  assert.equal(calls[9].url.search, "?expected_updated_at=1");
  assert.equal(calls.length, 10);
  await assert.rejects(async () => admin.eshop.customerGroupMember.add({ store_id: store, id: "member", customer_group_id: groupId, customer_id: customerId }), TypeError);
  await assert.rejects(async () => admin.eshop.customerGroup.create({ store_id: store, id: undefined, key: "members" }), TypeError);
  await assert.rejects(async () => admin.eshop.customerGroupMember.find({ ...members, store_id: undefined }), TypeError);
  assert.equal(calls.length, 10);
  for (const removed of ["lookup", "execute", "current", "join", "findCommands"]) assert.equal(removed in admin.eshop.customerGroupMember, false, removed);
  for (const removed of ["update", "usage"]) assert.equal(removed in admin.eshop.customerGroup, false, removed);
});
