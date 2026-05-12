#!/usr/bin/env node
import assert from "node:assert/strict";
import { createArkyStore } from "../dist/storefront-store.js";

const store = createArkyStore({
  baseUrl: "http://127.0.0.1:1",
  storeId: "smoke-store",
  market: "us",
  locale: "en",
});

assert.equal("cart" in store, false, "cart must live under eshop.cart");
assert.equal("booking" in store, false, "service orders must live under eshop.serviceOrder");
assert.equal(typeof store.initialize, "function");
assert.equal(typeof store.me, "function");
assert.equal(typeof store.onAuthStateChanged, "function");
assert.equal(store.currentSession, null);
assert.equal(store.isAuthenticated, false);
assert.equal(typeof store.eshop.cart.actions.ensure, "function");
assert.equal(typeof store.eshop.cart.actions.checkout, "function");
assert.equal(typeof store.eshop.serviceOrder.actions.initialize, "function");
assert.equal(store.eshop.cart.product_items.get().length, 0);
assert.equal(store.eshop.serviceOrder.state.get().cart.length, 0);

console.log("Storefront store smoke test passed.");
