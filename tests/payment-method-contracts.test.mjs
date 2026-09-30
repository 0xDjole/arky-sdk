import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront, initialize } from "../dist/storefront.js";
import { storefrontSessionStorage } from "./helpers/storefront-session-storage.mjs";

const baseUrl = "https://api.example.test";
const publishableKey = `arky_pk_${"c".repeat(43)}`;
const token = `customer_visitor_${"d".repeat(64)}`;
const revision = 1700000000000;
const STORE_ID = "9e4c7a21-3b58-4f06-8d1a-6c2e0b9f5a37";
const requestId = (index) => `2e7b9d41-${String(index).padStart(4, "0")}-4a36-8c5f-1d9e3b7a0c62`;
const target = (surface) => (surface === "admin" ? { store_id: STORE_ID } : {});
const owners = [{ type: "customer", customer_id: "customer" },
  { type: "company", company_id: "company", company_location_id: null },
  { type: "company", company_id: "company", company_location_id: "branch" }];

function client(surface) {
  if (surface === "admin") return createAdmin({ baseUrl, apiToken: "arky_api_contract" });
  return (surface === "initialized" ? initialize : createStorefront)(publishableKey, { apiUrl: baseUrl, sessionStorage: storefrontSessionStorage(JSON.stringify({
    version: 2, customer: { id: "customer", status: { type: "active" }, identities: [], categories: [], created_at: 1, updated_at: 1 },
    session: { id: "session", customer_id: "customer", type: "visitor", token, status: { type: "active" }, expires_at: 1900000000000 },
  })) });
}

for (const surface of ["admin", "storefront", "initialized"]) {
  test(`${surface} card update keeps the same subscription, unpaid Order and request across retries`, async () => {
    const original = globalThis.fetch;
    const calls = [];
    const body = { request_id: requestId(1), request: { subscription_id: "subscription", order_id: "unpaid-order", payment_method_id: "replacement-card" } };
    const request = { ...target(surface), ...body };
    const before = structuredClone(request);
    const result = { request_id: body.request_id, accepted_at: revision, closed_payment_id: "declined-payment", payment_id: "collection", amount: { amount: 1200, currency: "usd" } };
    globalThis.fetch = async (url, init = {}) => {
      calls.push({ url: new URL(url), method: init.method, headers: new Headers(init.headers), body: JSON.parse(init.body) });
      return Response.json(result);
    };
    try {
      const api = client(surface).eshop.subscription;
      assert.deepEqual(await api.updateCard(request), result);
      assert.deepEqual(await api.updateCard(request), result);
      assert.deepEqual(request, before);
      assert.equal(calls.length, 2);
      await assert.rejects(async () => api.updateCard({ ...request, request_id: "replace-card" }), TypeError);
      assert.equal(calls.length, 2);
      const path = surface === "admin" ? `/v1/stores/${STORE_ID}/subscriptions/card` : "/v1/storefront/subscriptions/card";
      for (const call of calls) {
        assert.equal(call.url.pathname, path);
        assert.equal(call.method, "POST");
        assert.deepEqual(call.body, body);
        if (surface !== "admin") {
          assert.equal(call.headers.get("authorization"), `Bearer ${token}`);
          assert.equal(call.headers.get("x-arky-publishable-key"), publishableKey);
        }
      }
    } finally { globalThis.fetch = original; }
  });

  test(`${surface} saved-method setup retains Customer or Company ownership and explicit consent on replay`, async () => {
    const original = globalThis.fetch;
    const calls = [];
    globalThis.fetch = async (url, init = {}) => {
      const body = JSON.parse(init.body);
      calls.push({ url: new URL(url), method: init.method, headers: new Headers(init.headers), body });
      return Response.json({ id: body.request.method_id, owner: body.request.owner, state: { type: "setup_requested" }, provider: null, details: null });
    };
    try {
      const api = client(surface).eshop.paymentMethod;
      for (const [index, owner] of owners.entries()) {
        const body = { request_id: requestId(10 + index), accept_storage_and_off_session_use: true,
          request: { method_id: `method-${index}`, owner, payment_option_id: "card-option", return_url: "https://merchant.example.test/cards", terms_version: "cards-2026-09" } };
        const request = { ...target(surface), ...body };
        const before = structuredClone(request);
        const result = await api.requestSetup(request);
        assert.deepEqual(await api.requestSetup(request), result);
        assert.deepEqual(result.owner, owner);
        assert.equal(result.provider, null);
        assert.deepEqual(request, before);
        assert.deepEqual(calls.at(-1).body, body);
        assert.deepEqual(calls.at(-1).body, calls.at(-2).body);
        await assert.rejects(async () => api.requestSetup({ ...request, request_id: `request-${index}` }), TypeError);
      }
      const path = surface === "admin" ? `/v1/stores/${STORE_ID}/payment-methods/setup` : "/v1/storefront/payment-methods/setup";
      assert.equal(calls.length, owners.length * 2);
      assert.ok(calls.every(({ url, method }) => method === "POST" && url.pathname === path && !url.search));
      if (surface !== "admin") {
        assert.ok(calls.every(({ headers }) => headers.get("authorization") === `Bearer ${token}` && headers.get("x-arky-publishable-key") === publishableKey));
      }
    } finally { globalThis.fetch = original; }
  });

  test(`${surface} method discovery and commands keep exact owners, identities and revisions`, async () => {
    const original = globalThis.fetch;
    const calls = [];
    const method = { id: "method/id", owner: owners[2], provider: "monri", state: { type: "ready" },
      details: { type: "card", brand: "visa", last4: "4242", exp_month: 12, exp_year: 2030 } };
    globalThis.fetch = async (url, init = {}) => {
      const path = new URL(url);
      calls.push({ url: path, method: init.method, body: init.body ? JSON.parse(init.body) : null });
      if (path.pathname.endsWith("/payment-methods")) return Response.json({ items: [], cursor: "next:/+=" });
      if (path.pathname.endsWith("/setup/start")) return Response.json({ method, setup_intent_id: null, client_secret: null, account_id: null, publishable_key: null });
      if (path.pathname.endsWith("/revoke")) return Response.json({ request_id: requestId(20), accepted_at: revision, method });
      return Response.json(method);
    };
    try {
      const api = client(surface).eshop.paymentMethod;
      const query = { company_id: "company", company_location_id: "branch", limit: 10, cursor: "" };
      assert.deepEqual(await api.find({ ...target(surface), ...query }), { items: [], cursor: "next:/+=" });
      assert.equal(calls.length, 1);
      assert.deepEqual(await api.get({ ...target(surface), id: method.id }), method);
      const started = await api.startSetup({ ...target(surface), id: method.id });
      assert.equal(started.client_secret, null);
      assert.equal(started.account_id, null);
      assert.deepEqual(await api.completeSetup({ ...target(surface), id: method.id }), method);
      const request = { ...target(surface), id: method.id, request_id: requestId(20), expected_updated_at: revision, reason: "Card replaced" };
      const before = structuredClone(request);
      await api.revoke(request);
      await api.revoke(request);
      assert.deepEqual(request, before);
      assert.deepEqual(calls.at(-1), calls.at(-2));
      const base = surface === "admin" ? `/v1/stores/${STORE_ID}/payment-methods` : "/v1/storefront/payment-methods";
      assert.deepEqual(calls.map(({ url, method }) => [method, url.pathname]), [
        ["GET", base], ["GET", `${base}/method%2Fid`], ["POST", `${base}/method%2Fid/setup/start`],
        ["POST", `${base}/method%2Fid/setup/complete`], ["POST", `${base}/method%2Fid/revoke`], ["POST", `${base}/method%2Fid/revoke`],
      ]);
      assert.deepEqual(Object.fromEntries(calls[0].url.searchParams), { company_id: "company", company_location_id: "branch", limit: "10", cursor: "" });
      assert.equal(calls[2].body, null);
      assert.equal(calls[3].body, null);
      assert.deepEqual(calls[4].body, { request_id: requestId(20), expected_updated_at: revision, reason: "Card replaced" });
      await assert.rejects(async () => api.revoke({ ...request, request_id: "revoke-card" }), TypeError);
      assert.equal(calls.length, 6);
    } finally { globalThis.fetch = original; }
  });
}


