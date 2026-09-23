#!/usr/bin/env node
import assert from "node:assert/strict";
import { checkoutSources } from "./helpers/checkout-sources.mjs";
import { storefrontSessionStorage } from "./helpers/storefront-session-storage.mjs";
import test from "node:test";

import { initialize as initializeFromRoot } from "../dist/index.js";
import { createStorefront, initialize } from "../dist/storefront.js";

const apiUrl = "https://api.example.test";
const publishableKey = `arky_pk_${"c".repeat(43)}`;
const visitorToken = `customer_visitor_${"c".repeat(64)}`;
const cashOnDeliveryProviderId = "2f0a5d3c-9a1e-4b7e-8f4c-6c2a1b3d5e70";
const stripeProviderId = "5b8c1e47-3d29-4a6f-9c15-7e0d2f4a8b31";
const contractCartId = "c4f2a9e1-6b83-4d57-9e02-1a7c5d8f3b46";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function sessionStorage(token = visitorToken) {
  return storefrontSessionStorage(JSON.stringify({
    version: 2,
    customer: {
      id: "customer-contract",
      status: { type: "active" },
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
      status: { type: "active" },
      expires_at: 10_000,
    },
  }));
}

function setup() {
  return {
    timezone: "Europe/Rome",
    languages: { default: "it", available: ["it", "en"] },
    commerce: { type: "ready", default_market_id: "market-ita", default_sales_channel_id: "channel-contract" },
    default_market: {
      id: "market-ita",
      key: "ita",
      currency: "eur",
      tax_mode: "inclusive",
      payment_provider_ids: [cashOnDeliveryProviderId, stripeProviderId],
    },
    payment_providers: [
      { id: cashOnDeliveryProviderId, key: "cash", type: "cash_on_delivery", blocks: [] },
      { id: stripeProviderId, key: "card", type: "stripe", blocks: [] },
    ],
    support: { email: "support@example.test" },
    readiness: { market: true, payment: true, commerce: true },
  };
}

function cartSnapshot(itemCount = 0, lineItems = []) {
  return {
    id: contractCartId,
    store_id: "store-contract",
    customer_id: "customer-contract",
    company: null,
    sales_channel_id: "channel-contract",
    status: { type: "active" },
    origin: {
      type: "storefront",
      customer_id: "customer-contract",
      customer_session_id: "customer-session-contract",
    },
    market_id: "market-ita",
    line_items: lineItems,
    delivery_groups: [],
    billing_address: null,
    promotion_code_ids: [],
    purchase_order_number: null,
    item_count: itemCount,
    last_action_at: 1,
    abandoned_at: null,
    created_at: 1,
    updated_at: 1,
  };
}

const checkoutContractId = "b6d1f83a-0e57-4c92-8a34-7f2b5d0c9e61";

function checkoutReceipt(requestId, orderId = orderContractId) {
  return {
    id: checkoutContractId,
    request_id: requestId,
    carts: checkoutSources(contractCartId).carts,
    state: { type: "accepted", accepted_at: 1, result: { order_id: orderId, bindings: checkoutSources(contractCartId).lines } },
  };
}

function quoteSnapshot(paymentProviderId = cashOnDeliveryProviderId) {
  return {
    sources: checkoutSources(contractCartId),
    presentation_digest: "e".repeat(64),
    order: {
    context: {},
    seller: {},
    invoice_policy: { type: "native", series_key: "sales", issue_trigger: { type: "acceptance" } },
    timezone: "Europe/Rome",
    payment_terms: null,
    purchase_order_number: null,
    locale: "it",
    presentation_digest: "d".repeat(64),
    delivery_quote_version: "v1",
    product_lines: [],
    booking_lines: [],
    digital_lines: [],
    customer_group_lines: [],
    delivery_groups: [],
    payment_provider_id: paymentProviderId,
    payment_provider_ids: [cashOnDeliveryProviderId, stripeProviderId],
    money: null,
    },
  };
}

const orderContractId = "8a3e6f21-47bd-4c90-b5e3-0d7f19c4a8b2";
const paymentContractId = "f17c0b95-2e4d-4a83-9b6c-31d5e8a70f24";

