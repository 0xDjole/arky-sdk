import assert from "node:assert/strict";
import test from "node:test";

import { CheckoutFlowError, initialize } from "../dist/storefront.js";
import { ExclusiveLockManager, MemoryStorage } from "./helpers/durable-request-fixtures.mjs";
import {
  apiUrl,
  cartRecord,
  emailSession,
  errorResponse,
  factoryId,
  ids,
  idFactories,
  idSequence,
  installGlobal,
  placedAcceptance,
  placedOrder,
  publishableKey,
  quoteRecord,
  recordFetch,
  SessionStorage,
  sessionResult,
  signedInStorage,
  visitorSession,
  visitorStorage,
} from "./helpers/arky-fixtures.mjs";

const customer = { type: "customer" };
const profile = "1b3d5f7a-9c2e-4a6b-8d0f-2e4a6c8e0b1d";
const address = { name: "Ana", company: null, street1: "Main 1", street2: null, city: "Zagreb", state: null, postal_code: "10000", country: "HR", phone: null, email: "ana@example.test" };
const offer = {
  shipping_method_id: ids.paymentOption,
  shipping_method_key: "courier",
  shipping_method_blocks: [],
  rate_id: ids.otherPaymentOption,
  amount: 500,
  free_shipping_applied: false,
  delivery_estimate: null,
};
const line = { type: "product", id: ids.line, variant_id: ids.variant, quantity: 1, form_submission_id: null, purchase: { type: "catalog", catalog_item_price_id: ids.price } };
const ana = { email: "ana@example.test", language: "en" };
const refreshedAccess = `customer_access_${"n".repeat(64)}`;
const quoteLine = { type: "product", line_item_id: ids.line, product_id: ids.product, variant_id: ids.variant, quantity: 1, snapshot: { fulfillment: { type: "physical" } } };

function browser(context) {
  installGlobal(context, "window", globalThis);
  installGlobal(context, "localStorage", new MemoryStorage());
  installGlobal(context, "navigator", { locks: new ExclusiveLockManager() });
}

function quoteFor(cart) {
  const group = cart.delivery_groups[0];
  if (!group) {
    return quoteRecord({ ready: false, lines: [quoteLine], blockers: [{ type: "units_without_delivery", line_item: { type: "product", line_item_id: ids.line }, quantity: 1 }] });
  }
  const delivery = {
    delivery_group_id: group.id,
    destination: group.destination,
    shipping_profile_id: profile,
    items: [],
    rental_entitlements: [],
    timing: { type: "asap" },
    offers: [offer],
    unavailable: [],
    shipping: group.shipping,
    delivery_estimate: null,
    money: null,
  };
  if (!group.shipping) {
    return quoteRecord({ ready: false, lines: [quoteLine], deliveries: [delivery], blockers: [{ type: "shipping_required", delivery_group_id: group.id }] });
  }
  return quoteRecord({ ready: true, lines: [quoteLine], deliveries: [delivery], blockers: [] });
}

function payment(status) {
  return {
    id: ids.payment,
    store_id: ids.store,
    order_id: ids.order,
    payment_option_id: ids.paymentOption,
    money: { amount: 3000, currency: "eur" },
    type: { type: "stripe_checkout", return_url: "https://shop.example.test", expires_at: 1, status: { type: status }, refunds: [], disputes: [] },
    holds: [],
    status,
    status_revision: "1",
    created_at: 1,
    updated_at: 1,
  };
}

