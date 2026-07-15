#!/usr/bin/env node
import assert from "node:assert/strict";
import { createStripeConfirmationTokenController, initialize } from "../dist/storefront.js";

const store = initialize({
  baseUrl: "http://127.0.0.1:1",
  storeId: "contract-store",
  market: "us",
  locale: "en",
});

assert.equal(typeof store.cart.load, "function");
assert.equal(store.cart, store.eshop.cart);
assert.equal(typeof store.cart.refresh, "function");
assert.equal(typeof store.setContext, "function");
assert.equal(typeof store.me, "function");
assert.equal(typeof store.onAuthStateChanged, "function");
assert.equal(store.session.get(), null);
assert.equal(store.isAuthenticated, false);
store.setContext({ locale: "en", market: "us" });
assert.equal(store.getLocale(), "en");
assert.equal(store.getMarket(), "us");
assert.equal(typeof store.cms.entry.get, "function");
assert.equal(typeof store.cms.entry.find, "function");
assert.equal(typeof store.action.pageView, "function");
assert.equal(typeof store.eshop.cart.load, "function");
assert.equal(typeof store.eshop.cart.checkout, "function");
assert.equal(typeof store.eshop.cart.payment, "object");
assert.equal(typeof store.eshop.cart.payment.setController, "function");
assert.equal(typeof store.eshop.cart.payment.getController, "function");
assert.equal(typeof store.eshop.cart.payment.mountStripe, "function");
assert.equal(typeof store.eshop.cart.payment.update, "function");
assert.equal(typeof store.eshop.cart.payment.destroy, "function");
assert.equal(typeof store.eshop.product.list, "function");
assert.equal(typeof store.eshop.product.loadDetail, "function");
assert.equal(typeof store.eshop.service.listProviders, "function");
assert.equal(typeof store.eshop.service.initialize, "function");
assert.equal(typeof store.eshop.service.select, "function");
assert.equal(typeof store.eshop.order.findDigitalAccess, "function");
assert.equal(typeof store.eshop.order.getDigitalAccess, "function");
assert.equal(typeof store.eshop.order.downloadDigitalAccess, "function");
assert.equal(store.eshop.cart.product_items.get().length, 0);
assert.equal(store.eshop.service.state.get().cart.length, 0);

const stripeLoadCalls = [];
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
  elements() {
    return fakeElements;
  },
  async createConfirmationToken() {
    return { confirmationToken: { id: "ct_contract" } };
  },
  async handleNextAction() {
    return {};
  },
};
const accountController = await createStripeConfirmationTokenController(
  {
    publishableKey: "pk_test_contract",
    connectedAccountId: "acct_contract",
    amount: 1000,
    currency: "usd",
  },
  async (publishableKey, options) => {
    stripeLoadCalls.push([publishableKey, options]);
    return fakeStripe;
  },
);
assert.deepEqual(stripeLoadCalls, [["pk_test_contract", { stripeAccount: "acct_contract" }]]);
accountController.destroy();

const fetchCalls = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  fetchCalls.push({
    url: String(url),
    method: init.method,
    body: init.body,
    headers: init.headers,
  });
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

try {
  const management = await store.crm.contactList.manage("manage-token");
  const unsubscribe = await store.crm.contactList.unsubscribe("unsubscribe-token");
  const confirm = await store.crm.contactList.confirm("confirm-token");
  assert.deepEqual(management, { success: true });
  assert.deepEqual(unsubscribe, { success: true });
  assert.deepEqual(confirm, { success: true });
} finally {
  globalThis.fetch = originalFetch;
}

assert.equal(fetchCalls[0].method, "POST");
assert.equal(fetchCalls[0].url, "http://127.0.0.1:1/v1/storefront/contract-store/contact-lists/manage");
assert.deepEqual(JSON.parse(fetchCalls[0].body), { token: "manage-token" });
assert.equal(fetchCalls[1].method, "POST");
assert.equal(fetchCalls[1].url, "http://127.0.0.1:1/v1/storefront/contract-store/contact-lists/unsubscribe?token=unsubscribe-token");
assert.equal(fetchCalls[1].body, "List-Unsubscribe=One-Click");
assert.equal(fetchCalls[1].headers["Content-Type"], "application/x-www-form-urlencoded");
assert.equal(fetchCalls[2].method, "POST");
assert.equal(fetchCalls[2].url, "http://127.0.0.1:1/v1/storefront/contract-store/contact-lists/confirm");
assert.deepEqual(JSON.parse(fetchCalls[2].body), { token: "confirm-token" });

const checkoutFetchCalls = [];
const paymentCalls = [];
const storedController = {
  mount() {
    paymentCalls.push(["mount"]);
  },
  update(input) {
    paymentCalls.push(["update", input]);
  },
  async createConfirmationToken(options) {
    paymentCalls.push(["token", options]);
    return {
      confirmation_token_id: "ct_store_owned",
      return_url: options?.return_url,
    };
  },
  async handleNextAction(clientSecret) {
    paymentCalls.push(["next_action", clientSecret]);
  },
  destroy() {
    paymentCalls.push(["destroy"]);
  },
};

