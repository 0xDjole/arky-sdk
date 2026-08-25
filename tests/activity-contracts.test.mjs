import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";
import { initialize } from "../dist/storefront.js";

const baseUrl = "https://api.example.test";
const storeId = "store-activity-contract";
const publishableKey = `arky_pk_${"k".repeat(43)}`;
const visitorToken = `customer_visitor_${"a".repeat(64)}`;

function jsonResponse(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

test("Admin exposes CRM Activities and sends only canonical Activity routes and filters", async () => {
  const admin = createAdmin({ baseUrl, storeId, market: "bih" });
  const calls = [];
  const activity = {
    id: "activity-contract",
    store_id: storeId,
    customer_id: "customer-activity-contract",
    customer_session_id: "session-original",
    key: "page.view",
    type: "tracked",
    preview_text: "Viewed product",
    occurred_at: 1,
    created_at: 1,
    data: {
      type: "tracked",
      value: { key: "page.view", payload: { path: "/products/example" } },
    },
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method });
    return jsonResponse({ items: [activity], cursor: null });
  };

  let timeline;
  let found;
  try {
    timeline = await admin.crm.activity.timeline({
      customer_id: "customer-activity-contract",
      limit: 10,
    });
    found = await admin.crm.activity.find({
      customer_id: "customer-activity-contract",
      limit: 20,
    });
    await admin.customers.find({ has_activity: true });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal("action" in admin.crm, false);
  assert.deepEqual(timeline, { items: [activity], cursor: null });
  assert.deepEqual(found, { items: [activity], cursor: null });
  assert.equal(timeline.items[0].customer_id, "customer-activity-contract");
  assert.equal(timeline.items[0].customer_session_id, "session-original");
  assert.equal("updated_at" in timeline.items[0], false);
  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/stores/${storeId}/customers/customer-activity-contract/activities?customer_id=customer-activity-contract&limit=10`,
      method: "GET",
    },
    {
      url: `${baseUrl}/v1/stores/${storeId}/activities?customer_id=customer-activity-contract&limit=20`,
      method: "GET",
    },
    {
      url: `${baseUrl}/v1/stores/${storeId}/customers?has_activity=true`,
      method: "GET",
    },
  ]);
});

test("initialized storefront tracks Activities without retaining an Action alias", async () => {
  const calls = [];
  const sessionStorage = {
    getItem() {
      return JSON.stringify({
        version: 1,
        customer: {
          id: "customer-activity-contract",
          status: "active",
          identities: [],
          classifications: [],
          created_at: 1,
          updated_at: 1,
        },
        session: {
          id: "session-activity-contract",
          customer_id: "customer-activity-contract",
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
    await storefront.activity.pageView({ path: "/products/example" });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal("action" in storefront, false);
  assert.equal("action" in storefront.client, false);
  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/storefront/activities/track`,
      method: "POST",
      body: {
        key: "page.view",
        payload: { path: "/products/example" },
      },
    },
  ]);
});