function server(context, accept, paymentStatus = "paid", readPayment = () => payment(paymentStatus), cart = cartRecord({ line_items: [line] })) {
  let current = cart;
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront") return { name: "Shop", timezone: "Europe/Zagreb", languages: ["en"], payment_options: [], bot_check: { type: "off" } };
    if (call.path === "/v1/storefront/markets/by-key/hrv") return { id: ids.market, key: "hrv", currency: "eur", payment_option_ids: [ids.paymentOption] };
    if (call.path === "/v1/storefront/customer/refresh") {
      return sessionResult(ids.customer, emailSession(ids.customer, ids.otherSession, { access_token: refreshedAccess }));
    }
    if (call.path === "/v1/storefront/customer/identify") {
      return sessionResult(call.body.customer_id, visitorSession(call.body.customer_id, call.body.session_id, `customer_visitor_${"w".repeat(64)}`));
    }
    if (call.path === "/v1/storefront/carts") return { type: "created", cart: current, recovery_token: "token" };
    if (call.method === "GET" && call.path === `/v1/storefront/carts/${ids.cart}`) return current;
    if (call.method === "PUT" && call.path === `/v1/storefront/carts/${ids.cart}`) {
      current = {
        ...current,
        updated_at: current.updated_at + 1,
        delivery_groups: call.body.delivery_groups ?? current.delivery_groups,
        promotion_code_ids: call.body.promotion_codes ? call.body.promotion_codes.map(() => ids.credit) : current.promotion_code_ids,
      };
      return current;
    }
    if (call.path === `/v1/storefront/carts/${ids.cart}/quote`) {
      if (current.promotion_code_ids.length > 0 && call.body.contact_email === undefined) {
        return errorResponse(409, "CART.PROMOTION_EMAIL_REQUIRED", "An email is required for this promotion's per-buyer limit");
      }
      return quoteFor(current);
    }
    if (call.path.includes("/variants/")) {
      return {
        id: ids.variant,
        product_id: ids.product,
        sku: null,
        blocks: [],
        fulfillment: { type: "physical", shipping_profile_id: profile, inventory_requirements: [], backorder: { type: "disallow" } },
        tax_category_id: ids.paymentOption,
        status: { type: "active" },
        catalog_item_id: ids.catalogItem,
        price: null,
      };
    }
    if (call.path === "/v1/storefront/carts/accept") return accept(call);
    if (call.path === `/v1/storefront/orders/${ids.order}`) return placedOrder();
    if (call.path === `/v1/storefront/orders/${ids.order}/payments/${ids.payment}`) return readPayment();
    throw new Error(`Unexpected request ${call.method} ${call.path}`);
  });
  return calls;
}

async function readyCheckout(sessionStorage = visitorStorage(), openedContact = null) {
  const arky = initialize(publishableKey, {
    ...idFactories,
    createId: idSequence(factoryId(1), ids.order),
    createOrderToken: () => `arky_ot_${"C".repeat(42)}A`,
    apiUrl,
    locale: "en",
    market: "hrv",
    sessionStorage,
  });
  const checkout = arky.eshop.checkoutFlow({ buyer: customer, catalog_id: ids.catalog });
  assert.equal(arky.eshop.checkoutFlow({ catalog_id: ids.catalog }), checkout);
  await checkout.cart.create({ id: ids.cart });
  checkout.cart.reset();
  let state = await checkout.open();
  assert.equal(state.step, "details");
  assert.deepEqual(state.contact_email, openedContact);
  assert.throws(() => checkout.setContact({ contact_email: { email: " ", language: "en" } }), (error) => error instanceof CheckoutFlowError && error.code === "not_ready");
  assert.throws(() => checkout.setContact({ contact_email: { email: "ana@example.test", language: " " } }), (error) => error instanceof CheckoutFlowError && error.code === "not_ready");
  checkout.setContact({ contact_email: { email: " ana@example.test ", language: " en " } });
  state = await checkout.shipTo({ destination: { type: "delivery", address } });
  assert.equal(state.step, "shipping");
  assert.equal(state.cart.delivery_groups[0].id, factoryId(1));
  state = await checkout.selectShipping({ delivery_group_id: factoryId(1), shipping_method_id: offer.shipping_method_id, rate_id: offer.rate_id });
  assert.equal(state.step, "payment");
  assert.equal(state.payment_option_id, ids.paymentOption);
  return { arky, checkout };
}

