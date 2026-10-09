import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin, TYPED_CUSTOMER_ACTION_KEYS } from "../dist/admin.js";
import { COMMON_CUSTOMER_ACTION_KEYS, createStorefront, initialize } from "../dist/storefront.js";
import { apiUrl, ids, publishableKey, recordFetch, visitorStorage, visitorToken } from "./helpers/arky-fixtures.mjs";

test("Admin reads the typed Customer Action timeline with only the customer filter and its continuation", async (context) => {
  const actions = [
    {
      id: "a1d5c3e7-2b94-4f60-8e1a-7c3d9b5f2a46",
      store_id: ids.store,
      customer_id: ids.customer,
      origin: { type: "storefront", customer_session_id: ids.session },
      type: { type: "custom", key: "page.view", data: { path: "/products/example" } },
      occurred_at: 1,
    },
    {
      id: "c8e2a6f4-1d37-4b95-a0c8-3e5f7d9b1c62",
      store_id: ids.store,
      customer_id: ids.customer,
      origin: { type: "system" },
      type: { type: "order_placed", order_id: ids.order },
      occurred_at: 2,
    },
  ];
  const calls = recordFetch(context, (call) => call.path.endsWith("/actions")
    ? { items: actions, cursor: null }
    : { items: [], cursor: null });
  const admin = createAdmin({ baseUrl: apiUrl, apiToken: "arky_api_actions" });
  const found = await admin.actions.find({ store_id: ids.store, customer_id: ids.customer, limit: 20 });
  await admin.customers.find({ store_id: ids.store, has_customer_action: true });
  assert.deepEqual(found, { items: actions, cursor: null });
  assert.deepEqual(found.items.map((action) => action.type.type), ["custom", "order_placed"]);
  assert.deepEqual(calls.map((call) => [call.method, call.href]), [
    ["GET", `${apiUrl}/v1/stores/${ids.store}/actions?customer_id=${ids.customer}&limit=20`],
    ["GET", `${apiUrl}/v1/stores/${ids.store}/customers?has_customer_action=true`],
  ]);
});

test("the server records commerce and support actions itself, so the storefront suggests only custom keys", () => {
  assert.deepEqual([...COMMON_CUSTOMER_ACTION_KEYS], [
    "page.view",
    "product.view",
    "booking_service.view",
    "booking_resource.view",
    "checkout.started",
    "signin",
    "signup",
    "verified.email",
    "search",
    "share",
    "wishlist.added",
  ]);
  for (const removed of ["cart.added", "cart.removed", "order.created", "service.view", "provider.view"]) {
    assert.equal(COMMON_CUSTOMER_ACTION_KEYS.includes(removed), false, removed);
  }
  assert.deepEqual([...TYPED_CUSTOMER_ACTION_KEYS], [
    "cart_item_added",
    "cart_item_removed",
    "order_placed",
    "form_submitted",
    "support_conversation_started",
    "support_conversation_escalated",
    "support_conversation_resolved",
    "customer_group_member_added",
    "customer_group_member_removed",
  ]);
  for (const key of TYPED_CUSTOMER_ACTION_KEYS) assert.equal(COMMON_CUSTOMER_ACTION_KEYS.includes(key), false, key);
});

test("initialized storefront tracks a page view with the visitor session and only the key and data", async (context) => {
  const calls = recordFetch(context, () => new Response(null, { status: 204 }));
  const store = initialize(publishableKey, { apiUrl, locale: "en", sessionStorage: visitorStorage() });
  await store.actions.pageView({ path: "/products/example" });
  await store.actions.track({ key: "search" });
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["POST", "/v1/storefront/actions/track", { key: "page.view", data: { path: "/products/example" } }],
    ["POST", "/v1/storefront/actions/track", { key: "search" }],
  ]);
  for (const call of calls) {
    assert.equal(call.headers.get("authorization"), `Bearer ${visitorToken}`);
    assert.equal(call.headers.get("x-arky-publishable-key"), publishableKey);
  }
});

test("the storefront action client forwards no store, customer or session field from the caller", async (context) => {
  const calls = recordFetch(context, () => new Response(null, { status: 204 }));
  const storefront = createStorefront(publishableKey, { apiUrl, sessionStorage: visitorStorage() });
  await storefront.actions.track({ key: "share", data: { channel: "email" }, store_id: ids.otherStore, customer_id: ids.otherCustomer });
  assert.deepEqual(calls[0].body, { key: "share", data: { channel: "email" } });
});