for (const surface of ["storefront", "initialized"]) {
  test(`${surface} subscription self-service keeps customer authentication and exact cancellation replay`, async () => {
    const original = globalThis.fetch;
    const calls = [];
    const subscription = { id: "subscription/id", status: { type: "active" }, updated_at: revision };
    const request = { request_id: requestId(30), request: { subscription_id: subscription.id, expected_updated_at: revision, type: { type: "cancel", reason: "No more milk deliveries" } } };
    const before = structuredClone(request);
    const result = { request_id: request.request_id, accepted_at: revision, subscription: { ...subscription, status: { type: "cancelled", ended_at: revision } } };
    globalThis.fetch = async (url, init = {}) => {
      calls.push({ url: new URL(url), method: init.method, headers: new Headers(init.headers), body: init.body ? JSON.parse(init.body) : null });
      return Response.json(init.method === "POST" ? result : subscription);
    };
    try {
      const api = client(surface).eshop.subscription;
      assert.deepEqual(await api.current({ id: subscription.id }), subscription);
      assert.deepEqual(await api.control(request), result);
      assert.deepEqual(await api.control(request), result);
      assert.deepEqual(request, before);
      assert.deepEqual(calls.map(({ url, method }) => [method, url.pathname]), [
        ["GET", "/v1/storefront/subscriptions/subscription%2Fid"],
        ["POST", "/v1/storefront/subscriptions/commands"],
        ["POST", "/v1/storefront/subscriptions/commands"],
      ]);
      assert.deepEqual(calls[1].body, before);
      assert.deepEqual(calls[2].body, before);
      await assert.rejects(api.control({ ...request, request_id: "cancel-request" }), TypeError);
      assert.equal(calls.length, 3);
      assert.ok(calls.every(({ headers }) => headers.get("authorization") === `Bearer ${token}` && headers.get("x-arky-publishable-key") === publishableKey));
    } finally { globalThis.fetch = original; }
  });
}
