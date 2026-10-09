import assert from "node:assert/strict";
import test from "node:test";

import { initialize as initializeFromRoot } from "../dist/index.js";
import { createStorefront, initialize } from "../dist/storefront.js";
import {
  apiUrl,
  cartRecord,
  errorResponse,
  ids,
  placedAcceptance,
  placedOrder,
  publishableKey,
  quoteRecord,
  recordFetch,
  visitorStorage,
  visitorToken,
} from "./helpers/arky-fixtures.mjs";

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

function checkoutStore() {
  const store = initialize(publishableKey, { apiUrl, market: "ita", locale: "it", sessionStorage: visitorStorage() });
  store.eshop.cart.cart.set(cartRecord({ line_items: [productLine] }));
  store.eshop.cart.quote_result.set(quoteRecord());
  return store;
}

function cardPayment() {
  return { type: "payment_option", payment_option_id: ids.paymentOption, return_url: "https://shop.example.test/checkout/complete", save_payment_method: false, payment_method_terms_version: null };
}

test("initialize is the root API and exposes the module facade without store switching", () => {
  const rootStore = initializeFromRoot(publishableKey, { locale: "it" });
  const store = initialize(publishableKey, { locale: "it", market: "ita" });
  for (const facade of [rootStore, store]) {
    assert.equal(typeof facade.content.entry.get, "function");
    assert.equal(typeof facade.media.findByIds, "function");
    assert.equal(typeof facade.content.entry.findByIds, "function");
    assert.equal(typeof facade.forms.get, "function");
    assert.equal(typeof facade.forms.submitByKey, "function");
    assert.equal(typeof facade.actions.track, "function");
    assert.equal(typeof facade.category.get, "function");
    assert.equal(typeof facade.category.getByKey, "function");
    assert.equal(typeof facade.eshop.cart.load, "function");
    assert.equal(typeof facade.eshop.cart.paymentAction, "function");
    assert.equal(typeof facade.subscription_plans.find, "function");
    assert.equal(typeof facade.setContext, "function");
    assert.equal(typeof facade.withContext, "function");
    for (const removed of ["getStoreId", "forStore", "marketForLocale", "audiences", "customer_groups", "customer_group_members", "customer_group_email_consents", "cms", "crm"]) {
      assert.equal(removed in facade, false, removed);
    }
    assert.equal("category" in facade.content, false);
    assert.equal("payment" in facade.eshop.cart, false);
    assert.equal("digital" in facade.eshop, false);
    assert.equal(facade.session.get(), null);
    assert.equal(facade.isAuthenticated, false);
  }
  const scoped = store.withContext({ locale: "en" });
  assert.equal(store.getLocale(), "it");
  assert.equal(store.getMarket(), "ita");
  assert.equal(scoped.getLocale(), "en");
  assert.equal(scoped.getMarket(), "ita");
});

test("storefront reference batches use their typed endpoints with the ids JSON-encoded", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: null }));
  const storefront = createStorefront(publishableKey, { apiUrl });
  await storefront.media.findByIds({ ids: ["media-1", "media-2"] });
  await storefront.content.entry.findByIds({ ids: ["entry-1"] });
  await storefront.eshop.product.find({ ids: [ids.product], catalog_id: ids.catalog });
  assert.deepEqual(calls.map((call) => [call.method, call.path, JSON.parse(call.query.ids)]), [
    ["GET", "/v1/storefront/media", ["media-1", "media-2"]],
    ["GET", "/v1/storefront/entries", ["entry-1"]],
    ["GET", "/v1/storefront/products", [ids.product]],
  ]);
  assert.equal(calls[2].query.catalog_id, ids.catalog);
});