test("the headless checkout walks details, shipping and payment, then places with factory ids", async (context) => {
  browser(context);
  const calls = server(context, () => placedAcceptance({ payment_id: ids.payment }));
  const { checkout } = await readyCheckout();
  const state = await checkout.place({ return_url: (orderId) => `https://shop.example.test/order/${orderId}` });
  assert.equal(state.step, "placed");
  assert.equal(state.outcome, "paid");
  assert.equal(state.placed.order_id, ids.order);
  assert.equal(state.pending, null);
  assert.equal(state.error, null);
  const accept = calls.find((call) => call.path === "/v1/storefront/carts/accept");
  assert.equal(accept.body.order_id, ids.order);
  assert.equal(accept.body.order_token, `arky_ot_${"C".repeat(42)}A`);
  assert.deepEqual(accept.body.contact_email, ana);
  assert.deepEqual(accept.body.payment, {
    type: "payment_option",
    payment_option_id: ids.paymentOption,
    return_url: `https://shop.example.test/order/${ids.order}`,
    save_payment_method: false,
    payment_method_terms: null,
  });
  await assert.rejects(checkout.selectShipping({ delivery_group_id: factoryId(9), shipping_method_id: offer.shipping_method_id, rate_id: offer.rate_id }), (error) => {
    assert.ok(error instanceof CheckoutFlowError);
    assert.equal(error.code, "not_ready");
    return true;
  });
});

test("a lost checkout answer leaves a pending checkout that recover places with the same order", async (context) => {
  browser(context);
  let lose = true;
  const calls = server(context, () => {
    if (lose) {
      lose = false;
      throw new TypeError("Lost response");
    }
    return placedAcceptance({ payment_id: ids.payment });
  });
  const { checkout } = await readyCheckout();
  await assert.rejects(checkout.place(), (error) => error instanceof CheckoutFlowError && error.code === "interrupted");
  let state = checkout.state.get();
  assert.equal(state.step, "paying");
  assert.equal(state.pending.order_id, ids.order);
  assert.equal(state.error.code, "interrupted");
  await assert.rejects(checkout.place(), (error) => error instanceof CheckoutFlowError && error.code === "pending");
  state = await checkout.recover();
  assert.equal(state.step, "placed");
  assert.equal(state.pending, null);
  const accepts = calls.filter((call) => call.path === "/v1/storefront/carts/accept");
  assert.equal(accepts.length, 2);
  assert.deepEqual(accepts[0].body, accepts[1].body);
});

test("a changed presentation is a typed checkout error and shows the new quote", async (context) => {
  browser(context);
  const changed = quoteRecord({ presentation_digest: "e".repeat(64), totals: { subtotal: 2600, delivery: 500, discount: 0, tax: 0, total: 3100 } });
  server(context, () => new Response(JSON.stringify({ message: "Review", error: "COMMERCE.PRESENTATION_CHANGED", status_code: 409, validation_errors: [], quote: changed }), { status: 409, headers: { "content-type": "application/json" } }));
  const { checkout } = await readyCheckout();
  await assert.rejects(checkout.place(), (error) => error instanceof CheckoutFlowError && error.code === "presentation_changed");
  const state = checkout.state.get();
  assert.equal(state.quote.presentation_digest, "e".repeat(64));
  assert.equal(state.pending, null);
  assert.equal(state.placed, null);
});

test("a signed-in shopper's token refresh while placing keeps the checkout and reaches placed", async (context) => {
  browser(context);
  const calls = server(context, (call) =>
    call.headers.get("authorization") === `Bearer ${refreshedAccess}`
      ? placedAcceptance({ payment_id: ids.payment })
      : errorResponse(401, "GENERAL.UNAUTHENTICATED", "The access token expired"),
  );
  const { arky, checkout } = await readyCheckout(signedInStorage(), { email: "customer@example.test", language: "en" });
  const state = await checkout.place();
  assert.equal(state.step, "placed");
  assert.equal(state.error, null);
  assert.equal(state.placed.order_id, ids.order);
  assert.equal(arky.client.session.id, ids.otherSession);
  assert.equal(checkout.cart.last_order.get().order_id, ids.order);
  const accepts = calls.filter((call) => call.path === "/v1/storefront/carts/accept");
  assert.equal(accepts.length, 2);
  assert.deepEqual(accepts[0].body, accepts[1].body);
  assert.equal(calls.filter((call) => call.path === "/v1/storefront/customer/refresh").length, 1);
});

