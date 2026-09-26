import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront, initialize } from "../dist/storefront.js";
import { MemoryStorage } from "./helpers/durable-request-fixtures.mjs";

test("storefront Group membership uses one Visitor and preserves caller-owned command identity", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const publishableKey = `arky_pk_${"g".repeat(43)}`;
  const token = `customer_visitor_${"b".repeat(64)}`;
  const storage = new MemoryStorage();
  const customerId = "70b5f662-f3d8-48c9-8c16-c60dd4ff1703";
  const groupId = "cf8a15f4-1489-40a1-a850-a98b7e311699";
  const command = {
    command_id: "6b9d9e19-3d13-4f30-a1a0-442a3c92f212",
    request: { customer_group_id: groupId, scope: { type: "customer" }, expected_updated_at: null },
  };
  const member = {
    id: "e245588f-0542-4bb3-97c8-23de326627d1", customer_group_id: groupId,
    member: { type: "customer", customer_id: customerId },
    admission: { type: "granted", granted_at: 2 }, created_at: 2, updated_at: 2,
  };
  const joined = { command_id: command.command_id, accepted_at: 2, member };
  const calls = [];
  let membership = null;
  globalThis.fetch = async (url, init = {}) => {
    const parsed = new URL(url);
    const headers = new Headers(init.headers);
    const call = { path: parsed.pathname, query: Object.fromEntries(parsed.searchParams), method: init.method ?? "GET", body: init.body ? JSON.parse(init.body) : null };
    calls.push(call);
    assert.equal(headers.get("X-Arky-Publishable-Key"), publishableKey);
    assert.equal(headers.has("X-Arky-Market"), false);
    let response;
    if (call.path === "/v1/storefront/customer/identify") {
      assert.equal(headers.has("Authorization"), false);
      response = {
        customer: { id: customerId, status: { type: "active" }, primary_email_identity_id: null, default_shipping_address_id: null, default_billing_address_id: null, classifications: [], created_at: 1, updated_at: 1 },
        session: { id: "group-session", customer_id: customerId, type: "visitor", status: { type: "active" }, token, expires_at: Date.now() + 60_000 },
      };
    } else {
      assert.equal(headers.get("Authorization"), `Bearer ${token}`);
      if (call.path === "/v1/storefront/customer-group-members/current") {
        response = membership;
      } else {
        assert.equal(call.path, "/v1/storefront/customer-group-members/join");
        assert.deepEqual(call.body, command);
        membership = member;
        response = joined;
      }
    }
    return new Response(JSON.stringify(response), { status: 200, headers: { "content-type": "application/json" } });
  };
  const options = { apiUrl: "https://api.example.test", sessionStorage: storage };
  const client = createStorefront(publishableKey, options);
  assert.equal(await client.customer_group_members.current({ customer_group_id: groupId }), null);
  assert.deepEqual(await client.customer_group_members.join(command), joined);
  assert.deepEqual(await client.customer_group_members.join(command), joined);
  const storefront = initialize(publishableKey, options);
  assert.deepEqual(await storefront.customer_group_members.current({ customer_group_id: groupId }), member);
  assert.equal(calls.filter(call => call.path.endsWith("/identify")).length, 1);
  assert.deepEqual(calls.filter(call => call.path.endsWith("/current")).map(call => call.query), [{ customer_group_id: groupId }, { customer_group_id: groupId }]);
  assert.ok(calls.filter(call => call.path.endsWith("/join")).every(call => call.method === "POST"));
  assert.equal(client.isAuthenticated, false);
  assert.equal(client.session.customer.primary_email_identity_id, null);
  let rejected = 0;
  const savedSession = [...storage.values.entries()];
  globalThis.fetch = async (url, init = {}) => {
    assert.equal(new URL(url).pathname, "/v1/storefront/customer-group-members/join");
    assert.deepEqual(JSON.parse(init.body), command);
    rejected += 1;
    return new Response(JSON.stringify({ message: "Membership changed", statusCode: 409 }), {
      status: 409, headers: { "content-type": "application/json" },
    });
  };
  await assert.rejects(storefront.customer_group_members.join(command), error => error.statusCode === 409);
  assert.equal(rejected, 1);
  assert.deepEqual([...storage.values.entries()], savedSession);
});

