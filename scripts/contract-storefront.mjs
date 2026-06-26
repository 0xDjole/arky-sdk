#!/usr/bin/env node
import assert from "node:assert/strict";
import { initialize } from "../dist/storefront.js";

const store = initialize({
  baseUrl: "http://127.0.0.1:1",
  storeId: "contract-store",
  market: "us",
  locale: "en",
});

assert.equal(typeof store.cart.load, "function");
assert.equal(store.cart, store.eshop.cart);
assert.equal(typeof store.cart.refresh, "function");
assert.equal("ensure" in store.cart, false);
assert.equal("hydrate" in store.cart, false);
assert.equal("sync" in store.cart, false);
assert.equal("commerce" in store, false);
assert.equal("hydrateCart" in store, false);
assert.equal("booking" in store, false, "service scheduling must live under eshop.service");
assert.equal("setup" in store, false, "initialize returns the ready storefront API; no public setup boot method");
assert.equal("initialize" in store, false, "initialize is only the factory export");
assert.equal(typeof store.setContext, "function");
assert.equal(typeof store.me, "function");
assert.equal(typeof store.onAuthStateChanged, "function");
assert.equal(store.currentSession, null);
assert.equal(store.isAuthenticated, false);
store.setContext({ locale: "en", market: "us" });
assert.equal(store.getLocale(), "en");
assert.equal(store.getMarket(), "us");
assert.equal(typeof store.cms.entry.get, "function");
assert.equal(typeof store.cms.entry.find, "function");
assert.equal("website" in store.cms, false, "CMS entry keys must not be public SDK methods");
assert.equal(typeof store.action.pageView, "function");
assert.equal("actions" in store.eshop.cart, false, "cart commands should be direct methods");
assert.equal("actions" in store.eshop.service, false, "service commands should be direct methods");
assert.equal(typeof store.eshop.cart.load, "function");
assert.equal(typeof store.eshop.cart.checkout, "function");
assert.equal(typeof store.eshop.product.list, "function");
assert.equal(typeof store.eshop.product.loadDetail, "function");
assert.equal(typeof store.eshop.service.listProviders, "function");
assert.equal(typeof store.eshop.service.initialize, "function");
assert.equal(typeof store.eshop.service.select, "function");
const removedServiceModuleName = "service" + "Order";
assert.equal(removedServiceModuleName in store.eshop, false, "scheduled service controls belong under eshop.service");
assert.equal(store.eshop.cart.product_items.get().length, 0);
assert.equal(store.eshop.service.state.get().cart.length, 0);

const fetchCalls = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  fetchCalls.push({
    url: String(url),
    method: init.method,
    body: init.body,
  });
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

try {
  const unsubscribe = await store.crm.contactList.unsubscribe("unsubscribe-token");
  const confirm = await store.crm.contactList.confirm("confirm-token");
  assert.deepEqual(unsubscribe, { success: true });
  assert.deepEqual(confirm, { success: true });
} finally {
  globalThis.fetch = originalFetch;
}

assert.equal(fetchCalls[0].method, "POST");
assert.equal(
  fetchCalls[0].url,
  "http://127.0.0.1:1/v1/storefront/contract-store/contact-lists/unsubscribe",
);
assert.deepEqual(JSON.parse(fetchCalls[0].body), { token: "unsubscribe-token" });
assert.equal(fetchCalls[1].method, "POST");
assert.equal(
  fetchCalls[1].url,
  "http://127.0.0.1:1/v1/storefront/contract-store/contact-lists/confirm",
);
assert.deepEqual(JSON.parse(fetchCalls[1].body), { token: "confirm-token" });

console.log("Storefront SDK contract test passed.");
