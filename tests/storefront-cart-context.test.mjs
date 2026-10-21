import assert from "node:assert/strict";
import test from "node:test";
import { initialize } from "../dist/storefront.js";
import { ExclusiveLockManager, MemoryStorage } from "./helpers/durable-request-fixtures.mjs";
import {
  apiUrl,
  cartRecord,
  checkoutRequest,
  customerRecord,
  ids,
  installGlobal,
  publishableKey,
  quoteRecord,
  recordFetch,
  visitorSession,
  visitorStorage,
} from "./helpers/arky-fixtures.mjs";

const customerBuyer = { type: "customer" };
const productLine = {
  type: "product",
  id: ids.line,
  variant_id: ids.variant,
  quantity: 1,
  form_submission_id: null,
  purchase: { type: "catalog", catalog_item_price_id: ids.price },
};
const otherVisitorToken = `customer_visitor_${"w".repeat(64)}`;

function otherBuyer() {
  return { customer: customerRecord(ids.otherCustomer), session: visitorSession(ids.otherCustomer, ids.otherSession, otherVisitorToken) };
}

function gate() {
  let release;
  let enter;
  const waiting = new Promise((resolve) => {
    release = resolve;
  });
  const started = new Promise((resolve) => {
    enter = resolve;
  });
  return { release, enter, waiting, started };
}

const scope = { buyer: customerBuyer, catalog_id: ids.catalog };

function storeWithCart(options = {}) {
  const store = initialize(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, locale: "en", market: "market-a", sessionStorage: visitorStorage(), ...options });
  const cart = store.eshop.cart(scope);
  cart.cart.set(cartRecord({ line_items: [productLine] }));
  return { store, cart };
}

test("the store saves delivery groups exactly as given, with the loaded cart's id and version, and never makes up another group", async (context) => {
  const group = {
    id: "8b79e7c7-7e98-4962-a245-7836a7774054",
    items: [{ line_item: { type: "product", line_item_id: ids.line }, quantity: 1 }],
    destination: { type: "pickup", store_location_id: "location-a" },
    shipping: { shipping_method_id: "method-a", rate_id: "rate-a" },
    timing: { type: "window", from: 1_800_000_000_000, to: 1_800_003_600_000 },
  };
  let version = 1_700_000_000_001;
  const calls = recordFetch(context, (call) => {
    version += 1;
    return cartRecord({ line_items: [productLine], delivery_groups: call.body.delivery_groups ?? [], updated_at: version });
  });
  const { store, cart } = storeWithCart();
  await cart.setDeliveryGroups({ delivery_groups: [group] });
  assert.deepEqual(cart.cart.get().delivery_groups, [group]);
  await cart.setDeliveryGroups({ delivery_groups: [] });
  await cart.setBillingAddress({ billing_address: null });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["PUT", `/v1/storefront/carts/${ids.cart}`, { expected_updated_at: 1_700_000_000_001, delivery_groups: [group] }],
    ["PUT", `/v1/storefront/carts/${ids.cart}`, { expected_updated_at: 1_700_000_000_002, delivery_groups: [] }],
    ["PUT", `/v1/storefront/carts/${ids.cart}`, { expected_updated_at: 1_700_000_000_003, billing_address: null }],
  ]);
});

test("promotion codes come from the reviewed quote, drop with a language change, and are only sent when the buyer sets them", async (context) => {
  const promotions = [
    { promotion_id: "promotion", promotion_key: "spring", code: { promotion_code_id: "code", code: "SAVE10" } },
  ];
  const calls = recordFetch(context, (call) => call.path.endsWith("/quote") ? quoteRecord({ promotions }) : cartRecord({ line_items: [productLine], updated_at: 1_700_000_000_002 }));
  const { store, cart } = storeWithCart();
  assert.deepEqual(cart.promotion_codes.get(), []);
  await cart.quote();
  assert.deepEqual(cart.promotion_codes.get(), ["SAVE10"]);
  store.setContext({ locale: "de" });
  assert.equal(cart.quote_result.get(), null);
  assert.deepEqual(cart.promotion_codes.get(), []);
  await cart.quote();
  assert.deepEqual(cart.promotion_codes.get(), ["SAVE10"]);
  await cart.setBillingAddress({ billing_address: null });
  assert.equal(cart.quote_result.get(), null);
  await cart.setPromotionCodes({ promotion_codes: [] });
  const puts = calls.filter((call) => call.method === "PUT");
  assert.equal(Object.hasOwn(puts[0].body, "promotion_codes"), false);
  assert.deepEqual(puts[1].body, { expected_updated_at: 1_700_000_000_002, promotion_codes: [] });
  const quotes = calls.filter((call) => call.path.endsWith("/quote"));
  assert.deepEqual(quotes.map((call) => [call.body, call.headers.get("x-arky-locale")]), [[{}, "en"], [{}, "de"]]);
});