const quoteSnapshot = {
  market: "us",
  zone: null,
  items: [],
  shipping_lines: [],
  subtotal: 1000,
  shipping: 0,
  discount: 0,
  tax: 0,
  total: 1000,
  shipping_method: null,
  payment_method: null,
  payment_methods: [{ id: "pm_card", key: "credit_card", type: "credit_card", name: "Card" }],
  promo_code: null,
  money: {
    currency: "usd",
    market: "us",
    subtotal: 1000,
    shipping: 0,
    discount: 0,
    total: 1000,
    tax: null,
    promo_code: null,
    zone_id: null,
    payment_method_key: "credit_card",
    shipping_method_id: null,
    method_type: "credit_card",
  },
  charge_amount: 1000,
};

const cartSnapshot = {
  id: "cart_contract",
  store_id: "contract-store",
  contact_id: "contact_contract",
  token: "cart-token",
  status: "active",
  origin: "storefront",
  market: "us",
  items: [],
  shipping_address: null,
  billing_address: null,
  forms: [],
  promo_code: null,
  payment_method_key: "credit_card",
  shipping_method_id: null,
  quote_snapshot: quoteSnapshot,
  converted_order_id: null,
  item_count: 1,
  last_action_at: 1,
  created_at: 1,
  updated_at: 1,
};

store.eshop.cart.cart.set(cartSnapshot);

globalThis.fetch = async (url, init = {}) => {
  checkoutFetchCalls.push({
    url: String(url),
    method: init.method,
    body: init.body,
  });
  if (String(url).endsWith("/actions/track")) {
    throw new Error("commerce cart helpers must not call generic action tracking");
  }
  if (String(url).endsWith("/carts/cart_contract/items")) {
    return new Response(JSON.stringify(cartSnapshot), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  if (String(url).endsWith("/carts/cart_contract/items/remove")) {
    return new Response(JSON.stringify(cartSnapshot), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  throw new Error(`Unexpected cart mutation contract request: ${url}`);
};

try {
  await store.eshop.cart.addProduct({ id: "product_contract" }, { id: "variant_contract" }, 1);
  store.eshop.cart.product_items.set([
    {
      id: "line_contract",
      product_id: "product_contract",
      variant_id: "variant_contract",
      product_name: "Contract product",
      product_slug: "contract-product",
      variant_attributes: {},
      requires_shipping: false,
      price: { amount: 1000, currency: "usd", market: "us" },
      quantity: 1,
      added_at: 1,
    },
  ]);
  await store.eshop.cart.removeProduct("line_contract");
} finally {
  globalThis.fetch = originalFetch;
}
assert.deepEqual(
  checkoutFetchCalls.filter((call) => call.url.endsWith("/actions/track")).map((call) => call.url),
  [],
  "cart mutations should rely on backend commerce actions instead of generic action tracking",
);
checkoutFetchCalls.length = 0;

store.eshop.cart.product_items.set([
  {
    id: "line_contract",
    product_id: "product_contract",
    variant_id: "variant_contract",
    product_name: "Contract product",
    product_slug: "contract-product",
    variant_attributes: {},
    requires_shipping: false,
    price: { amount: 1000, currency: "usd", market: "us" },
    quantity: 1,
    added_at: 1,
  },
]);
store.eshop.cart.payment.setController(storedController);
assert.equal(store.eshop.cart.payment.getController(), storedController);

globalThis.fetch = async (url, init = {}) => {
  checkoutFetchCalls.push({
    url: String(url),
    method: init.method,
    body: init.body,
  });
  if (String(url).endsWith("/actions/track")) {
    throw new Error("checkout must not call generic action tracking");
  }
  if (String(url).endsWith("/carts/cart_contract")) {
    return new Response(JSON.stringify(cartSnapshot), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  if (String(url).endsWith("/carts/cart_contract/checkout")) {
    const body = JSON.parse(init.body);
    assert.equal(body.payment_method_key, "credit_card");
    assert.equal(body.confirmation_token_id, "ct_store_owned");
    return new Response(
      JSON.stringify({
        order_id: "order_contract",
        number: "1001",
        payment_action: {
          type: "handle_next_action",
          client_secret: "pi_secret_contract",
        },
        payment: {
          id: "payment_contract",
          store_id: "contract-store",
          order_id: "order_contract",
          status: { status: "pending", at: 1 },
          amount: 1000,
          currency: "usd",
          paid: 0,
          authorized_amount: 0,
          captured_amount: 0,
          refunded_amount: 0,
          voided_amount: 0,
          method_type: "credit_card",
          latest_transaction_id: null,
          created_at: 1,
          updated_at: 1,
        },
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  }
  throw new Error(`Unexpected checkout contract request: ${url}`);
};

try {
  const result = await store.eshop.cart.checkout({
    billing_details: { email: "checkout@example.com" },
  });
  assert.equal(result.order_id, "order_contract");
} finally {
  globalThis.fetch = originalFetch;
}

assert.deepEqual(paymentCalls[0], [
  "token",
  {
    return_url: undefined,
    billing_details: { email: "checkout@example.com" },
  },
]);
assert.deepEqual(paymentCalls[1], ["next_action", "pi_secret_contract"]);
assert.equal(
  checkoutFetchCalls.some((call) => call.url.endsWith("/carts/cart_contract/checkout")),
  true,
);
assert.deepEqual(
  checkoutFetchCalls.filter((call) => call.url.endsWith("/actions/track")).map((call) => call.url),
  [],
  "checkout should rely on backend commerce actions instead of generic action tracking",
);

console.log("Storefront SDK contract test passed.");
