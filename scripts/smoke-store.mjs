#!/usr/bin/env node
import assert from "node:assert/strict";
import { initialize } from "../dist/storefront-store.js";

const store = initialize({
  baseUrl: "http://127.0.0.1:1",
  storeId: "smoke-store",
  market: "us",
  locale: "en",
});

assert.equal("cart" in store, false, "cart must live under eshop.cart");
assert.equal("booking" in store, false, "service scheduling must live under eshop.service");
assert.equal(typeof store.setup, "function");
assert.equal("initialize" in store, false, "setup is the boot method; initialize is only the factory export");
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
assert.equal(typeof store.activity.pageView, "function");
assert.equal("actions" in store.eshop.cart, false, "cart commands should be direct methods");
assert.equal("actions" in store.eshop.service, false, "service commands should be direct methods");
assert.equal(typeof store.eshop.cart.ensure, "function");
assert.equal(typeof store.eshop.cart.checkout, "function");
assert.equal(typeof store.eshop.product.list, "function");
assert.equal(typeof store.eshop.product.loadDetail, "function");
assert.equal(typeof store.eshop.service.listProviders, "function");
assert.equal(typeof store.eshop.service.initialize, "function");
assert.equal(typeof store.eshop.service.select, "function");
const legacyServiceModuleName = "service" + "Order";
assert.equal(legacyServiceModuleName in store.eshop, false, "scheduled service controls belong under eshop.service");
assert.equal(store.eshop.cart.product_items.get().length, 0);
assert.equal(store.eshop.service.state.get().cart.length, 0);

console.log("Storefront SDK smoke test passed.");