test("market and locale stay independent, and a cart with items locks its market and sales channel", () => {
  const store = initialize(publishableKey, { locale: "it", market: "ita", salesChannel: "web" });
  store.setContext({ locale: "en" });
  assert.equal(store.getLocale(), "en");
  assert.equal(store.getMarket(), "ita");
  store.eshop.cart.cart.set(cartRecord({ line_items: [productLine] }));
  assert.throws(() => store.setContext({ market: "bih" }), (error) => error.code === "CART_MARKET_LOCKED");
  assert.throws(() => store.setContext({ salesChannel: "pos" }), (error) => error.code === "CART_SALES_CHANNEL_LOCKED");
  assert.equal(store.getMarket(), "ita");
  assert.equal(store.getSalesChannel(), "web");
  assert.equal(store.eshop.cart.cart.get().id, ids.cart);
  store.setContext({ market: "ita", locale: "bs" });
  assert.equal(store.getLocale(), "bs");
});

test("checkout from the store sends the reviewed cart through keyless routes with visitor authorization and no store, market or language in the body", async (context) => {
  const calls = recordFetch(context, (call) => call.path === "/v1/storefront/carts/accept" ? placedAcceptance() : placedOrder());
  const store = checkoutStore();
  await assert.rejects(store.eshop.cart.checkout({ order_id: "order-1", contact_email: null, payment: cardPayment() }), /needs the app's order id/);
  assert.equal(calls.length, 0);
  const answer = await store.eshop.cart.checkout({ order_id: ids.order, contact_email: "buyer@example.test", payment: cardPayment() });
  assert.deepEqual(answer, placedAcceptance());
  assert.deepEqual(calls.map((call) => [call.method, call.path]), [
    ["POST", "/v1/storefront/carts/accept"],
    ["GET", `/v1/storefront/orders/${ids.order}`],
  ]);
  assert.deepEqual(calls[0].body, {
    order_id: ids.order,
    cart_id: ids.cart,
    expected_updated_at: cartRecord().updated_at,
    presentation_digest: quoteRecord().presentation_digest,
    contact_email: "buyer@example.test",
    payment: cardPayment(),
  });
  assert.equal(calls[1].body, null);
  for (const call of calls) {
    assert.equal(call.headers.get("authorization"), `Bearer ${visitorToken}`);
    assert.equal(call.headers.get("x-arky-publishable-key"), publishableKey);
    assert.equal(call.headers.get("x-arky-locale"), "it");
    assert.equal(call.headers.get("x-arky-market"), "ita");
    assert.equal(call.href.includes("store_id"), false);
  }
  assert.equal(store.eshop.cart.cart.get(), null);
  const lastOrder = store.eshop.cart.last_order.get();
  assert.deepEqual({ ...lastOrder, created_at: 0 }, {
    order_id: ids.order,
    number: "1001",
    cart_id: ids.cart,
    payment_id: null,
    payment_action: { type: "none" },
    total: 2500,
    currency: "eur",
    created_at: 0,
  });
});

test("a free checkout needs no payment option and still clears the stale cart state", async (context) => {
  recordFetch(context, (call) => call.path === "/v1/storefront/carts/accept" ? placedAcceptance({ number: "1000" }) : placedOrder({ number: "1000" }));
  const store = checkoutStore();
  store.eshop.cart.quote_result.set(quoteRecord({ totals: { subtotal: 0, delivery: 0, discount: 0, tax: 0, total: 0 } }));
  const answer = await store.eshop.cart.checkout({ order_id: ids.order, contact_email: null, payment: { type: "free" } });
  assert.equal(answer.type, "placed");
  assert.equal(store.eshop.cart.cart.get(), null);
  assert.deepEqual(store.eshop.cart.product_items.get(), []);
  assert.equal(store.eshop.cart.last_order.get().total, 0);
  assert.equal(store.eshop.cart.quote_result.get(), null);
});

test("checkout refuses before posting without a reviewed, ready quote for this cart", async (context) => {
  const calls = recordFetch(context, () => placedAcceptance());
  const store = checkoutStore();
  const input = { order_id: ids.order, contact_email: null, payment: cardPayment() };
  store.eshop.cart.quote_result.set(null);
  await assert.rejects(store.eshop.cart.checkout(input), /Quote the cart before checkout/);
  store.eshop.cart.quote_result.set(quoteRecord({ cart_id: ids.otherCart }));
  await assert.rejects(store.eshop.cart.checkout(input), /Quote the cart before checkout/);
  store.eshop.cart.quote_result.set(quoteRecord({ ready: false, blockers: [{ type: "billing_address_required" }] }));
  await assert.rejects(store.eshop.cart.checkout(input), /The quote isn't ready/);
  assert.equal(calls.length, 0);
  assert.equal(store.eshop.cart.status.get().processing_checkout, false);
});

test("outside a browser a lost checkout keeps no recovery state, and the retry sends the same app-picked order id", async (context) => {
  let accepts = 0;
  const calls = recordFetch(context, (call) => {
    if (call.path !== "/v1/storefront/carts/accept") return placedOrder();
    accepts += 1;
    if (accepts === 1) throw new TypeError("response connection was lost");
    return placedAcceptance();
  });
  const store = checkoutStore();
  const input = { order_id: ids.order, contact_email: null, payment: cardPayment() };
  await assert.rejects(store.eshop.cart.checkout(input), /connection was lost/);
  assert.equal(await store.eshop.cart.pendingCheckout(), null);
  assert.deepEqual(await store.eshop.cart.checkout(input), placedAcceptance());
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body?.order_id ?? null]), [
    ["POST", "/v1/storefront/carts/accept", ids.order],
    ["POST", "/v1/storefront/carts/accept", ids.order],
    ["GET", `/v1/storefront/orders/${ids.order}`, null],
  ]);
  assert.equal(store.eshop.cart.last_order.get().order_id, ids.order);
});