function payment(status, providerType = "cash_on_delivery", total = 1250, orderId = orderContractId) {
  const paymentProviderId =
    providerType === "stripe" ? stripeProviderId : cashOnDeliveryProviderId;
  return {
    id: paymentContractId,
    store_id: "store-contract",
    order_id: orderId,
    payer_customer_id: "customer-contract",
    provider:
      providerType === "stripe"
        ? {
            type: "stripe_checkout",
            payment_provider_id: paymentProviderId,
            checkout_expires_at: 1_800_000_000_000,
            checkout_session_id: "checkout-contract",
            payment_intent_id: "payment-intent-contract",
          }
        : {
            type: "cash_on_delivery",
            payment_provider_id: paymentProviderId,
            marked_paid_by_account_id:
              status === "completed" ? "account-operator" : null,
          },
    status: { type: status },
    checkout_expiration: null,
    amounts: {
      currency: "eur",
      total,
      authorized: 0,
      captured: status === "completed" ? total : 0,
      capture_pending: 0,
      refund_pending: 0,
      refunded: 0,
    },
    request_id: "payment-request-contract",
    reconciliation: { type: "clear" },
    completed_at: status === "completed" ? 2 : null,
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
      quantity: 1,
      form_submission_id: null,
      price_override: null,
    },
  ]);
  store.eshop.cart.quote_result.set(quoteSnapshot());
  return { store, cart };
}

function completedCheckout() {
  return {
    order_id: "1d4b7a02-9c63-4e18-8f52-b307a6d91c48",
    checkout_id: checkoutContractId,
    number: "1005",
    payment_action: { type: "none" },
    payment: payment("completed", "cash_on_delivery", 1250, "1d4b7a02-9c63-4e18-8f52-b307a6d91c48"),
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
  assert.equal("audiences" in store, false);
  assert.equal(typeof store.customer_groups.get, "function");
  assert.equal(typeof store.customer_group_plans.find, "function");
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

test("digital cart selection preserves its exact content Block without accepting browser prices or labels", async () => {
  const store = initialize(publishableKey, {
    apiUrl,
    market: "ita",
    locale: "it",
    sessionStorage: sessionStorage(),
  });
  const selection = {
    id: "7c891cbf-a3da-4bb3-b1da-3a9277efc65e",
    digital_product_id: "ab30ad23-c8ca-47fc-a9c6-33ad6bf6827f",
    beneficiary_customer_id: "ba7818b2-1bd2-4025-87b7-fc9f97052186",
    form_submission_id: null,
  };
  const cart = cartSnapshot(1, [{ type: "digital_product", ...selection, price_override: null }]);
  store.eshop.cart.cart.set(cart);
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), body: JSON.parse(String(init.body || "{}")) });
    return jsonResponse(cart);
  };
  const untrusted = {
    ...selection,
    price_override: { amount: 1, currency: "EUR", reason: "Browser override" },
    name_block_id: "Browser-chosen block",
    display_name: "Browser wording",
    product_name: "Another browser wording",
  };
  try {
    await store.eshop.cart.addDigital(untrusted);
    await store.eshop.cart.refresh({ digital_items: [untrusted] });
    await store.client.eshop.cart.addDigital({ id: cart.id, digital: untrusted });
  } finally {
    globalThis.fetch = originalFetch;
  }
  const writes = calls.filter((call) => call.url.includes(`/carts/${cart.id}`));
  assert.equal(writes.length, 3);
  assert.deepEqual(writes[0].body.digital, selection);
  assert.deepEqual(writes[1].body.line_items, [{ type: "digital_product", ...selection }]);
  assert.deepEqual(writes[2].body.digital, selection);
  assert.deepEqual(store.eshop.cart.buildItems().digital_items, [selection]);
  assert.deepEqual(store.eshop.cart.digital_items.get(), [
    { ...selection, price_override: null },
  ]);
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
  assert.equal(store.eshop.cart.cart.get().id, contractCartId);
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
      quantity: 1,
      form_submission_id: null,
      price_override: null,
    },
  ]);
  store.eshop.cart.quote_result.set(quoteSnapshot(cashOnDeliveryProviderId));
  const order = {
    order_id: "8a3e6f21-47bd-4c90-b5e3-0d7f19c4a8b2",
    checkout_id: checkoutContractId,
    number: "1001",
    payment_action: { type: "none" },
    payment: payment("completed"),
  };
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url: String(url),
      body: init.body ? JSON.parse(String(init.body)) : null,
      headers: new Headers(init.headers),
    });
    return String(url).endsWith("/checkouts")
      ? jsonResponse(order)
      : jsonResponse(checkoutReceipt(calls[0].body.request_id, order.order_id));
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
      `${apiUrl}/v1/storefront/checkouts`,
      `${apiUrl}/v1/storefront/checkouts/${checkoutContractId}`,
    ],
  );
  for (const call of calls) {
    assert.equal(call.headers.get("authorization"), `Bearer ${visitorToken}`);
    assert.equal(call.headers.get("x-arky-publishable-key"), publishableKey);
    assert.equal(JSON.stringify(call.body).includes("store_id"), false);
    assert.equal(call.body !== null && "market" in call.body, false);
  }
  assert.equal(calls[0].body.payment_provider_id, cashOnDeliveryProviderId);
  assert.equal(calls[0].body.presentation_digest, quoteSnapshot().presentation_digest);
  assert.equal(calls[1].body, null);
});

