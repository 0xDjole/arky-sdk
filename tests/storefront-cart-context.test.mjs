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
  product_id: ids.product,
  variant_id: ids.variant,
  quantity: 1,
  form_submission_id: null,
  price_override: null,
  purchase: { type: "catalog" },
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

function storeWithCart(options = {}) {
  const store = initialize(publishableKey, { apiUrl, locale: "en", market: "market-a", sessionStorage: visitorStorage(), ...options });
  store.eshop.cart.cart.set(cartRecord({ line_items: [productLine] }));
  return store;
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
  const store = storeWithCart();
  await store.eshop.cart.setDeliveryGroups([group]);
  assert.deepEqual(store.eshop.cart.cart.get().delivery_groups, [group]);
  await store.eshop.cart.setDeliveryGroups([]);
  await store.eshop.cart.setBillingAddress(null);
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["PUT", `/v1/storefront/carts/${ids.cart}`, { expected_updated_at: 1_700_000_000_001, delivery_groups: [group] }],
    ["PUT", `/v1/storefront/carts/${ids.cart}`, { expected_updated_at: 1_700_000_000_002, delivery_groups: [] }],
    ["PUT", `/v1/storefront/carts/${ids.cart}`, { expected_updated_at: 1_700_000_000_003, billing_address: null }],
  ]);
});

test("promotion codes come from the reviewed quote, drop with a language change, and are only sent when the buyer sets them", async (context) => {
  const promotions = [
    { promotion_id: "promotion", promotion_key: "spring", code: { promotion_code_id: "code", code: "SAVE10" } },
    { promotion_id: "automatic", promotion_key: "auto", code: null },
  ];
  const calls = recordFetch(context, (call) => call.path.endsWith("/quote") ? quoteRecord({ promotions }) : cartRecord({ line_items: [productLine], updated_at: 1_700_000_000_002 }));
  const store = storeWithCart();
  assert.deepEqual(store.eshop.cart.promotion_codes.get(), []);
  await store.eshop.cart.quote();
  assert.deepEqual(store.eshop.cart.promotion_codes.get(), ["SAVE10"]);
  store.setLocale("de");
  assert.equal(store.eshop.cart.quote_result.get(), null);
  assert.deepEqual(store.eshop.cart.promotion_codes.get(), []);
  await store.eshop.cart.quote();
  assert.deepEqual(store.eshop.cart.promotion_codes.get(), ["SAVE10"]);
  await store.eshop.cart.setBillingAddress(null);
  assert.equal(store.eshop.cart.quote_result.get(), null);
  await store.eshop.cart.setPromotionCodes([]);
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
  const store = initialize(publishableKey, { apiUrl, locale: "en", market: "market-a", sessionStorage: visitorStorage() });
  await store.eshop.cart.create({ id: ids.cart, buyer: customerBuyer, catalog_id: ids.catalog });
  store.setMarket("market-b");
  await store.eshop.cart.create({ id: ids.otherCart, buyer: customerBuyer, catalog_id: ids.catalog });
  store.setMarket("market-a");
  const first = store.eshop.cart.load({ buyer: customerBuyer, catalog_id: ids.catalog });
  const rejected = assert.rejects(first, /changed during the cart operation/);
  await reads.get(ids.cart).started;
  store.setMarket("market-b");
  assert.equal(store.eshop.cart.cart.get(), null);
  const second = store.eshop.cart.load({ buyer: customerBuyer, catalog_id: ids.catalog });
  await reads.get(ids.otherCart).started;
  reads.get(ids.cart).release();
  await rejected;
  assert.equal(store.eshop.cart.cart.get(), null);
  assert.equal(store.eshop.cart.status.get().loading, true);
  assert.equal(store.eshop.cart.status.get().error, null);
  reads.get(ids.otherCart).release();
  assert.equal((await second).id, ids.otherCart);
  assert.equal(store.eshop.cart.cart.get().id, ids.otherCart);
  assert.equal(store.eshop.cart.status.get().loading, false);
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.headers.get("x-arky-market")]), [
    ["POST", "/v1/storefront/carts", "market-a"],
    ["POST", "/v1/storefront/carts", "market-b"],
    ["GET", `/v1/storefront/carts/${ids.cart}`, "market-a"],
    ["GET", `/v1/storefront/carts/${ids.otherCart}`, "market-b"],
  ]);
});

test("a cart with items keeps its market until it is emptied, and the store has no sales channel to switch", () => {
  const store = storeWithCart();
  assert.throws(() => store.setMarket("market-b"), (error) => error.code === "CART_MARKET_LOCKED");
  for (const removed of ["setSalesChannel", "getSalesChannel", "sales_channel_key"]) assert.equal(removed in store, false, removed);
  store.setMarket("market-a");
  store.eshop.cart.cart.set(cartRecord());
  store.setMarket("market-b");
  assert.equal(store.getMarket(), "market-b");
  assert.equal(store.eshop.cart.cart.get(), null);
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
    const store = storeWithCart();
    const pending = store.eshop.cart.quote();
    const rejected = assert.rejects(pending, change === "buyer" ? /changed during the cart operation/ : /language changed while quoting/);
    await quote.started;
    if (change === "buyer") await store.customer.identify();
    else store.setLocale("de");
    quote.release();
    await rejected;
    assert.equal(store.eshop.cart.quote_result.get(), null);
    assert.equal(store.eshop.cart.status.get().fetching_quote, false);
    if (change === "buyer") {
      assert.equal(store.eshop.cart.cart.get(), null);
      assert.equal(store.eshop.cart.status.get().quote_error, null);
    } else {
      assert.equal(store.eshop.cart.cart.get().id, ids.cart);
      assert.match(store.eshop.cart.status.get().quote_error, /language changed while quoting/);
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
  const store = initialize(publishableKey, { apiUrl, locale: "en", market: "market-a", sessionStorage: visitorStorage() });
  const request = checkoutRequest();
  await store.client.eshop.cart.retainCheckout(request);
  await assert.rejects(store.client.eshop.cart.recoverCheckout(), /response lost/);
  const pending = await store.eshop.cart.pendingCheckout();
  assert.deepEqual(pending, request);
  const key = `arky:cart-checkout:v4:${encodeURIComponent(`storefront:${apiUrl}:${publishableKey}`)}`;
  const retained = durable.getItem(key);
  assert.ok(retained);
  store.setMarket("market-b");
  await store.customer.identify();
  assert.equal(store.eshop.cart.cart.get(), null);
  assert.equal(store.eshop.cart.last_order.get(), null);
  assert.equal(durable.getItem(key), retained);
  assert.deepEqual(await store.eshop.cart.pendingCheckout(), pending);
  assert.equal(calls.filter((call) => call.path.endsWith("/carts/accept")).length, 1);
});