test("a refused checkout is propagated once and leaves the cart in place", async (context) => {
  const calls = recordFetch(context, () => errorResponse(422, "CART.NOT_READY", "Pick shipping first"));
  const store = checkoutStore();
  await assert.rejects(store.eshop.cart.checkout({ order_id: ids.order, contact_email: null, payment: cardPayment() }), (error) => error.statusCode === 422 && error.code === "CART.NOT_READY");
  assert.equal(calls.length, 1);
  assert.equal(store.eshop.cart.cart.get().id, ids.cart);
  assert.equal(store.eshop.cart.last_order.get(), null);
  assert.equal(store.eshop.cart.status.get().error, "Pick shipping first");
});

test("a card checkout hands back the embedded Stripe action without navigating", async (context) => {
  const action = { type: "stripe_embedded_checkout", publishable_key: "pk_test_order", client_secret: "cs_order_secret_exact", expires_at: 1_800_000_000_000 };
  recordFetch(context, (call) => call.path === "/v1/storefront/carts/accept" ? placedAcceptance({ payment_id: ids.payment, payment_action: action }) : placedOrder());
  const store = checkoutStore();
  const answer = await store.eshop.cart.checkout({ order_id: ids.order, contact_email: null, payment: cardPayment() });
  assert.deepEqual(answer.payment_action, action);
  assert.equal("account_id" in answer.payment_action, false);
  assert.deepEqual(store.eshop.cart.last_order.get().payment_action, action);
  assert.equal(store.eshop.cart.last_order.get().payment_id, ids.payment);
});

test("payment resume asks the placed order for its payment action, and payments are read exactly", async (context) => {
  const calls = recordFetch(context, (call) => call.path.endsWith("/payment-action") ? { type: "none" } : call.path.endsWith("/payments") ? [] : { id: ids.payment });
  const store = initialize(publishableKey, { apiUrl, sessionStorage: visitorStorage() });
  assert.deepEqual(await store.eshop.cart.paymentAction(ids.order), { type: "none" });
  await store.eshop.order.getPayment({ order_id: ids.order, payment_id: ids.payment });
  await store.eshop.order.findPayments({ order_id: ids.order });
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["POST", `/v1/storefront/orders/${ids.order}/payment-action`, null],
    ["GET", `/v1/storefront/orders/${ids.order}/payments/${ids.payment}`, null],
    ["GET", `/v1/storefront/orders/${ids.order}/payments`, null],
  ]);
  assert.ok(calls.every((call) => call.headers.get("authorization") === `Bearer ${visitorToken}`));
  assert.equal("checkout" in createStorefront(publishableKey, { apiUrl }).eshop, false);
});
