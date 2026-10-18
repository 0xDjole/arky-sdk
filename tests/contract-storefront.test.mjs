import assert from "node:assert/strict";
import test from "node:test";

import { initialize as initializeFromRoot } from "../dist/index.js";
import { createStorefront, initialize } from "../dist/storefront.js";
import {
  apiUrl,
  cartRecord,
  errorResponse,
  idFactories,
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
  variant_id: ids.variant,
  quantity: 1,
  form_submission_id: null,
  price_override: null,
  purchase: { type: "catalog" },
};

const scope = { buyer: { type: "customer" }, catalog_id: ids.catalog };

function checkoutCart() {
  const store = initialize(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, market: "ita", locale: "it", sessionStorage: visitorStorage() });
  const cart = store.eshop.cart(scope);
  cart.cart.set(cartRecord({ line_items: [productLine] }));
  cart.quote_result.set(quoteRecord());
  return cart;
}

function cardPayment() {
  return { type: "payment_option", payment_option_id: ids.paymentOption, return_url: "https://shop.example.test/checkout/complete", save_payment_method: false, payment_method_terms: null };
}

test("initialize is the root API and exposes the module facade without store switching", () => {
  const rootStore = initializeFromRoot(publishableKey, { ...idFactories, locale: "it" });
  const store = initialize(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, locale: "it", market: "ita" });
  for (const facade of [rootStore, store]) {
    const cart = facade.eshop.cart(scope);
    assert.equal(typeof facade.content.entry.get, "function");
    assert.equal(typeof facade.content.entry.find, "function");
    assert.equal(typeof facade.media.find, "function");
    assert.equal(typeof facade.forms.get, "function");
    assert.equal(typeof facade.forms.getByKey, "function");
    assert.equal(typeof facade.forms.submit, "function");
    assert.equal(typeof facade.actions.track, "function");
    assert.equal(typeof facade.category.get, "function");
    assert.equal(typeof facade.category.getByKey, "function");
    assert.equal(typeof facade.eshop.cart, "function");
    assert.equal(typeof cart.load, "function");
    assert.equal(typeof cart.addCustomerGroup, "function");
    assert.equal(typeof facade.eshop.order.resumePayment, "function");
    assert.equal(typeof facade.eshop.customerGroup.find, "function");
    assert.equal(typeof facade.eshop.customerGroup.get, "function");
    assert.equal(typeof facade.eshop.customerGroupOffering.get, "function");
    assert.equal(typeof facade.eshop.customerGroupMember.find, "function");
    assert.equal(typeof facade.eshop.minimumProgress.get, "function");
    assert.equal(typeof facade.customer.changeEmail, "function");
    assert.equal(typeof facade.setContext, "function");
    assert.equal(typeof facade.eshop.checkoutFlow, "function");
    assert.equal(typeof facade.eshop.bookingCalendar, "function");
    assert.equal(typeof facade.content.load, "function");
    assert.equal(typeof facade.newsletter.join, "function");
    assert.equal(typeof facade.newsletter.requestCode, "function");
    for (const removed of [
      "getStoreId", "forStore", "marketForLocale", "audiences", "customer_groups", "customer_group_members", "customer_group_email_consents", "cms", "crm",
      "subscription_plans", "subscription_offerings", "setSalesChannel", "getSalesChannel", "sales_channel_key", "withContext",
      "setMarket", "setLocale", "utils", "ensureSession",
    ]) {
      assert.equal(removed in facade, false, removed);
    }
    for (const removed of ["subscription", "subscriptionPlan", "subscriptionOffering", "carts", "state"]) assert.equal(removed in facade.eshop, false, removed);
    for (const removed of ["addSubscriptionPlan", "subscription_plan_items", "payment", "paymentAction", "clearLocal"]) assert.equal(removed in cart, false, removed);
    assert.equal(facade.eshop.cart(scope), cart);
    assert.equal(facade.eshop.checkoutFlow(scope).cart, cart);
    assert.equal(facade.eshop.bookingCalendar(scope).scope, cart.scope);
    assert.equal("category" in facade.content, false);
    assert.equal("state" in facade.content, false);
    assert.equal("state" in facade.forms, false);
    assert.equal("digital" in facade.eshop, false);
    assert.equal(facade.session.get(), null);
    assert.equal(facade.isAuthenticated, false);
  }
  assert.equal(store.getLocale(), "it");
  assert.equal(store.getMarket(), "ita");
});

