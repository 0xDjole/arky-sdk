#!/usr/bin/env node
import assert from "node:assert/strict";
import test from "node:test";

import { initialize as initializeFromRoot } from "../dist/index.js";
import {
  createStripeConfirmationTokenController,
  initialize,
} from "../dist/storefront.js";

const apiUrl = "https://api.example.test";
const publishableKey = `arky_pk_${"c".repeat(43)}`;
const visitorToken = `arky_vst_${"c".repeat(64)}`;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function sessionStorage(token = visitorToken) {
  const values = new Map();
  let initial = token;
  return {
    getItem: (key) => values.get(key) ?? initial,
    setItem(key, value) {
      initial = null;
      values.set(key, value);
    },
    removeItem(key) {
      initial = null;
      values.delete(key);
    },
  };
}

function setup() {
  return {
    timezone: "Europe/Rome",
    languages: { default: "it", available: ["it", "en"] },
    markets: {
      default: "ita",
      available: [
        {
          id: "market-ita",
          key: "ita",
          currency: "EUR",
          tax_mode: "inclusive",
          payment_methods: [
            { id: "payment-card", key: "credit_card", type: "credit_card" },
          ],
          zones: [],
        },
      ],
    },
    support: { email: "support@example.test" },
    payment: {
      provider: "stripe",
      publishable_key: "pk_test_store_owned",
      connected_account_id: "acct_store_owned",
    },
    readiness: { market: true, payment: true, commerce: true },
  };
}

function cartSnapshot(itemCount = 0) {
  return {
    id: "cart-contract",
    contact_id: "contact-contract",
    token: "cart-token",
    status: "active",
    origin: "storefront",
    market: "ita",
    items: [],
    shipping_address: null,
    billing_address: null,
    forms: [],
    promo_code: null,
    payment_method_key: "cash",
    shipping_method_id: null,
    quote_snapshot: {
      charge_amount: 1250,
      total: 1250,
      money: { total: 1250, currency: "EUR", payment_method_key: "cash" },
    },
    converted_order_id: null,
    item_count: itemCount,
    last_action_at: 1,
    created_at: 1,
    updated_at: 1,
  };
}

test("initialize is the production root API and exposes the module facade without legacy Store switching", () => {
  const rootStore = initializeFromRoot(publishableKey, { locale: "it" });
  const store = initialize(publishableKey, { locale: "it", market: "ita" });

  assert.equal(typeof rootStore.cms.entry.get, "function");
  assert.equal(typeof store.eshop.cart.load, "function");
  assert.equal(typeof store.eshop.cart.payment.mount, "function");
  assert.equal("mountStripe" in store.eshop.cart.payment, false);
  assert.equal(typeof store.setContext, "function");
  assert.equal(typeof store.withContext, "function");
  assert.equal("getStoreId" in store, false);
  assert.equal("forStore" in store, false);
  assert.equal("marketForLocale" in store, false);
  assert.equal(store.session.get(), null);
  assert.equal(store.isAuthenticated, false);

  const scoped = store.withContext({ locale: "en" });
  assert.equal(store.getLocale(), "it");
  assert.equal(store.getMarket(), "ita");
  assert.equal(scoped.getLocale(), "en");
  assert.equal(scoped.getMarket(), "ita");
});

test("market and locale remain independent and a populated cart fails closed on market changes", () => {
  const store = initialize(publishableKey, { locale: "it", market: "ita" });
  store.setContext({ locale: "en" });
  assert.equal(store.getLocale(), "en");
  assert.equal(store.getMarket(), "ita");

  store.eshop.cart.cart.set(cartSnapshot(1));
  assert.throws(
    () => store.setContext({ market: "bih" }),
    (error) => error.code === "CART_MARKET_LOCKED",
  );
  assert.equal(store.getMarket(), "ita");
  assert.equal(store.eshop.cart.cart.get().id, "cart-contract");
});