test("storefront Company membership keeps the explicitly selected branch", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const calls = [];
  const client = createStorefront(`arky_pk_${"h".repeat(42)}A`, { apiUrl: "https://api.example.test", sessionStorage: new MemoryStorage() });
  const command = {
    command_id: "6b9d9e19-3d13-4f30-a1a0-442a3c92f212",
    request: {
      customer_group_id: "cf8a15f4-1489-40a1-a850-a98b7e311699",
      scope: { type: "company", company_id: "company", company_location_id: "branch" },
      expected_updated_at: null,
    },
  };
  const joined = {
    command_id: command.command_id, accepted_at: 2,
    member: {
      id: "company-member", customer_group_id: command.request.customer_group_id,
      member: { type: "company", company_id: "company" },
      admission: { type: "granted", granted_at: 2 }, created_at: 2, updated_at: 2,
    },
  };
  globalThis.fetch = async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push({ path: parsed.pathname, query: Object.fromEntries(parsed.searchParams), body: init.body ? JSON.parse(init.body) : null });
    const response = parsed.pathname.endsWith("/identify") ? {
      customer: { id: "customer", status: { type: "active" }, primary_email_identity_id: null, default_shipping_address_id: null, default_billing_address_id: null, classifications: [], created_at: 1, updated_at: 1 },
      session: { id: "company-session", customer_id: "customer", type: "visitor", status: { type: "active" }, token: `customer_visitor_${"c".repeat(64)}`, expires_at: Date.now() + 60_000 },
    } : parsed.pathname.endsWith("/join") ? joined : null;
    return new Response(JSON.stringify(response), { status: 200, headers: { "content-type": "application/json" } });
  };
  await client.customer_group_members.current({ customer_group_id: command.request.customer_group_id, company_id: "company", company_location_id: "branch" });
  assert.deepEqual(await client.customer_group_members.join(command), joined);
  assert.equal(calls.length, 3);
  assert.deepEqual(calls[1].query, { customer_group_id: command.request.customer_group_id, company_id: "company", company_location_id: "branch" });
  assert.deepEqual(calls[2].body, command);
});

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
    assert.deepEqual(await admin.eshop.customerGroupMember.lookup({ store_id: store, customer_group_id: groupId, customer_id: customerId }), member);
    assert.deepEqual(await admin.eshop.customerGroupMember.execute(command), accepted);
    assert.deepEqual(await admin.eshop.customerGroupMember.current({ store_id: store, customer_group_id: groupId }), self);
    assert.deepEqual(await admin.eshop.customerGroupMember.join({ store_id: store, command_id: command.command_id, request: { customer_group_id: groupId, scope: { type: "customer" }, expected_updated_at: null } }), joined);
    assert.ok(calls.every(call => call.url.pathname.startsWith(`/v1/stores/${store}/`) && call.headers.get("authorization") === "Bearer arky_api_test"));
    assert.deepEqual(Object.fromEntries(calls[1].url.searchParams), { key: group.key, status: "active", limit: "20", cursor });
    assert.deepEqual(Object.fromEntries(calls[4].url.searchParams), { customer_group_id: groupId, customer_id: customerId, admission: "requested", limit: "20", cursor });
    assert.equal(calls[2].url.pathname, `/v1/stores/${store}/customer-groups/by-key/members`);
    assert.equal(calls[5].url.pathname, `/v1/stores/${store}/customer-group-members/lookup`);
    assert.deepEqual(Object.fromEntries(calls[5].url.searchParams), { customer_group_id: groupId, customer_id: customerId });
    assert.equal(calls[6].method, "POST");
    assert.deepEqual(calls[6].body, { command_id: command.command_id, command: command.command });
    assert.equal(calls[8].body.request.expected_updated_at, null);
    assert.equal(calls.length, 9);
  } finally { globalThis.fetch = originalFetch; }
});
