import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

const tenant = "56c82765-4f5a-47e9-bd6d-dba7c6354919";
const memberId = "d397ff50-690b-4da7-9fb9-17740e535d69";
const revisionId = "5b1e9d37-2c84-4a06-b3f9-7d2e0c4a8f61";
const locationId = "8c68fc2e-57b6-44fc-8f9c-6cbd1c76dbcf";
const memberPackageId = "cf8a15f4-1489-40a1-a850-a98b7e311699";
const offeringId = "a3d5f7b9-2c4e-4a6b-8d0f-1e3a5c7e9b2d";

test("member transport keeps combined filters, empty pages and explicit history identity", async (context) => {
  const cursor = "opaque:/+==next";
  const member = { id: memberId, status: { type: "blocked", cause: { type: "period_missed" }, blocked_at: 1 } };
  const current = { package_member: member, revision: { id: revisionId }, terms: {}, head_revision_id: revisionId };
  const detail = { revision: { id: revisionId }, terms: {} };
  const replies = [{ items: [], cursor }, { items: [{ id: memberId }], cursor: null }, { items: [], cursor }, current, { items: [], cursor: null }, detail, { items: [], cursor }];
  const calls = [];
  context.mock.method(globalThis, "fetch", async (input, init = {}) => {
    calls.push({ url: new URL(input), method: init.method ?? "GET", body: init.body ? JSON.parse(init.body) : null });
    return new Response(JSON.stringify(replies.shift()), { status: 200, headers: { "content-type": "application/json" } });
  });
  const api = createAdmin({ apiUrl: "https://api.example.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" }).eshop;
  const members = { tenant_id: tenant, company_location_id: locationId, package_id: memberPackageId, package_offering_id: offeringId, status: "paused", limit: 20 };
  assert.deepEqual(await api.packageMember.find(members), { items: [], cursor });
  assert.equal(calls.length, 1);
  await api.packageMember.find({ ...members, cursor });
  assert.deepEqual(await api.packageMember.findOrders({ tenant_id: tenant, id: memberId, cursor, limit: 20 }), { items: [], cursor });
  assert.deepEqual(await api.packageMember.getCurrent({ tenant_id: tenant, id: memberId }), current);
  assert.deepEqual(await api.packageMember.findRevisions({ tenant_id: tenant, id: memberId, limit: 5 }), { items: [], cursor: null });
  assert.deepEqual(await api.packageMember.getRevision({ tenant_id: tenant, package_member_id: memberId, revision_id: revisionId }), detail);
  assert.deepEqual(await api.packageMember.findRevisionPurchaseOrders({ tenant_id: tenant, package_member_id: memberId, revision_id: revisionId, limit: 2, cursor }), { items: [], cursor });
  const { tenant_id: _tenant, ...query } = members;
  const base = `/v1/tenants/${tenant}/package-members`;
  assert.equal(calls[0].url.pathname, base);
  assert.deepEqual(Object.fromEntries(calls[1].url.searchParams), { ...Object.fromEntries(Object.entries(query).map(([key, value]) => [key, String(value)])), cursor });
  assert.equal(calls[2].url.pathname, `${base}/${memberId}/orders`);
  assert.deepEqual(Object.fromEntries(calls[2].url.searchParams), { cursor, limit: "20" });
  assert.equal(calls[3].url.pathname, `${base}/${memberId}/current`);
  assert.equal(calls[4].url.pathname, `${base}/${memberId}/revisions`);
  assert.deepEqual(Object.fromEntries(calls[4].url.searchParams), { limit: "5" });
  assert.equal(calls[5].url.pathname, `${base}/${memberId}/revisions/${revisionId}`);
  assert.equal(calls[5].url.search, "");
  assert.equal(calls[6].url.pathname, `${base}/${memberId}/revisions/${revisionId}/purchase-orders`);
  assert.deepEqual(Object.fromEntries(calls[6].url.searchParams), { limit: "2", cursor });
  assert.equal(calls.length, 7);
  assert.ok(calls.every((call) => call.method === "GET" && call.body === null && call.url.pathname.startsWith(`/v1/tenants/${tenant}/`)));
  for (const removed of ["subscription"]) assert.equal(removed in api, false, removed);
});

test("member order history forwards its own cursor and exposes no retired financial owners", async (context) => {
  const requests = [];
  const page = { items: [], cursor: "next-orders" };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    requests.push({ url: new URL(url), method: init.method ?? "GET", body: init.body });
    return new Response(JSON.stringify(page), { headers: { "content-type": "application/json" } });
  });
  const members = createAdmin({ accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA", apiUrl: "https://api.example.test" }).eshop.packageMember;
  for (const owner of ["refunds", "disputes", "billing", "memberships"]) {
    assert.equal(owner in members, false, owner);
  }
  for (const cursors of [{}, { cursor: "orders-page" }]) {
    assert.deepEqual(await members.findOrders({ tenant_id: tenant, id: "member", limit: 25, ...cursors }), page);
  }
  assert.equal(requests.length, 2);
  for (const request of requests) {
    assert.equal(request.method, "GET");
    assert.equal(request.body, undefined);
    assert.equal(request.url.pathname, `/v1/tenants/${tenant}/package-members/member/orders`);
    assert.equal(request.url.searchParams.get("limit"), "25");
  }
  assert.equal(requests[0].url.searchParams.has("cursor"), false);
  assert.equal(requests[1].url.searchParams.get("cursor"), "orders-page");
  assert.ok(requests.every((request) => !request.url.searchParams.has("tenant_id") && !request.url.searchParams.has("id")));
});
