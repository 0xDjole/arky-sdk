import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

const store = "56c82765-4f5a-47e9-bd6d-dba7c6354919";
const memberId = "d397ff50-690b-4da7-9fb9-17740e535d69";
const revisionId = "5b1e9d37-2c84-4a06-b3f9-7d2e0c4a8f61";
const locationId = "8c68fc2e-57b6-44fc-8f9c-6cbd1c76dbcf";
const groupId = "cf8a15f4-1489-40a1-a850-a98b7e311699";
const offeringId = "a3d5f7b9-2c4e-4a6b-8d0f-1e3a5c7e9b2d";

test("member transport keeps combined filters, empty pages and explicit history identity", async (context) => {
  const cursor = "opaque:/+==next";
  const member = { id: memberId, status: { type: "blocked", cause: { type: "period_missed" }, blocked_at: 1 } };
  const current = { customer_group_member: member, revision: { id: revisionId }, terms: {}, head_revision_id: revisionId };
  const detail = { revision: { id: revisionId }, terms: {} };
  const replies = [{ items: [], cursor }, { items: [{ id: memberId }], cursor: null }, { items: [], cursor }, current, { items: [], cursor: null }, detail, { items: [], cursor: null }];
  const calls = [];
  context.mock.method(globalThis, "fetch", async (input, init = {}) => {
    calls.push({ url: new URL(input), method: init.method ?? "GET", body: init.body ? JSON.parse(init.body) : null });
    return new Response(JSON.stringify(replies.shift()), { status: 200, headers: { "content-type": "application/json" } });
  });
  const api = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop;
  const members = { store_id: store, company_location_id: locationId, customer_group_id: groupId, customer_group_offering_id: offeringId, status: "paused", limit: 20 };
  assert.deepEqual(await api.customerGroupMember.find(members), { items: [], cursor });
  assert.equal(calls.length, 1);
  await api.customerGroupMember.find({ ...members, cursor });
  assert.deepEqual(await api.customerGroupMember.findOrders({ store_id: store, id: memberId, cursor, limit: 20 }), { items: [], cursor });
  assert.deepEqual(await api.customerGroupMember.current({ store_id: store, id: memberId }), current);
  assert.deepEqual(await api.customerGroupMember.revisions({ store_id: store, id: memberId, limit: 5 }), { items: [], cursor: null });
  assert.deepEqual(await api.customerGroupMember.getRevision({ store_id: store, customer_group_member_id: memberId, revision_id: revisionId }), detail);
  assert.deepEqual(await api.customerGroupMember.purchaseLimits({ store_id: store, id: memberId, limit: 10 }), { items: [], cursor: null });
  const { store_id: _store, ...query } = members;
  const base = `/v1/stores/${store}/customer-group-members`;
  assert.equal(calls[0].url.pathname, base);
  assert.deepEqual(Object.fromEntries(calls[1].url.searchParams), { ...Object.fromEntries(Object.entries(query).map(([key, value]) => [key, String(value)])), cursor });
  assert.equal(calls[2].url.pathname, `${base}/${memberId}/orders`);
  assert.deepEqual(Object.fromEntries(calls[2].url.searchParams), { cursor, limit: "20" });
  assert.equal(calls[3].url.pathname, `${base}/${memberId}/current`);
  assert.equal(calls[4].url.pathname, `${base}/${memberId}/revisions`);
  assert.deepEqual(Object.fromEntries(calls[4].url.searchParams), { limit: "5" });
  assert.equal(calls[5].url.pathname, `${base}/${memberId}/revisions/${revisionId}`);
  assert.equal(calls[5].url.search, "");
  assert.equal(calls[6].url.pathname, `${base}/${memberId}/purchase-limits`);
  assert.deepEqual(Object.fromEntries(calls[6].url.searchParams), { limit: "10" });
  assert.equal(calls.length, 7);
  assert.ok(calls.every((call) => call.method === "GET" && call.body === null && call.url.pathname.startsWith(`/v1/stores/${store}/`)));
  for (const removed of ["customerGroupEmailConsent", "subscription"]) assert.equal(removed in api, false, removed);
});

test("member order history forwards its own cursor and exposes no retired financial owners", async (context) => {
  const requests = [];
  const page = { items: [], cursor: "next-orders" };
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    requests.push({ url: new URL(url), method: init.method ?? "GET", body: init.body });
    return new Response(JSON.stringify(page), { headers: { "content-type": "application/json" } });
  });
  const members = createAdmin({ apiToken: "test-token", baseUrl: "https://api.example.test" }).eshop.customerGroupMember;
  for (const owner of ["refunds", "disputes", "billing", "memberships"]) {
    assert.equal(owner in members, false, owner);
  }
  for (const cursors of [{}, { cursor: "orders-page" }]) {
    assert.deepEqual(await members.findOrders({ store_id: store, id: "member", limit: 25, ...cursors }), page);
  }
  assert.equal(requests.length, 2);
  for (const request of requests) {
    assert.equal(request.method, "GET");
    assert.equal(request.body, undefined);
    assert.equal(request.url.pathname, `/v1/stores/${store}/customer-group-members/member/orders`);
    assert.equal(request.url.searchParams.get("limit"), "25");
  }
  assert.equal(requests[0].url.searchParams.has("cursor"), false);
  assert.equal(requests[1].url.searchParams.get("cursor"), "orders-page");
  assert.ok(requests.every((request) => !request.url.searchParams.has("store_id") && !request.url.searchParams.has("id")));
});
