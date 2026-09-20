import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

test("Campaign conversation preserves empty pages, scoped cursors and backend message order without hidden reads", async () => {
  const previous = globalThis.fetch;
  const calls = [];
  const cursor = "position:/+==";
  const enrollment = { id: "enrollment", store_id: "chosen", campaign_id: "campaign" };
  const messages = [
    { message: { id: "first", position: 2, created_at: 2000 }, email_status: null },
    { message: { id: "second", position: 3, created_at: 1000 }, email_status: null },
  ];
  globalThis.fetch = async (input, init = {}) => {
    calls.push({ url: new URL(input), method: init.method ?? "GET" });
    return new Response(JSON.stringify({ enrollment, messages: calls.length === 1 ? { items: [], cursor } : { items: messages, cursor: null } }), {
      status: 200, headers: { "content-type": "application/json" },
    });
  };
  try {
    const api = createAdmin({ storeId: "default", market: "configured", baseUrl: "https://api.example.test", apiToken: "arky_api_test" });
    const scope = { store_id: "chosen", campaign_id: "campaign", id: "enrollment", limit: 20 };
    assert.deepEqual(await api.campaignEnrollment.getConversation(scope), { enrollment, messages: { items: [], cursor } });
    assert.equal(calls.length, 1);
    assert.deepEqual(await api.campaignEnrollment.getConversation({ ...scope, cursor }), { enrollment, messages: { items: messages, cursor: null } });
    assert.equal(calls.length, 2);
    assert.deepEqual(Object.fromEntries(calls[1].url.searchParams), { limit: "20", cursor });
    assert.ok(calls.every(({ url, method }) => url.pathname === "/v1/stores/chosen/campaigns/campaign/enrollments/enrollment/conversation" && method === "GET"));
  } finally { globalThis.fetch = previous; }
});

test("Campaign discovery sends native name/status/order predicates and preserves an empty continuation", async () => {
  const previous = globalThis.fetch;
  const calls = [];
  const cursor = "campaign:/+==";
  globalThis.fetch = async (input, init = {}) => {
    calls.push({ url: new URL(input), method: init.method ?? "GET" });
    return new Response(JSON.stringify({ items: [], cursor: calls.length === 1 ? cursor : null }), {
      status: 200, headers: { "content-type": "application/json" },
    });
  };
  try {
    const api = createAdmin({ storeId: "default", market: "configured", baseUrl: "https://api.example.test", apiToken: "arky_api_test" });
    const scope = { store_id: "chosen", query: "Život", status: "paused", sort_field: "updated_at", sort_direction: "asc", limit: 20 };
    assert.deepEqual(await api.campaign.find(scope), { items: [], cursor });
    assert.equal(calls.length, 1);
    assert.deepEqual(await api.campaign.find({ ...scope, cursor }), { items: [], cursor: null });
    assert.deepEqual(Object.fromEntries(calls[1].url.searchParams), {
      query: "Život", status: "paused", sort_field: "updated_at", sort_direction: "asc", limit: "20", cursor,
    });
    assert.ok(calls.every(({ url, method }) => url.pathname === "/v1/stores/chosen/campaigns" && method === "GET"));
  } finally { globalThis.fetch = previous; }
});

test("Campaign enrollment discovery preserves combined filters and continuations without enumerating Campaigns", async () => {
  const previous = globalThis.fetch;
  const calls = [];
  const cursor = "native:/+==";
  const root = { id: "enrollment", status: { type: "stopped", reason: { type: "email_suppression" }, stopped_at: 1000 } };
  const replies = [{ items: [], cursor }, { items: [root], cursor: null }, { items: [], cursor: null }];
  globalThis.fetch = async (input, init = {}) => {
    calls.push({ url: new URL(input), method: init.method ?? "GET" });
    return new Response(JSON.stringify(replies.shift()), { status: 200, headers: { "content-type": "application/json" } });
  };
  try {
    const api = createAdmin({ storeId: "default", market: "configured", baseUrl: "https://api.example.test", apiToken: "arky_api_test" });
    const scope = { store_id: "chosen", customer_id: "customer", status: "stopped", limit: 20 };
    assert.deepEqual(await api.campaign.findEnrollments(scope), { items: [], cursor });
    assert.equal(calls.length, 1);
    assert.deepEqual(await api.campaign.findEnrollments({ ...scope, cursor }), { items: [root], cursor: null });
    await api.campaign.findEnrollments({ ...scope, campaign_id: "campaign" });
    assert.deepEqual(calls.map(({ url }) => url.pathname), [
      "/v1/stores/chosen/campaign-enrollments", "/v1/stores/chosen/campaign-enrollments", "/v1/stores/chosen/campaigns/campaign/enrollments"
    ]);
    assert.deepEqual(Object.fromEntries(calls[1].url.searchParams), { customer_id: "customer", status: "stopped", limit: "20", cursor });
    assert.deepEqual(Object.fromEntries(calls[2].url.searchParams), { customer_id: "customer", status: "stopped", limit: "20" });
    assert.ok(calls.every(({ method }) => method === "GET"));
  } finally { globalThis.fetch = previous; }
});