test("storefront reference batches use their typed endpoints with the ids JSON-encoded", async (context) => {
  const calls = recordFetch(context, (call) => (call.path === "/v1/storefront/media" ? [] : { items: [], cursor: null }));
  const storefront = createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl });
  assert.deepEqual(await storefront.media.find({ ids: ["media-1", "media-2"] }), { items: [], cursor: null });
  await storefront.content.entry.find({ ids: ["entry-1"] });
  await storefront.eshop.product.find({ ids: [ids.product], catalog_id: ids.catalog });
  assert.deepEqual(calls.map((call) => [call.method, call.path, JSON.parse(call.query.ids)]), [
    ["GET", "/v1/storefront/media", ["media-1", "media-2"]],
    ["GET", "/v1/storefront/entries", ["entry-1"]],
    ["GET", "/v1/storefront/products", [ids.product]],
  ]);
  assert.equal(calls[2].query.catalog_id, ids.catalog);
});

test("market and locale stay independent, a market change clears the cart view, and the storefront key alone gives the channel", () => {
  const store = initialize(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, locale: "it", market: "ita" });
  store.setContext({ locale: "en" });
  assert.equal(store.getLocale(), "en");
  assert.equal(store.getMarket(), "ita");
  const cart = store.eshop.cart(scope);
  cart.cart.set(cartRecord({ line_items: [productLine] }));
  store.setContext({ market: "ita", locale: "bs" });
  assert.equal(store.getLocale(), "bs");
  assert.equal(cart.cart.get().id, ids.cart);
  store.setContext({ market: "bih" });
  assert.equal(store.getMarket(), "bih");
  assert.equal(cart.cart.get(), null);
  for (const removed of ["setSalesChannel", "getSalesChannel"]) assert.equal(removed in store, false, removed);
});