for (const change of ["shopper", "market"]) {
  test(`changing the ${change} clears the previous checkout contact and placed order`, async (context) => {
    browser(context);
    server(context, () => placedAcceptance({ payment_id: ids.payment }));
    const { arky, checkout } = await readyCheckout();
    await checkout.place();
    assert.deepEqual(checkout.state.get().contact_email, ana);
    assert.equal(checkout.state.get().placed.order_id, ids.order);
    if (change === "shopper") {
      await arky.customer.identify({ customer_id: ids.otherCustomer, session_id: ids.otherSession });
    } else {
      arky.setContext({ market: "other-market" });
    }
    const state = checkout.state.get();
    assert.equal(state.step, "cart");
    assert.equal(state.cart, null);
    assert.equal(state.quote, null);
    assert.equal(state.contact_email, null);
    assert.equal(state.destination, null);
    assert.equal(state.billing_address, null);
    assert.equal(state.payment_option_id, null);
    assert.equal(state.pending, null);
    assert.equal(state.placed, null);
    assert.equal(state.payment, null);
    assert.equal(state.outcome, null);
    assert.equal(state.error, null);
    assert.equal(state.busy, false);
  });
}

test("opening the first checkout identifies its visitor once before loading the cart", async (context) => {
  browser(context);
  const calls = server(context, () => placedAcceptance({ payment_id: ids.payment }));
  const arky = initialize(publishableKey, { ...idFactories, apiUrl, locale: "en", market: "hrv", sessionStorage: new SessionStorage() });
  const checkout = arky.eshop.checkoutFlow({ buyer: customer, catalog_id: ids.catalog });
  const state = await checkout.open();
  assert.equal(state.step, "cart");
  assert.equal(state.cart, null);
  assert.equal(state.contact_email, null);
  assert.equal(state.error, null);
  assert.equal(arky.session.get().customer.id, ids.customer);
  assert.equal(calls.filter((call) => call.path === "/v1/storefront/customer/identify").length, 1);
});

test("a payment read finishing after the shopper changes cannot restore the previous checkout", async (context) => {
  browser(context);
  let enter;
  let release;
  let delay = false;
  const started = new Promise((resolve) => { enter = resolve; });
  const waiting = new Promise((resolve) => { release = resolve; });
  server(context, () => placedAcceptance({ payment_id: ids.payment }), "paid", async () => {
    if (delay) {
      enter();
      await waiting;
    }
    return payment("paid");
  });
  const { arky, checkout } = await readyCheckout();
  await checkout.place();
  delay = true;
  const reading = checkout.refreshPayment();
  await started;
  await arky.customer.identify({ customer_id: ids.otherCustomer, session_id: ids.otherSession });
  release();
  await assert.rejects(reading, (error) => error instanceof CheckoutFlowError && error.code === "interrupted");
  const state = checkout.state.get();
  assert.equal(state.contact_email, null);
  assert.equal(state.placed, null);
  assert.equal(state.payment, null);
  assert.equal(state.error, null);
  assert.equal(state.busy, false);
});

test("a guest's quotes carry the contact email, so a promotion code capped per buyer quotes and places", async (context) => {
  browser(context);
  const calls = server(context, () => placedAcceptance({ payment_id: ids.payment }));
  const { checkout } = await readyCheckout();
  let state = await checkout.setPromotionCodes({ promotion_codes: ["ONCE"] });
  assert.equal(state.error, null);
  assert.equal(state.step, "payment");
  state = await checkout.place();
  assert.equal(state.step, "placed");
  const quotes = calls.filter((call) => call.path.endsWith("/quote"));
  assert.deepEqual(quotes.map((call) => call.body.contact_email ?? null), [null, "ana@example.test", "ana@example.test", "ana@example.test", "ana@example.test"]);
});

