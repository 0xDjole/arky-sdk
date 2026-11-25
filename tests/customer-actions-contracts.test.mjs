import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { createAdmin, TYPED_CUSTOMER_ACTION_KEYS } from "../dist/admin.js";
import { COMMON_CUSTOMER_ACTION_KEYS, createStorefront, initialize } from "../dist/storefront.js";
import { apiUrl, fixedIdFactories, ids, storefrontIdentity, recordFetch, visitorStorage, visitorToken } from "./helpers/arky-fixtures.mjs";
import { ExclusiveLockManager, MemoryStorage } from "./helpers/durable-request-fixtures.mjs";

const actionId = ids.picked;
const originals = new Map(["localStorage", "navigator"].map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));

function install(name, value) {
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
}

function browser() {
  const storage = new MemoryStorage();
  install("localStorage", storage);
  install("navigator", { locks: new ExclusiveLockManager() });
  return storage;
}

afterEach(() => {
  for (const [name, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
});

test("Admin reads the typed Customer Action timeline with only the customer filter and its continuation", async (context) => {
  const actions = [
    {
      id: "a1d5c3e7-2b94-4f60-8e1a-7c3d9b5f2a46",
      store_id: ids.store,
      customer_id: ids.customer,
      origin: { type: "storefront", customer_session_id: ids.session },
      type: { type: "custom", key: "product.view", data: { path: "/products/example" } },
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
    {
      id: "e4b7d1a9-3c52-4f86-b0d3-8a6c2e9f5b17",
      store_id: ids.store,
      customer_id: ids.customer,
      origin: { type: "system" },
      type: { type: "package_member_switched", from_package_id: ids.product, to_package_id: ids.variant },
      occurred_at: 3,
    },
  ];
  const calls = recordFetch(context, (call) => call.path.endsWith("/actions")
    ? { items: actions, cursor: null }
    : { items: [], cursor: null });
  const admin = createAdmin({ apiUrl: apiUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  const found = await admin.actions.find({ store_id: ids.store, customer_id: ids.customer, limit: 20 });
  await admin.customers.find({ store_id: ids.store, has_customer_action: true });
  assert.deepEqual(found, { items: actions, cursor: null });
  assert.deepEqual(found.items.map((action) => action.type.type), ["custom", "order_placed", "package_member_switched"]);
  assert.deepEqual(calls.map((call) => [call.method, call.href]), [
    ["GET", `${apiUrl}/v1/stores/${ids.store}/actions?customer_id=${ids.customer}&limit=20`],
    ["GET", `${apiUrl}/v1/stores/${ids.store}/customers?has_customer_action=true`],
  ]);
});

test("the server records commerce, support and package actions itself, so the storefront suggests only custom keys", () => {
  assert.deepEqual([...COMMON_CUSTOMER_ACTION_KEYS], [
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
  for (const removed of ["page.view", "cart.added", "cart.removed", "order.created", "service.view", "provider.view"]) {
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
    "package_member_activated",
    "package_member_cancelled",
    "package_member_switched",
  ]);
  for (const removed of ["package_member_added", "package_member_removed"]) {
    assert.equal(TYPED_CUSTOMER_ACTION_KEYS.includes(removed), false, removed);
  }
  for (const key of TYPED_CUSTOMER_ACTION_KEYS) assert.equal(COMMON_CUSTOMER_ACTION_KEYS.includes(key), false, key);
});

test("initialized storefront tracks an action with the visitor session and only its id, key and data, and page views are no action", async (context) => {
  browser();
  const calls = recordFetch(context, () => new Response(null, { status: 204 }));
  const store = initialize(storefrontIdentity, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, locale: "en", sessionStorage: visitorStorage() });
  assert.equal(store.actions.pageView, undefined);
  await store.actions.track({ key: "product.view", data: { path: "/products/example" } });
  await store.actions.track({ key: "search" });
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["POST", "/v1/storefront/actions/track", { id: actionId, key: "product.view", data: { path: "/products/example" } }],
    ["POST", "/v1/storefront/actions/track", { id: actionId, key: "search" }],
  ]);
  for (const call of calls) {
    assert.equal(call.headers.get("authorization"), `Bearer ${visitorToken}`);
    assert.equal(call.headers.get("x-arky-store-id"), storefrontIdentity.storeId);
    assert.equal(call.headers.get("x-arky-sales-channel-id"), storefrontIdentity.salesChannelId);
  }
});

test("the storefront action client forwards no store, customer or session field from the caller", async (context) => {
  browser();
  const calls = recordFetch(context, () => new Response(null, { status: 204 }));
  const storefront = createStorefront(storefrontIdentity, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, sessionStorage: visitorStorage() });
  await storefront.actions.track({ key: "share", data: { channel: "email" }, store_id: ids.otherStore, customer_id: ids.otherCustomer });
  assert.deepEqual(calls[0].body, { id: actionId, key: "share", data: { channel: "email" } });
});

test("a tracked action names its id and a retry sends the same id", async (context) => {
  const storage = browser();
  let picked = 0;
  const picks = ["7a1c3e5b-9d2f-4b64-8a0c-1e3f5b7d9c20", "8b2d4f6c-0e3a-4c75-9b1d-2f4a6c8e0d31"];
  let lose = true;
  const calls = recordFetch(context, () => {
    if (lose) {
      lose = false;
      throw new TypeError("network lost the answer");
    }
    return new Response(null, { status: 204 });
  });
  const store = initialize(storefrontIdentity, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => picks[picked++], createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, locale: "en", sessionStorage: visitorStorage() });
  await assert.rejects(store.actions.track({ key: "share", data: { channel: "email" } }));
  assert.equal(storage.length, 1);
  await store.actions.track({ key: "share", data: { channel: "email" } });
  assert.deepEqual(calls.map((call) => call.body.id), [picks[0], picks[0]]);
  assert.equal(picked, 1);
  assert.equal(storage.length, 0);
  await store.actions.track({ id: ids.order, key: "share" });
  assert.deepEqual(calls.at(-1).body, { id: ids.order, key: "share" });
  await assert.rejects(async () => store.actions.track({ id: "not-an-id", key: "share" }), TypeError);
  assert.equal(calls.length, 3);
});