test("zero-total checkout accepts a null payment and clears stale cart state", async () => {
  const { store, cart } = checkoutStore();
  const selectedItems = store.eshop.cart.product_items.get();
  const zeroTotalResult = {
    order_id: "6e91c58d-0a34-47bf-92d1-c8b5f3072e19",
    checkout_id: checkoutContractId,
    number: "1000",
    payment_action: { type: "none" },
    payment: null,
  };
  const originalFetch = globalThis.fetch;
  let requestId;
  globalThis.fetch = async (url, init = {}) => {
    if (String(url).endsWith("/checkouts")) {
      requestId = JSON.parse(init.body).request_id;
      return jsonResponse(zeroTotalResult);
    }
    return jsonResponse(checkoutReceipt(requestId, zeroTotalResult.order_id));
  };

  try {
    assert.deepEqual(
      await store.eshop.cart.checkout(),
      zeroTotalResult,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(store.eshop.cart.cart.get(), null);
  assert.deepEqual(store.eshop.cart.product_items.get(), []);
  assert.deepEqual(store.eshop.cart.last_order.get(), {
    order_id: "6e91c58d-0a34-47bf-92d1-c8b5f3072e19",
    checkout_id: checkoutContractId,
    number: "1000",
    payment_action: { type: "none" },
    payment: null,
    product_items: selectedItems,
    booking_items: [],
    digital_items: [],
    customer_group_plan_items: [],
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
  const checkoutInput = { payment_provider_id: cashOnDeliveryProviderId };
  const calls = [];
  let checkoutCalls = 0;
  let requestId;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method || "GET" });
    if (!String(url).endsWith("/checkouts")) return jsonResponse(checkoutReceipt(requestId, completed.order_id));
    requestId = JSON.parse(init.body).request_id;
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
      ["POST", `${apiUrl}/v1/storefront/checkouts`],
      ["POST", `${apiUrl}/v1/storefront/checkouts`],
      ["GET", `${apiUrl}/v1/storefront/checkouts/${checkoutContractId}`],
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
      quantity: 1,
      form_submission_id: null,
      price_override: null,
    },
  ]);
  store.eshop.cart.quote_result.set(quoteSnapshot(stripeProviderId));
  let checkoutCalls = 0;
  let paymentObservationCalls = 0;
  let requestId;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const target = String(url);
    if (/\/orders\/[^/]+\/payments\//.test(target)) {
      paymentObservationCalls += 1;
      return jsonResponse(payment("completed", "stripe"));
    }
    if (!target.endsWith("/checkouts")) {
      return jsonResponse(checkoutReceipt(requestId, "3c7f2e10-b854-4d69-a0e7-59f1b6c4d823"));
    }
    assert.equal(init.method, "POST");
    requestId = JSON.parse(init.body).request_id;
    checkoutCalls += 1;
    return jsonResponse({
      order_id: "3c7f2e10-b854-4d69-a0e7-59f1b6c4d823",
      checkout_id: checkoutContractId,
      number: "1002",
      payment_action: { type: "none" },
      payment: payment("processing", "stripe", 1250, "3c7f2e10-b854-4d69-a0e7-59f1b6c4d823"),
    });
  };

  try {
    const result = await store.eshop.cart.checkout({
      payment_provider_id: stripeProviderId,
    });
    assert.equal(result.payment.status.type, "processing");
    assert.equal(checkoutCalls, 1);
    assert.equal(paymentObservationCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("accepted Checkout reads and explicit payment resume keep the exact identity without submitting a Cart", async () => {
  const storefront = createStorefront(publishableKey, { apiUrl, sessionStorage: sessionStorage() });
  const calls = [];
  const originalFetch = globalThis.fetch;
  const result = completedCheckout();
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method || "GET", body: init.body, headers: new Headers(init.headers) });
    return jsonResponse(result);
  };
  try {
    await storefront.eshop.checkout.get({ id: result.checkout_id });
    assert.deepEqual(await storefront.eshop.checkout.resumePayment({ id: result.checkout_id }), result);
  } finally { globalThis.fetch = originalFetch; }
  assert.deepEqual(calls.map(({ url, method }) => ({ url, method })), [
    { url: `${apiUrl}/v1/storefront/checkouts/${result.checkout_id}`, method: "GET" },
    { url: `${apiUrl}/v1/storefront/checkouts/${result.checkout_id}/payment-action`, method: "POST" },
  ]);
  assert.deepEqual(JSON.parse(calls[1].body), {});
  assert.ok(calls.every(({ headers }) => headers.get("authorization") === `Bearer ${visitorToken}`));
});

