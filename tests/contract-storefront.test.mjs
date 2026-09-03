#!/usr/bin/env node
import assert from "node:assert/strict";
import test from "node:test";

import { initialize as initializeFromRoot } from "../dist/index.js";
import { createStorefront, initialize } from "../dist/storefront.js";

const apiUrl = "https://api.example.test";
const publishableKey = `arky_pk_${"c".repeat(43)}`;
const visitorToken = `customer_visitor_${"c".repeat(64)}`;
const cashOnDeliveryProviderId = "provider-cash-on-delivery";
const stripeProviderId = "provider-stripe";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function sessionStorage(token = visitorToken) {
  const values = new Map();
  let initial = JSON.stringify({
    version: 1,
    customer: {
      id: "customer-contract",
      status: "active",
      identities: [],
      classifications: [],
      created_at: 1,
      updated_at: 1,
    },
    session: {
      id: "visitor-session-contract",
      customer_id: "customer-contract",
      type: "visitor",
      token,
      status: "active",
      expires_at: 10_000,
    },
  });
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
          payment_provider_ids: [
            cashOnDeliveryProviderId,
            stripeProviderId,
          ],
          zones: [],
        },
      ],
    },
    support: { email: "support@example.test" },
    readiness: { market: true, payment: true, commerce: true },
  };
}

function cartSnapshot(itemCount = 0) {
  return {
    id: "cart-contract",
    customer_id: "customer-contract",
    customer_session_id: "customer-session-contract",
    token: "cart-token",
    status: "active",
    origin: "storefront",
    created_by_account_id: null,
    market: "ita",
    product_items: [],
    booking_items: [],
    digital_items: [],
    shipping_address: null,
    billing_address: null,
    promo_code: null,
    payment_provider_id: cashOnDeliveryProviderId,
    shipping_method_id: null,
    converted_order_id: null,
    item_count: itemCount,
    last_action_at: 1,
    abandoned_at: null,
    created_at: 1,
    updated_at: 1,
  };
}

function payment(status, providerType = "cash_on_delivery", total = 1250) {
  const paymentProviderId =
    providerType === "stripe" ? stripeProviderId : cashOnDeliveryProviderId;
  return {
    id: "payment-contract",
    order_id: "order-contract",
    provider:
      providerType === "stripe"
        ? {
            type: "stripe",
            payment_provider_id: paymentProviderId,
            checkout_expires_at: 1_800_000_000,
            checkout_session_id: "checkout-contract",
            payment_intent_id: "payment-intent-contract",
          }
        : {
            type: "cash_on_delivery",
            payment_provider_id: paymentProviderId,
            marked_paid_by_account_id:
              status === "paid" ? "account-operator" : null,
          },
    status,
    amounts: {
      currency: "eur",
      total,
      paid: status === "paid" ? total : 0,
      refund_pending: 0,
      refunded: 0,
    },
    requested_at: 1,
    completed_at: status === "paid" ? 2 : null,
    created_at: 1,
    updated_at: 2,
    safe_error: null,
  };
}

function checkoutStore() {
  const store = initialize(publishableKey, {
    apiUrl,
    market: "ita",
    sessionStorage: sessionStorage(),
  });
  const cart = cartSnapshot(1);
  store.eshop.cart.cart.set(cart);
  store.eshop.cart.product_items.set([
    {
      id: "line-retry",
      product_id: "product-retry",
      variant_id: "variant-retry",
      product_name: "Retry product",
      product_slug: "retry-product",
      variant_attributes: {},
      requires_shipping: false,
      price: { amount: 1250, currency: "EUR", market: "ita" },
      quantity: 1,
      added_at: 1,
    },
  ]);
  return { store, cart };
}

function completedCheckout() {
  return {
    order_id: "order-retry",
    number: "1005",
    payment_action: { type: "none" },
    payment: payment("paid"),
  };
}

test("initialize is the production root API and exposes the module facade without Store switching", () => {
  const rootStore = initializeFromRoot(publishableKey, { locale: "it" });
  const store = initialize(publishableKey, { locale: "it", market: "ita" });

  assert.equal(typeof rootStore.content.entry.get, "function");
  assert.equal(typeof rootStore.media.findByIds, "function");
  assert.equal(typeof rootStore.content.entry.findByIds, "function");
  assert.equal(typeof rootStore.forms.get, "function");
  assert.equal(typeof rootStore.forms.submitByKey, "function");
  assert.equal(typeof rootStore.actions.track, "function");
  assert.equal(typeof rootStore.classification.get, "function");
  assert.equal("classification" in rootStore.content, false);
  assert.equal("cms" in rootStore, false);
  assert.equal("crm" in rootStore, false);
  assert.equal(typeof store.eshop.cart.load, "function");
  assert.equal("payment" in store.eshop.cart, false);
  assert.equal(typeof store.setContext, "function");
  assert.equal(typeof store.withContext, "function");
  assert.equal("getStoreId" in store, false);
  assert.equal("forStore" in store, false);
  assert.equal("marketForLocale" in store, false);
  assert.equal("checkContentAccess" in store.audiences, false);
  assert.equal(store.session.get(), null);
  assert.equal(store.isAuthenticated, false);

  const scoped = store.withContext({ locale: "en" });
  assert.equal(store.getLocale(), "it");
  assert.equal(store.getMarket(), "ita");
  assert.equal(scoped.getLocale(), "en");
  assert.equal(scoped.getMarket(), "ita");
});