test("checkout from the store sends the reviewed cart through keyless routes with visitor authorization and no store, market or language in the body", async (context) => {
  const calls = recordFetch(context, (call) => call.path === "/v1/storefront/carts/accept" ? placedAcceptance() : placedOrder());
  const cart = checkoutCart();
  await assert.rejects(cart.checkout({ order_id: "order-1", order_token: "arky_ot_" + "A".repeat(43), contact_email: null, payment: cardPayment() }), /needs the app's order id/);
  await assert.rejects(cart.checkout({ order_id: ids.order, contact_email: null, payment: cardPayment() }), /both its order_id and order_token/);
  assert.equal(calls.length, 0);
  const answer = await cart.checkout({ order_id: ids.order, order_token: "arky_ot_" + "A".repeat(43), contact_email: "buyer@example.test", payment: cardPayment() });
  assert.deepEqual(answer, placedAcceptance());
  assert.deepEqual(calls.map((call) => [call.method, call.path]), [
    ["POST", "/v1/storefront/carts/accept"],
    ["GET", `/v1/storefront/orders/${ids.order}`],
  ]);
  assert.deepEqual(calls[0].body, {
    order_id: ids.order,
    order_token: "arky_ot_" + "A".repeat(43),
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
  assert.equal(cart.cart.get(), null);
  const lastOrder = cart.last_order.get();
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
  const cart = checkoutCart();
  cart.quote_result.set(quoteRecord({ totals: { subtotal: 0, delivery: 0, discount: 0, tax: 0, total: 0 } }));
  const answer = await cart.checkout({ order_id: ids.order, order_token: "arky_ot_" + "A".repeat(43), contact_email: null, payment: { type: "free" } });
  assert.equal(answer.type, "placed");
  assert.equal(cart.cart.get(), null);
  assert.deepEqual(cart.product_items.get(), []);
  assert.equal(cart.last_order.get().total, 0);
  assert.equal(cart.quote_result.get(), null);
});

test("checkout refuses before posting without a reviewed, ready quote for this cart", async (context) => {
  const calls = recordFetch(context, () => placedAcceptance());
  const cart = checkoutCart();
  const input = { order_id: ids.order, order_token: "arky_ot_" + "A".repeat(43), contact_email: null, payment: cardPayment() };
  cart.quote_result.set(null);
  await assert.rejects(cart.checkout(input), /Quote the cart before checkout/);
  cart.quote_result.set(quoteRecord({ cart_id: ids.otherCart }));
  await assert.rejects(cart.checkout(input), /Quote the cart before checkout/);
  cart.quote_result.set(quoteRecord({ ready: false, blockers: [{ type: "billing_address_required" }] }));
  await assert.rejects(cart.checkout(input), /The quote isn't ready/);
  assert.equal(calls.length, 0);
  assert.equal(cart.status.get().processing_checkout, false);
});

test("outside a browser a lost checkout keeps no recovery state, and the retry sends the same app-picked order id", async (context) => {
  let accepts = 0;
  const calls = recordFetch(context, (call) => {
    if (call.path !== "/v1/storefront/carts/accept") return placedOrder();
    accepts += 1;
    if (accepts === 1) throw new TypeError("response connection was lost");
    return placedAcceptance();
  });
  const cart = checkoutCart();
  const input = { order_id: ids.order, order_token: "arky_ot_" + "A".repeat(43), contact_email: null, payment: cardPayment() };
  await assert.rejects(cart.checkout(input), /connection was lost/);
  assert.equal(await cart.pendingCheckout(), null);
  assert.deepEqual(await cart.checkout(input), placedAcceptance());
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body?.order_id ?? null]), [
    ["POST", "/v1/storefront/carts/accept", ids.order],
    ["POST", "/v1/storefront/carts/accept", ids.order],
    ["GET", `/v1/storefront/orders/${ids.order}`, null],
  ]);
  assert.equal(cart.last_order.get().order_id, ids.order);
});

test("a refused checkout is propagated once and leaves the cart in place", async (context) => {
  const calls = recordFetch(context, () => errorResponse(422, "CART.NOT_READY", "Pick shipping first"));
  const cart = checkoutCart();
  await assert.rejects(cart.checkout({ order_id: ids.order, order_token: "arky_ot_" + "A".repeat(43), contact_email: null, payment: cardPayment() }), (error) => error.statusCode === 422 && error.code === "CART.NOT_READY");
  assert.equal(calls.length, 1);
  assert.equal(cart.cart.get().id, ids.cart);
  assert.equal(cart.last_order.get(), null);
  assert.deepEqual(cart.status.get().error, { code: "CART.NOT_READY", message: "Pick shipping first" });
});

test("a card checkout hands back the embedded Stripe action without navigating", async (context) => {
  const action = { type: "stripe_embedded_checkout", publishable_key: "pk_test_order", client_secret: "cs_order_secret_exact", expires_at: 1_800_000_000_000 };
  recordFetch(context, (call) => call.path === "/v1/storefront/carts/accept" ? placedAcceptance({ payment_id: ids.payment, payment_action: action }) : placedOrder());
  const cart = checkoutCart();
  const answer = await cart.checkout({ order_id: ids.order, order_token: "arky_ot_" + "A".repeat(43), contact_email: null, payment: cardPayment() });
  assert.deepEqual(answer.payment_action, action);
  assert.equal("account_id" in answer.payment_action, false);
  assert.deepEqual(cart.last_order.get().payment_action, action);
  assert.equal(cart.last_order.get().payment_id, ids.payment);
});

test("payment resume asks the placed order for its payment action, and payments are read exactly", async (context) => {
  const calls = recordFetch(context, (call) => call.path.endsWith("/payment-action") ? { type: "none" } : call.path.endsWith("/payments") ? [] : { id: ids.payment });
  const store = initialize(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, sessionStorage: visitorStorage() });
  assert.deepEqual(await store.eshop.order.resumePayment({ order_id: ids.order }), { type: "none" });
  await store.eshop.order.getPayment({ order_id: ids.order, payment_id: ids.payment });
  assert.deepEqual(await store.eshop.order.findPayments({ order_id: ids.order }), { items: [], cursor: null });
  assert.deepEqual(calls.map((call) => [call.method, call.path, call.body]), [
    ["POST", `/v1/storefront/orders/${ids.order}/payment-action`, null],
    ["GET", `/v1/storefront/orders/${ids.order}/payments/${ids.payment}`, null],
    ["GET", `/v1/storefront/orders/${ids.order}/payments`, null],
  ]);
  assert.ok(calls.every((call) => call.headers.get("authorization") === `Bearer ${visitorToken}`));
  assert.equal("checkout" in createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl }).eshop, false);
});