test("Stripe payment mount loads Store setup and never accepts caller-owned Stripe identifiers", async () => {
  const store = initialize(publishableKey, { apiUrl, market: "ita" });
  let setupCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    assert.equal(String(url), `${apiUrl}/v1/storefront`);
    setupCalls += 1;
    return jsonResponse(setup());
  };

  try {
    await assert.rejects(
      store.eshop.cart.payment.mount("#payment", { amount: 1250 }),
      /amount and currency must be supplied together/,
    );
    await assert.rejects(
      store.eshop.cart.payment.mount("#payment", { currency: "EUR" }),
      /amount and currency must be supplied together/,
    );
    assert.equal(setupCalls, 1);
    assert.deepEqual(store.store.setup.get(), setup());
    assert.equal(store.payment_config.get().provider.publishable_key, "pk_test_store_owned");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("high-level checkout uses keyless routes, visitor authorization, and Store-ID-free bodies", async () => {
  const store = initialize(publishableKey, {
    apiUrl,
    market: "ita",
    locale: "it",
    sessionStorage: sessionStorage(),
  });
  const cart = cartSnapshot(1);
  store.eshop.cart.cart.set(cart);
  store.eshop.cart.product_items.set([
    {
      id: "line-contract",
      product_id: "product-contract",
      variant_id: "variant-contract",
      product_name: "Contract product",
      product_slug: "contract-product",
      variant_attributes: {},
      requires_shipping: false,
      price: { amount: 1250, currency: "EUR", market: "ita" },
      quantity: 1,
      added_at: 1,
    },
  ]);
  const order = {
    order_id: "order-contract",
    number: "1001",
    payment_action: { type: "none" },
    payment: {
      status: { status: "captured", at: 1, amount: 1250 },
      amount: 1250,
      currency: "EUR",
      paid: 1250,
      method_type: "cash",
    },
  };
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      body: init.body ? JSON.parse(String(init.body)) : null,
      headers: new Headers(init.headers),
    });
    return String(url).endsWith("/checkout")
      ? jsonResponse(order)
      : jsonResponse(cart);
  };

  try {
    assert.deepEqual(
      await store.eshop.cart.checkout({ payment_method_key: "cash" }),
      order,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(
    calls.map((call) => call.url),
    [
      `${apiUrl}/v1/storefront/carts/cart-contract`,
      `${apiUrl}/v1/storefront/carts/cart-contract/checkout`,
    ],
  );
  for (const call of calls) {
    assert.equal(call.headers.get("authorization"), `Bearer ${visitorToken}`);
    assert.equal(call.headers.get("x-arky-publishable-key"), publishableKey);
    assert.equal(JSON.stringify(call.body).includes("store_id"), false);
    assert.equal("market" in call.body, false);
  }
});

test("checkout POSTs once and waits on its exact order payment", async () => {
  const store = initialize(publishableKey, {
    apiUrl,
    market: "ita",
    sessionStorage: sessionStorage(),
  });
  const cart = cartSnapshot(1);
  store.eshop.cart.cart.set(cart);
  store.eshop.cart.product_items.set([
    {
      id: "line-scheduled",
      product_id: "product-scheduled",
      variant_id: "variant-scheduled",
      product_name: "Scheduled product",
      product_slug: "scheduled-product",
      variant_attributes: {},
      requires_shipping: false,
      price: { amount: 1250, currency: "EUR", market: "ita" },
      quantity: 1,
      added_at: 1,
    },
  ]);
  let checkoutCalls = 0;
  let paymentObservationCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const target = String(url);
    if (target.endsWith("/orders/order-scheduled/payment")) {
      paymentObservationCalls += 1;
      return jsonResponse({
        status: { status: "captured", at: 2, amount: 1250 },
        payment_action: { type: "none" },
        amount: 1250,
        currency: "EUR",
        paid: 1250,
        method_type: "credit_card",
      });
    }
    if (!target.endsWith("/checkout")) {
      return jsonResponse(cart);
    }
    assert.equal(init.method, "POST");
    checkoutCalls += 1;
    return jsonResponse({
      order_id: "order-scheduled",
      number: "1002",
      payment_action: { type: "none" },
      payment: {
        status: { status: "processing", at: 1 },
        amount: 1250,
        currency: "EUR",
        paid: 0,
        method_type: "credit_card",
      },
    });
  };

  try {
    const result = await store.eshop.cart.checkout({
      payment_method_key: "cash",
    });
    assert.equal(result.payment.status.status, "captured");
    assert.equal(checkoutCalls, 1);
    assert.equal(paymentObservationCalls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("the standalone Stripe controller still uses only setup-derived provider values from its caller", async () => {
  const loads = [];
  const elementsOptions = [];
  const fakeElements = {
    create() {
      return { mount() {}, destroy() {} };
    },
    update() {},
    async submit() {
      return {};
    },
  };
  const fakeStripe = {
    elements(options) {
      elementsOptions.push(options);
      return fakeElements;
    },
    async createConfirmationToken() {
      return { confirmationToken: { id: "ct_contract" } };
    },
    async handleNextAction() {
      return {};
    },
  };
  const controller = await createStripeConfirmationTokenController(
    {
      publishableKey: "pk_test_store_owned",
      connectedAccountId: "acct_store_owned",
      amount: 1250,
      currency: "EUR",
      setupFutureUsage: "off_session",
    },
    async (key, options) => {
      loads.push([key, options]);
      return fakeStripe;
    },
  );
  assert.deepEqual(loads, [
    ["pk_test_store_owned", { stripeAccount: "acct_store_owned" }],
  ]);
  assert.deepEqual(elementsOptions, [
    {
      mode: "payment",
      amount: 1250,
      currency: "eur",
      paymentMethodCreation: "manual",
      setupFutureUsage: "off_session",
    },
  ]);
  controller.destroy();
});
