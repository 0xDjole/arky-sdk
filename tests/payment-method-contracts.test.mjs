import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront, initialize } from "../dist/storefront.js";
import { storefrontSessionStorage } from "./helpers/storefront-session-storage.mjs";

const baseUrl = "https://api.example.test";
const publishableKey = `arky_pk_${"c".repeat(43)}`;
const token = `customer_visitor_${"d".repeat(64)}`;
const revision = 1700000000000;
const owners = [{ type: "customer", customer_id: "customer" },
  { type: "company", company_id: "company", company_location_id: null },
  { type: "company", company_id: "company", company_location_id: "branch" }];

function client(surface) {
  if (surface === "admin") return createAdmin({ storeId: "selected/store", baseUrl, apiToken: "arky_api_contract" });
  return (surface === "initialized" ? initialize : createStorefront)(publishableKey, { apiUrl: baseUrl, sessionStorage: storefrontSessionStorage(JSON.stringify({
    version: 2, customer: { id: "customer", status: { type: "active" }, identities: [], classifications: [], created_at: 1, updated_at: 1 },
    session: { id: "session", customer_id: "customer", type: "visitor", token, status: { type: "active" }, expires_at: 1900000000000 },
  })) });
}

for (const surface of ["admin", "storefront", "initialized"]) {
  test(`${surface} card update keeps the same subscription, unpaid Order and command across retries`, async () => {
    const original = globalThis.fetch;
    const calls = [];
    const request = { command_id: "replace-card", request: { subscription_id: "subscription", order_id: "unpaid-order", payment_method_id: "replacement-card" } };
    const before = structuredClone(request);
    const result = { command_id: request.command_id, accepted_at: revision, closed_payment_id: "declined-payment", payment_id: "collection", amount: { amount: 1200, currency: "usd" } };
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
      const path = surface === "admin" ? "/v1/stores/selected%2Fstore/subscriptions/card" : "/v1/storefront/subscriptions/card";
      for (const call of calls) {
        assert.equal(call.url.pathname, path);
        assert.equal(call.method, "POST");
        assert.deepEqual(call.body, request);
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
        const request = { request_id: `request-${index}`, accept_storage_and_off_session_use: true,
          request: { method_id: `method-${index}`, owner, payment_option_id: "card-option", return_url: "https://merchant.example.test/cards", terms_version: "cards-2026-09" } };
        const before = structuredClone(request);
        const result = await api.requestSetup(request);
        assert.deepEqual(await api.requestSetup(request), result);
        assert.deepEqual(result.owner, owner);
        assert.equal(result.provider, null);
        assert.deepEqual(request, before);
        assert.deepEqual(calls.at(-1).body, request);
        assert.deepEqual(calls.at(-1).body, calls.at(-2).body);
      }
      const path = surface === "admin" ? "/v1/stores/selected%2Fstore/payment-methods/setup" : "/v1/storefront/payment-methods/setup";
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
      if (path.pathname.endsWith("/setup/start")) return Response.json({ method, setup_intent_id: null, client_secret: null, connected_account_id: null, publishable_key: null });
      if (path.pathname.endsWith("/revoke")) return Response.json({ command_id: "revoke-card", accepted_at: revision, method });
      return Response.json(method);
    };
    try {
      const api = client(surface).eshop.paymentMethod;
      const query = { company_id: "company", company_location_id: "branch", limit: 10, cursor: "" };
      assert.deepEqual(await api.find(query), { items: [], cursor: "next:/+=" });
      assert.equal(calls.length, 1);
      assert.deepEqual(await api.get({ id: method.id }), method);
      assert.equal((await api.startSetup({ id: method.id })).client_secret, null);
      assert.deepEqual(await api.completeSetup({ id: method.id }), method);
      const request = { id: method.id, command_id: "revoke-card", expected_updated_at: revision, reason: "Card replaced" };
      const before = structuredClone(request);
      await api.revoke(request);
      await api.revoke(request);
      assert.deepEqual(request, before);
      assert.deepEqual(calls.at(-1), calls.at(-2));
      const base = surface === "admin" ? "/v1/stores/selected%2Fstore/payment-methods" : "/v1/storefront/payment-methods";
      assert.deepEqual(calls.map(({ url, method }) => [method, url.pathname]), [
        ["GET", base], ["GET", `${base}/method%2Fid`], ["POST", `${base}/method%2Fid/setup/start`],
        ["POST", `${base}/method%2Fid/setup/complete`], ["POST", `${base}/method%2Fid/revoke`], ["POST", `${base}/method%2Fid/revoke`],
      ]);
      assert.deepEqual(Object.fromEntries(calls[0].url.searchParams), { company_id: "company", company_location_id: "branch", limit: "10", cursor: "" });
      assert.deepEqual(calls[2].body, {});
      assert.deepEqual(calls[3].body, {});
      assert.deepEqual(calls[4].body, { command_id: "revoke-card", expected_updated_at: revision, reason: "Card replaced" });
    } finally { globalThis.fetch = original; }
  });
}