test("storefront reference batches use explicit typed endpoints", async () => {
  const storefront = createStorefront(publishableKey, { apiUrl });
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method || "GET" });
    return jsonResponse({ items: [], cursor: null });
  };

  try {
    await storefront.media.findByIds({ ids: ["media-1", "media-2"] });
    await storefront.content.entry.findByIds({ ids: ["entry-1"] });
    await storefront.eshop.product.find({ ids: ["product-1"] });
    await storefront.eshop.digital.find({ ids: ["digital-1"] });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(calls.length, 4);
  assert.deepEqual(
    calls.map((call) => new URL(call.url).pathname),
    [
      "/v1/storefront/media",
      "/v1/storefront/entries",
      "/v1/storefront/products",
      "/v1/storefront/digital-products",
    ],
  );
  assert.deepEqual(
    calls.map((call) => JSON.parse(new URL(call.url).searchParams.get("ids"))),
    [["media-1", "media-2"], ["entry-1"], ["product-1"], ["digital-1"]],
  );
  assert.ok(calls.every((call) => call.method === "GET"));
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
    payment: payment("paid"),
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
      await store.eshop.cart.checkout({
        payment_provider_id: cashOnDeliveryProviderId,
      }),
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
  assert.equal(calls[0].body.payment_provider_id, cashOnDeliveryProviderId);
  assert.equal(calls[1].body.payment_provider_id, cashOnDeliveryProviderId);
  assert.equal("payment_method_key" in calls[1].body, false);
});

test("zero-total checkout accepts a null payment and clears stale cart state", async () => {
  const { store, cart } = checkoutStore();
  const selectedItems = store.eshop.cart.product_items.get();
  const zeroTotalResult = {
    order_id: "order-zero-total",
    number: "1000",
    payment_action: { type: "none" },
    payment: null,
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) =>
    String(url).endsWith("/checkout")
      ? jsonResponse(zeroTotalResult)
      : jsonResponse(cart);

  try {
    assert.deepEqual(
      await store.eshop.cart.checkout({ product_items: selectedItems }),
      zeroTotalResult,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(store.eshop.cart.cart.get(), null);
  assert.deepEqual(store.eshop.cart.product_items.get(), []);
  assert.deepEqual(store.eshop.cart.last_order.get(), {
    order_id: "order-zero-total",
    number: "1000",
    payment_action: { type: "none" },
    payment: null,
    product_items: selectedItems,
    booking_items: [],
    digital_items: [],
    shipping_address: null,
    billing_address: null,
    total: 0,
    currency: null,
    payment_provider_id: cashOnDeliveryProviderId,
    created_at: store.eshop.cart.last_order.get().created_at,
  });
});

test("checkout failures do not create client-side recovery state", async () => {
  const { store, cart } = checkoutStore();
  const completed = completedCheckout();
  const checkoutInput = {
    payment_provider_id: cashOnDeliveryProviderId,
    product_items: store.eshop.cart.product_items.get(),
  };
  const calls = [];
  let checkoutCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method || "GET" });
    if (!String(url).endsWith("/checkout")) return jsonResponse(cart);
    checkoutCalls += 1;
    if (checkoutCalls === 1) throw new Error("response connection was lost");
    return jsonResponse(completed);
  };

  try {
    await assert.rejects(store.eshop.cart.checkout(checkoutInput));
    assert.deepEqual(await store.eshop.cart.checkout(checkoutInput), completed);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(
    calls.map(({ method, url }) => [method, url]),
    [
      ["PUT", `${apiUrl}/v1/storefront/carts/${cart.id}`],
      ["POST", `${apiUrl}/v1/storefront/carts/${cart.id}/checkout`],
      ["PUT", `${apiUrl}/v1/storefront/carts/${cart.id}`],
      ["POST", `${apiUrl}/v1/storefront/carts/${cart.id}/checkout`],
    ],
  );
  assert.equal(store.eshop.cart.last_order.get().order_id, completed.order_id);
});

