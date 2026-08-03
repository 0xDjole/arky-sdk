#!/usr/bin/env node
import assert from "node:assert/strict";
import test from "node:test";

import { initialize as initializeFromRoot } from "../dist/index.js";
import { createStorefront, initialize } from "../dist/storefront.js";

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
    payment: {
      status: { status: "captured", at: 2, amount: 1250 },
      amount: 1250,
      currency: "EUR",
      paid: 1250,
      method_type: "cash",
    },
  };
}

test("initialize is the production root API and exposes the module facade without legacy Store switching", () => {
  const rootStore = initializeFromRoot(publishableKey, { locale: "it" });
  const store = initialize(publishableKey, { locale: "it", market: "ita" });

  assert.equal(typeof rootStore.cms.entry.get, "function");
  assert.equal(typeof store.eshop.cart.load, "function");
  assert.equal("payment" in store.eshop.cart, false);
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

test("checkout failures do not create client-side recovery state", async () => {
  const { store, cart } = checkoutStore();
  const completed = completedCheckout();
  const checkoutInput = {
    payment_method_key: "cash",
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
    await assert.rejects(
      store.eshop.cart.checkout(checkoutInput),
    );
    assert.deepEqual(
      await store.eshop.cart.checkout(checkoutInput),
      completed,
    );
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
    assert.equal(result.payment.status.status, "processing");
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
  const payment = {
    status: { status: "unknown", at: 2, reason: "Provider outcome unknown" },
    payment_action: { type: "none" },
    amount: 1250,
    currency: "EUR",
    paid: 0,
    method_type: "credit_card",
  };
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method || "GET",
      headers: new Headers(init.headers),
    });
    return jsonResponse(payment);
  };

  try {
    assert.deepEqual(
      await storefront.eshop.order.getPayment({ id: "order-exact" }),
      payment,
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

test("paid contact-list subscribe returns the synchronous POST response without polling", async () => {
  const storefront = createStorefront(publishableKey, {
    apiUrl,
    sessionStorage: sessionStorage(),
  });
  const response = {
    payment_action: {
      type: "stripe_checkout",
      url: "https://checkout.stripe.test/cs_subscription",
      expires_at: 1_800_000_000,
    },
    payment_attempt: {
      plan_id: "plan-paid",
      amount: 900,
      currency: "EUR",
      status: "requires_action",
    },
    membership: {
      id: "membership-paid",
      contact_id: "contact-paid",
      contact_list_id: "list-paid",
      status: "pending",
    },
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
      await storefront.crm.contactList.subscribe({
        id: "list-paid",
        contact_id: "contact-paid",
        price_id: "price-paid",
      }),
      response,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(calls, [
    {
      url: `${apiUrl}/v1/storefront/contact-lists/list-paid/subscribe`,
      method: "POST",
      body: { contact_id: "contact-paid", price_id: "price-paid" },
    },
  ]);
});

test("hosted card checkout redirects without Stripe.js or a payment controller", async () => {
  const store = initialize(publishableKey, {
    apiUrl,
    market: "ita",
    sessionStorage: sessionStorage(),
  });
  const cart = {
    ...cartSnapshot(1),
    payment_method_key: "credit_card",
    quote_snapshot: {
      charge_amount: 1250,
      total: 1250,
      money: {
        total: 1250,
        currency: "EUR",
        payment_method_key: "credit_card",
      },
    },
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
  const redirectUrl = "https://checkout.stripe.test/cs_hosted";
  let assignedUrl = null;
  let checkoutCalls = 0;
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  globalThis.window = {
    location: {
      href: "https://store.test/cart",
      assign(url) {
        assignedUrl = url;
      },
    },
  };
  globalThis.fetch = async (url) => {
    if (!String(url).endsWith("/checkout")) return jsonResponse(cart);
    checkoutCalls += 1;
    return jsonResponse({
      order_id: "order-hosted",
      number: "1004",
      payment_action: {
        type: "stripe_checkout",
        url: redirectUrl,
        expires_at: 1_800_000_000,
      },
      payment: {
        status: { status: "requires_action", at: 1 },
        amount: 1250,
        currency: "EUR",
        paid: 0,
        method_type: "credit_card",
      },
    });
  };

  try {
    const result = await store.eshop.cart.checkout({
      payment_method_key: "credit_card",
    });
    assert.equal(result.payment_action.type, "stripe_checkout");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }

  assert.equal(checkoutCalls, 1);
  assert.equal(assignedUrl, redirectUrl);
  assert.equal(store.eshop.cart.cart.get(), null);
});
