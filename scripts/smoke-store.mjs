#!/usr/bin/env node
import assert from "node:assert/strict";
import { initialize } from "../dist/storefront.js";

const store = initialize({
  baseUrl: "http://127.0.0.1:1",
  storeId: "smoke-store",
  market: "us",
  locale: "en",
});

assert.equal(typeof store.cart.load, "function");
assert.equal(store.cart.load, store.eshop.cart.ensure);
assert.equal(store.commerce.cart, store.cart);
assert.equal(typeof store.commerce.checkout, "function");
assert.equal(typeof store.hydrateCart, "function");
assert.equal(store.hydrateCart, store.cart.load);
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
assert.equal(typeof store.eshop.cart.ensure, "function");
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

console.log("Storefront SDK smoke test passed.");