test("checkout returns the synchronous POST response without polling", async () => {
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
      return jsonResponse(payment("paid", "stripe"));
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
      payment: payment("processing", "stripe"),
    });
  };

  try {
    const result = await store.eshop.cart.checkout({
      payment_provider_id: cashOnDeliveryProviderId,
    });
    assert.equal(result.payment.status, "processing");
    assert.equal(checkoutCalls, 1);
    assert.equal(paymentObservationCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("storefront order payment lookup is an authenticated exact GET", async () => {
  const storefront = createStorefront(publishableKey, {
    apiUrl,
    sessionStorage: sessionStorage(),
  });
  const observedResult = {
    order_id: "order-exact",
    number: "1003",
    payment_action: { type: "none" },
    payment: payment("unknown", "stripe"),
  };
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method || "GET",
      headers: new Headers(init.headers),
    });
    return jsonResponse(observedResult);
  };

  try {
    assert.deepEqual(
      await storefront.eshop.order.getPayment({ id: "order-exact" }),
      observedResult,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(calls.length, 1);
  assert.equal(
    calls[0].url,
    `${apiUrl}/v1/storefront/orders/order-exact/payment`,
  );
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].headers.get("authorization"), `Bearer ${visitorToken}`);
});

test("paid Audience checkout returns the exact embedded Checkout response without polling", async () => {
  const storefront = createStorefront(publishableKey, {
    apiUrl,
    sessionStorage: sessionStorage(),
  });
  const response = {
    checkout_id: "79a8b7f8-9927-4575-8849-917203778a71",
    publishable_key: "pk_test_audience",
    client_secret: "cs_subscription_secret_exact",
    connected_account_id: "acct_audience",
    expires_at: 1_800_000_000,
  };
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method || "GET",
      body: JSON.parse(String(init.body)),
    });
    return jsonResponse(response);
  };

  try {
    assert.deepEqual(
      await storefront.audiences.checkout({
        audience_id: "audience-paid",
        email: "member@example.test",
        cadence: "monthly",
        return_url: "https://storefront.example.test/audience-return",
      }),
      response,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(calls.length, 1);
  assert.equal(
    calls[0].url,
    `${apiUrl}/v1/storefront/audiences/audience-paid/checkout`,
  );
  assert.equal(calls[0].method, "POST");
  assert.match(
    calls[0].body.request_id,
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
  assert.deepEqual(
    { ...calls[0].body, request_id: "<sdk-owned>" },
    {
      request_id: "<sdk-owned>",
      email: "member@example.test",
      cadence: "monthly",
      return_url: "https://storefront.example.test/audience-return",
    },
  );
});

test("card checkout returns an embedded Stripe action without navigating", async () => {
  const store = initialize(publishableKey, {
    apiUrl,
    market: "ita",
    sessionStorage: sessionStorage(),
  });
  const cart = {
    ...cartSnapshot(1),
    payment_provider_id: stripeProviderId,
  };
  store.eshop.cart.cart.set(cart);
  store.eshop.cart.product_items.set([
    {
      id: "line-hosted",
      product_id: "product-hosted",
      variant_id: "variant-hosted",
      product_name: "Hosted product",
      product_slug: "hosted-product",
      variant_attributes: {},
      requires_shipping: false,
      price: { amount: 1250, currency: "EUR", market: "ita" },
      quantity: 1,
      added_at: 1,
    },
  ]);
  let checkoutCalls = 0;
  let checkoutBody;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    if (!String(url).endsWith("/checkout")) return jsonResponse(cart);
    checkoutCalls += 1;
    checkoutBody = JSON.parse(String(init.body));
    return jsonResponse({
      order_id: "order-hosted",
      number: "1004",
      payment_action: {
        type: "stripe_embedded_checkout",
        publishable_key: "pk_test_order",
        client_secret: "cs_order_secret_exact",
        connected_account_id: "acct_order",
        expires_at: 1_800_000_000,
      },
      payment: payment("requires_action", "stripe"),
    });
  };

  try {
    const result = await store.eshop.cart.checkout({
      payment_provider_id: stripeProviderId,
      return_url: "https://shop.example.test/checkout/complete",
    });
    assert.equal(result.payment_action.type, "stripe_embedded_checkout");
    assert.equal(result.payment_action.client_secret, "cs_order_secret_exact");
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(checkoutCalls, 1);
  assert.deepEqual(checkoutBody, {
    id: cart.id,
    payment_provider_id: stripeProviderId,
    return_url: "https://shop.example.test/checkout/complete",
  });
  assert.equal(store.eshop.cart.cart.get().id, cart.id);
});