test("storefront order payment lookup is an authenticated exact GET", async () => {
  const exactOrderId = "9b05d3a7-1f26-4c8e-b743-2a6e0d59f71c";
  const storefront = createStorefront(publishableKey, {
    apiUrl,
    sessionStorage: sessionStorage(),
  });
  const observedResult = payment("unknown", "stripe", 1250, exactOrderId);
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
      await storefront.eshop.order.getPayment({ order_id: exactOrderId, payment_id: observedResult.id }),
      observedResult,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(calls.length, 1);
  assert.equal(
    calls[0].url,
    `${apiUrl}/v1/storefront/orders/${exactOrderId}/payments/${observedResult.id}`,
  );
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].headers.get("authorization"), `Bearer ${visitorToken}`);
});

test("storefront Payment history keeps exact Order scope, filters and continuation without processing money", async () => {
  const orderId = "9b05d3a7-1f26-4c8e-b743-2a6e0d59f71c";
  const storefront = createStorefront(publishableKey, { apiUrl, sessionStorage: sessionStorage() });
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method || "GET", headers: new Headers(init.headers) });
    return jsonResponse({ items: [], cursor: "next+/=" });
  };
  try {
    assert.deepEqual(await storefront.eshop.order.findPayments({
      order_id: orderId, status: "unknown", sort_field: "updated_at", sort_direction: "asc", limit: 25, cursor: "previous+/=",
    }), { items: [], cursor: "next+/=" });
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].url.pathname, `/v1/storefront/orders/${orderId}/payments`);
  assert.deepEqual(Object.fromEntries(calls[0].url.searchParams), {
    status: "unknown", sort_field: "updated_at", sort_direction: "asc", limit: "25", cursor: "previous+/=",
  });
  assert.equal(calls[0].headers.get("authorization"), `Bearer ${visitorToken}`);
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
      quantity: 1,
      form_submission_id: null,
      price_override: null,
    },
  ]);
  store.eshop.cart.quote_result.set(quoteSnapshot(stripeProviderId));
  let checkoutCalls = 0;
  let checkoutBody;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    if (!String(url).endsWith("/checkouts")) return jsonResponse(checkoutReceipt(checkoutBody.request_id, "47e2b16c-8d05-4f31-9a6b-e35c7f018d92"));
    checkoutCalls += 1;
    checkoutBody = JSON.parse(String(init.body));
    return jsonResponse({
      order_id: "47e2b16c-8d05-4f31-9a6b-e35c7f018d92",
      checkout_id: checkoutContractId,
      number: "1004",
      payment_action: {
        type: "stripe_embedded_checkout",
        publishable_key: "pk_test_order",
        client_secret: "cs_order_secret_exact",
        connected_account_id: "acct_order",
        expires_at: 1_800_000_000_000,
      },
      payment: payment("requires_action", "stripe", 1250, "47e2b16c-8d05-4f31-9a6b-e35c7f018d92"),
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
  assert.match(checkoutBody.request_id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  const { request_id, ...reviewed } = checkoutBody;
  assert.deepEqual(reviewed, {
    sources: quoteSnapshot().sources,
    presentation_digest: quoteSnapshot().presentation_digest,
    payment_provider_id: stripeProviderId,
    return_url: "https://shop.example.test/checkout/complete",
  });
  assert.equal(store.eshop.cart.cart.get(), null);
  assert.equal(store.eshop.cart.last_order.get().order_id, "47e2b16c-8d05-4f31-9a6b-e35c7f018d92");
});
