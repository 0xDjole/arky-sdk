import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

test("group and member transport preserves combined predicates, empty continuations and exact bindings", async () => {
  const originalFetch = globalThis.fetch;
  const store = "56c82765-4f5a-47e9-bd6d-dba7c6354919";
  const groupId = "cf8a15f4-1489-40a1-a850-a98b7e311699";
  const memberId = "e245588f-0542-4bb3-97c8-23de326627d1";
  const customerId = "70b5f662-f3d8-48c9-8c16-c60dd4ff1703";
  const cursor = "opaque:/+==next";
  const group = { id: groupId, store_id: store, key: "members", status: { type: "active" } };
  const member = { id: memberId, store_id: store, customer_group_id: groupId, member: { type: "customer", customer_id: customerId }, admission: { type: "requested" }, administrative_access: null, created_at: 1, updated_at: 1 };
  const command = { store_id: store, command_id: "6b9d9e19-3d13-4f30-a1a0-442a3c92f212", command: { type: "revoke_admission", customer_group_member_id: memberId, expected_updated_at: 1, reason: "Operator request" } };
  const accepted = { receipt: { id: command.command_id, store_id: store, accepted_at: 2 }, member: { ...member, admission: { type: "revoked", revoked_at: 2 }, updated_at: 2 } };
  const self = { id: memberId, store_id: store, customer_group_id: groupId, member: member.member, admission: { type: "granted", granted_at: 2 }, created_at: 1, updated_at: 2 };
  const joined = { command_id: command.command_id, accepted_at: 2, member: self };
  const replies = [{ items: [], cursor }, { items: [group], cursor: null }, group, { items: [], cursor }, { items: [member], cursor: null }, member, accepted, self, joined];
  const calls = [];
  globalThis.fetch = async (input, init = {}) => {
    calls.push({ url: new URL(input), method: init.method ?? "GET", headers: new Headers(init.headers), body: init.body ? JSON.parse(init.body) : null });
    return new Response(JSON.stringify(replies.shift()), { status: 200, headers: { "content-type": "application/json" } });
  };
  try {
    const admin = createAdmin({ storeId: "wrong-default", market: "configured-market", baseUrl: "https://api.example.test", apiToken: "arky_api_test" });
    const filter = { store_id: store, key: group.key, status: "active", limit: 20 };
    const page = await admin.eshop.customerGroup.find(filter);
    assert.deepEqual(page, { items: [], cursor });
    assert.equal(calls.length, 1);
    assert.deepEqual(await admin.eshop.customerGroup.find({ ...filter, cursor: page.cursor }), { items: [group], cursor: null });
    assert.deepEqual(await admin.eshop.customerGroup.getByKey({ store_id: store, key: group.key }), group);
    const members = { store_id: store, customer_group_id: groupId, customer_id: customerId, admission: "requested", limit: 20 };
    assert.deepEqual(await admin.eshop.customerGroupMember.find(members), { items: [], cursor });
    assert.deepEqual(await admin.eshop.customerGroupMember.find({ ...members, cursor }), { items: [member], cursor: null });
    assert.deepEqual(await admin.eshop.customerGroupMember.getByBinding({ store_id: store, customer_group_id: groupId, customer_id: customerId }), member);
    assert.deepEqual(await admin.eshop.customerGroupMember.execute(command), accepted);
    assert.deepEqual(await admin.eshop.customerGroupMember.current({ store_id: store, customer_group_id: groupId }), self);
    assert.deepEqual(await admin.eshop.customerGroupMember.join({ store_id: store, command_id: command.command_id, request: { customer_group_id: groupId, scope: { type: "customer" }, expected_updated_at: null } }), joined);
    assert.ok(calls.every(call => call.url.pathname.startsWith(`/v1/stores/${store}/`) && call.headers.get("authorization") === "Bearer arky_api_test"));
    assert.deepEqual(Object.fromEntries(calls[1].url.searchParams), { key: group.key, status: "active", limit: "20", cursor });
    assert.deepEqual(Object.fromEntries(calls[4].url.searchParams), { customer_group_id: groupId, customer_id: customerId, admission: "requested", limit: "20", cursor });
    assert.equal(calls[2].url.pathname, `/v1/stores/${store}/customer-groups/by-key/members`);
    assert.equal(calls[5].url.pathname, `/v1/stores/${store}/customer-group-members/by-binding`);
    assert.deepEqual(Object.fromEntries(calls[5].url.searchParams), { customer_group_id: groupId, customer_id: customerId });
    assert.equal(calls[6].method, "POST");
    assert.deepEqual(calls[6].body, { command_id: command.command_id, command: command.command });
    assert.equal(calls[8].body.request.expected_updated_at, null);
    assert.equal(calls.length, 9);
  } finally { globalThis.fetch = originalFetch; }
});