test("a market change clears the selected cart view, and a late read for the old market can't reset the new load", async (context) => {
  const reads = new Map([[ids.cart, gate()], [ids.otherCart, gate()]]);
  const calls = recordFetch(context, async (call) => {
    if (call.method === "POST") {
      const id = call.body.id;
      return { type: "created", cart: cartRecord({ id, catalog_id: ids.catalog }), recovery_token: `token-${id}` };
    }
    const id = call.path.split("/").at(-1);
    reads.get(id).enter();
    await reads.get(id).waiting;
    return cartRecord({ id });
  });
  const store = initialize(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, locale: "en", market: "market-a", sessionStorage: visitorStorage() });
  const cart = store.eshop.cart(scope);
  await cart.create({ id: ids.cart });
  store.setContext({ market: "market-b" });
  await cart.create({ id: ids.otherCart });
  store.setContext({ market: "market-a" });
  const first = cart.load();
  const rejected = assert.rejects(first, /changed during the cart operation/);
  await reads.get(ids.cart).started;
  store.setContext({ market: "market-b" });
  assert.equal(cart.cart.get(), null);
  const second = cart.load();
  await reads.get(ids.otherCart).started;
  reads.get(ids.cart).release();
  await rejected;
  assert.equal(cart.cart.get(), null);
  assert.equal(cart.status.get().loading, true);
  assert.equal(cart.status.get().error, null);
  reads.get(ids.otherCart).release();
  assert.equal((await second).id, ids.otherCart);
  assert.equal(cart.cart.get().id, ids.otherCart);
  assert.equal(cart.status.get().loading, false);
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.headers.get("x-arky-market")]), [
    ["POST", "/v1/storefront/carts", "market-a"],
    ["POST", "/v1/storefront/carts", "market-b"],
    ["GET", `/v1/storefront/carts/${ids.cart}`, "market-a"],
    ["GET", `/v1/storefront/carts/${ids.otherCart}`, "market-b"],
  ]);
});

test("the market changes while a cart has items, the view clears, and the store has no sales channel to switch", () => {
  const { store, cart } = storeWithCart();
  for (const removed of ["setSalesChannel", "getSalesChannel", "sales_channel_key"]) assert.equal(removed in store, false, removed);
  store.setContext({ market: "market-b" });
  assert.equal(store.getMarket(), "market-b");
  assert.equal(cart.cart.get(), null);
  assert.equal(cart.item_count.get(), 0);
});

for (const change of ["buyer", "language"]) {
  test(`a quote finishing after a ${change} change can't become the reviewed quote`, async (context) => {
    const quote = gate();
    const calls = recordFetch(context, async (call) => {
      if (call.path === "/v1/storefront/customer/identify") return otherBuyer();
      quote.enter();
      await quote.waiting;
      return quoteRecord();
    });
    const { store, cart } = storeWithCart();
    const pending = cart.quote();
    const rejected = assert.rejects(pending, change === "buyer" ? /changed during the cart operation/ : /language changed while quoting/);
    await quote.started;
    if (change === "buyer") await store.customer.identify({ customer_id: ids.otherCustomer, session_id: ids.otherSession });
    else store.setContext({ locale: "de" });
    quote.release();
    await rejected;
    assert.equal(cart.quote_result.get(), null);
    assert.equal(cart.status.get().fetching_quote, false);
    if (change === "buyer") {
      assert.equal(cart.cart.get(), null);
      assert.equal(cart.status.get().quote_error, null);
    } else {
      assert.equal(cart.cart.get().id, ids.cart);
      assert.equal(cart.status.get().quote_error.code, "context_changed");
      assert.match(cart.status.get().quote_error.message, /language changed while quoting/);
    }
    assert.equal(calls.filter((call) => call.path.endsWith("/carts/accept")).length, 0);
  });
}

test("a buyer or market change leaves an unresolved checkout request byte for byte", async (context) => {
  const durable = new MemoryStorage();
  installGlobal(context, "window", globalThis);
  installGlobal(context, "localStorage", durable);
  installGlobal(context, "navigator", { locks: new ExclusiveLockManager() });
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront/customer/identify") return otherBuyer();
    assert.equal(call.path, "/v1/storefront/carts/accept");
    throw new TypeError("response lost");
  });
  const store = initialize(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, locale: "en", market: "market-a", sessionStorage: visitorStorage() });
  const scoped = store.eshop.cart(scope);
  const request = checkoutRequest();
  await store.client.eshop.cart.retainCheckout({ ...request, scope });
  await assert.rejects(store.client.eshop.cart.recoverCheckout({ scope }), /response lost/);
  const pending = await scoped.pendingCheckout();
  assert.deepEqual(pending, request);
  const key = `arky:cart-checkout:v5:${encodeURIComponent(`storefront:${apiUrl}:${publishableKey}`)}:${encodeURIComponent(`customer|${ids.catalog}`)}`;
  const retained = durable.getItem(key);
  assert.ok(retained);
  store.setContext({ market: "market-b" });
  await store.customer.identify({ customer_id: ids.otherCustomer, session_id: ids.otherSession });
  assert.equal(scoped.cart.get(), null);
  assert.equal(scoped.last_order.get(), null);
  assert.equal(durable.getItem(key), retained);
  assert.deepEqual(await scoped.pendingCheckout(), pending);
  assert.equal(calls.filter((call) => call.path.endsWith("/carts/accept")).length, 1);
});