test("a taken booking slot or a purchase limit shows on the cart step, not the shipping step", () => {
  const arky = initialize(publishableKey, { ...idFactories, apiUrl, locale: "en", market: "hrv", sessionStorage: visitorStorage() });
  const checkout = arky.eshop.checkoutFlow({ buyer: customer, catalog_id: ids.catalog });
  checkout.cart.cart.set(cartRecord({ line_items: [line] }));
  checkout.setContact({ contact_email: ana });
  for (const blocker of [
    { type: "booking_unavailable", line_item_id: ids.line, code: "BOOKING.SLOT_TAKEN" },
    { type: "purchase_limit_exceeded", line_item_id: ids.line, limit_id: ids.product },
  ]) {
    checkout.cart.quote_result.set(quoteRecord({ ready: false, blockers: [blocker] }));
    assert.equal(checkout.state.get().step, "cart", blocker.type);
  }
  checkout.cart.quote_result.set(quoteRecord({ ready: false, blockers: [{ type: "shipping_required", delivery_group_id: ids.otherCart }] }));
  assert.equal(checkout.state.get().step, "shipping");
});

test("a card payment whose outcome is unknown ends the flow as placed and unconfirmed instead of waiting forever", async (context) => {
  browser(context);
  server(context, () => placedAcceptance({ payment_id: ids.payment }), "unknown");
  const { checkout } = await readyCheckout();
  const state = await checkout.place();
  assert.equal(state.step, "placed");
  assert.equal(state.outcome, "unconfirmed");
});

test("the flow keeps its checkout in its own cart scope, so the client's shared slot stays free", async (context) => {
  const storage = new MemoryStorage();
  installGlobal(context, "window", globalThis);
  installGlobal(context, "localStorage", storage);
  installGlobal(context, "navigator", { locks: new ExclusiveLockManager() });
  let lose = true;
  server(context, () => {
    if (lose) {
      lose = false;
      throw new TypeError("Lost response");
    }
    return placedAcceptance({ payment_id: ids.payment });
  });
  const { arky, checkout } = await readyCheckout();
  await assert.rejects(checkout.place(), (error) => error instanceof CheckoutFlowError && error.code === "interrupted");
  const shared = `arky:cart-checkout:v5:${encodeURIComponent(`storefront:${apiUrl}:${publishableKey}`)}`;
  assert.equal(storage.getItem(shared), null);
  assert.ok(storage.getItem(`${shared}:${encodeURIComponent(`customer|${ids.catalog}`)}`));
  assert.equal(await arky.client.eshop.cart.pendingCheckout(), null);
  assert.equal((await arky.client.eshop.cart.pendingCheckout({ scope: { buyer: customer, catalog_id: ids.catalog } })).order_id, ids.order);
  assert.equal((await checkout.recover()).step, "placed");
});

test("opening the checkout starts from the billing email in the store's locale, and a contact the shopper set wins", async (context) => {
  browser(context);
  const billed = cartRecord({ line_items: [line], billing_address: { ...address, email: " billing@example.test " } });
  const calls = server(context, () => placedAcceptance(), "paid", () => payment("paid"), billed);
  const arky = initialize(publishableKey, { ...idFactories, apiUrl, locale: "hr", market: "hrv", sessionStorage: visitorStorage() });
  const checkout = arky.eshop.checkoutFlow({ buyer: customer, catalog_id: ids.catalog });
  await checkout.cart.create({ id: ids.cart });
  checkout.cart.reset();
  let state = await checkout.open();
  assert.deepEqual(state.contact_email, { email: "billing@example.test", language: "hr" });
  checkout.setContact({ contact_email: ana });
  state = await checkout.open();
  assert.deepEqual(state.contact_email, ana);
  assert.equal(calls.filter((call) => call.path.endsWith("/quote")).at(-1).body.contact_email, "ana@example.test");
});
