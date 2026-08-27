import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";
import { initialize } from "../dist/storefront.js";

const baseUrl = "https://api.example.test";
const storeId = "store-actions-contract";
const publishableKey = `arky_pk_${"k".repeat(43)}`;
const visitorToken = `customer_visitor_${"a".repeat(64)}`;

function jsonResponse(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

test("Admin exposes Actions and sends only canonical Customer Action routes and filters", async () => {
  const admin = createAdmin({ baseUrl, storeId, market: "bih" });
  const calls = [];
  const customerAction = {
    id: "customer-action-contract",
    store_id: storeId,
    customer_id: "customer-actions-contract",
    origin: { type: "customer_session", customer_session_id: "session-original" },
    type: {
      type: "tracked",
      value: { key: "page.view", payload: { path: "/products/example" } },
    },
    occurred_at: 1,
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method });
    return jsonResponse({ items: [customerAction], cursor: null });
  };

  let found;
  try {
    found = await admin.actions.find({
      customer_id: "customer-actions-contract",
      limit: 20,
    });
    await admin.customers.find({ has_customer_action: true });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(found, { items: [customerAction], cursor: null });
  assert.equal(found.items[0].customer_id, "customer-actions-contract");
  assert.deepEqual(found.items[0].origin, {
    type: "customer_session",
    customer_session_id: "session-original",
  });
  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/stores/${storeId}/actions?customer_id=customer-actions-contract&limit=20`,
      method: "GET",
    },
    {
      url: `${baseUrl}/v1/stores/${storeId}/customers?has_customer_action=true`,
      method: "GET",
    },
  ]);
});

test("initialized storefront tracks Customer Actions", async () => {
  const calls = [];
  const sessionStorage = {
    getItem() {
      return JSON.stringify({
        version: 1,
        customer: {
          id: "customer-actions-contract",
          store_id: storeId,
          status: "active",
          identities: [],
          classifications: [],
          created_at: 1,
          updated_at: 1,
        },
        session: {
          id: "session-actions-contract",
          customer_id: "customer-actions-contract",
          status: "active",
          type: "visitor",
          token: visitorToken,
          expires_at: 10_000,
        },
      });
    },
    setItem() {},
    removeItem() {},
  };
  const storefront = initialize(publishableKey, {
    apiUrl: baseUrl,
    sessionStorage,
  });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method,
      body: JSON.parse(String(init.body)),
    });
    return new Response(null, { status: 204 });
  };

  try {
    await storefront.actions.pageView({ path: "/products/example" });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/storefront/actions/track`,
      method: "POST",
      body: {
        key: "page.view",
        payload: { path: "/products/example" },
      },
    },
  ]);
});
