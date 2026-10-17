import assert from "node:assert/strict";
import test from "node:test";

import { CheckoutFlowError, initialize } from "../dist/storefront.js";
import { ExclusiveLockManager, MemoryStorage } from "./helpers/durable-request-fixtures.mjs";
import {
  apiUrl,
  cartRecord,
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
const line = { type: "product", id: ids.line, variant_id: ids.variant, quantity: 1, form_submission_id: null, price_override: null, purchase: { type: "catalog" } };
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

function server(context, accept) {
  let current = cartRecord({ line_items: [line] });
  const calls = recordFetch(context, (call) => {
    if (call.path === "/v1/storefront") return { name: "Shop", timezone: "Europe/Zagreb", languages: ["en"], payment_options: [], bot_check: { type: "off" } };
    if (call.path === "/v1/storefront/markets/by-key/hrv") return { id: ids.market, key: "hrv", currency: "eur", payment_option_ids: [ids.paymentOption] };
    if (call.path === "/v1/storefront/carts") return { type: "created", cart: current, recovery_token: "token" };
    if (call.method === "GET" && call.path === `/v1/storefront/carts/${ids.cart}`) return current;
    if (call.method === "PUT" && call.path === `/v1/storefront/carts/${ids.cart}`) {
      current = { ...current, updated_at: current.updated_at + 1, delivery_groups: call.body.delivery_groups ?? current.delivery_groups };
      return current;
    }
    if (call.path === `/v1/storefront/carts/${ids.cart}/quote`) return quoteFor(current);
    if (call.path.includes("/variants/")) {
      return {
        id: ids.variant,
        product_id: ids.product,
        sku: null,
        blocks: [],
        options: [],
        fulfillment: { type: "physical", shipping_profile_id: profile, inventory_requirements: [], backorder: { type: "disallow" } },
        tax_category_id: ids.paymentOption,
        status: { type: "active" },
        price: null,
      };
    }
    if (call.path === "/v1/storefront/carts/accept") return accept(call);
    if (call.path === `/v1/storefront/orders/${ids.order}`) return placedOrder();
    if (call.path === `/v1/storefront/orders/${ids.order}/payments/${ids.payment}`) return payment("paid");
    throw new Error(`Unexpected request ${call.method} ${call.path}`);
  });
  return calls;
}

async function readyCheckout() {
  const arky = initialize(publishableKey, {
    ...idFactories,
    createId: idSequence(factoryId(1), ids.order),
    createOrderToken: () => `arky_ot_${"C".repeat(42)}A`,
    apiUrl,
    locale: "en",
    market: "hrv",
    sessionStorage: visitorStorage(),
  });
  const checkout = arky.eshop.checkoutFlow({ buyer: customer, catalog_id: ids.catalog });
  assert.equal(arky.eshop.checkoutFlow({ catalog_id: ids.catalog }), checkout);
  await checkout.cart.create({ id: ids.cart });
  checkout.cart.clearLocal();
  let state = await checkout.open();
  assert.equal(state.step, "details");
  assert.equal(state.contact_email, null);
  checkout.setContact(" ana@example.test ");
  state = await checkout.shipTo({ type: "delivery", address });
  assert.equal(state.step, "shipping");
  assert.equal(state.cart.delivery_groups[0].id, factoryId(1));
  state = await checkout.chooseShipping(factoryId(1), { shipping_method_id: offer.shipping_method_id, rate_id: offer.rate_id });
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
  assert.equal(accept.body.contact_email, "ana@example.test");
  assert.deepEqual(accept.body.payment, {
    type: "payment_option",
    payment_option_id: ids.paymentOption,
    return_url: `https://shop.example.test/order/${ids.order}`,
    save_payment_method: false,
    payment_method_terms: null,
  });
  await assert.rejects(checkout.chooseShipping(factoryId(9), { shipping_method_id: offer.shipping_method_id, rate_id: offer.rate_id }), (error) => {
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
