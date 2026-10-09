import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/index.js";
import { createStorefront } from "../dist/storefront.js";
import { MemoryStorage } from "./helpers/durable-request-fixtures.mjs";
import {
  apiUrl,
  checkoutRequest,
  ids,
  installGlobal,
  placedAcceptance,
  placedOrder,
  publishableKey,
  recordFetch,
  visitorStorage,
} from "./helpers/arky-fixtures.mjs";

const target = { store_id: ids.store };
const onAccount = {
  order_id: ids.order,
  cart_id: ids.cart,
  expected_updated_at: 1_800_000_000_000,
  presentation_digest: "a".repeat(64),
  language: "bs",
  contact_email: "branch@example.test",
  payment_option_id: ids.paymentOption,
  terms: { type: "net_days", days: 30 },
  reason: "Merchant approved Net30 for this one-time branch purchase",
};

function admin(token = "arky_api_current") {
  return createAdmin({ baseUrl: apiUrl, apiToken: token });
}

test("Admin on-account checkout sends the reviewed cart, app-picked order id, language, terms and reason in one POST", async (context) => {
  const storage = new MemoryStorage();
  installGlobal(context, "window", globalThis);
  installGlobal(context, "localStorage", storage);
  const calls = recordFetch(context, () => placedAcceptance());
  const signal = new AbortController().signal;
  assert.deepEqual(await admin().eshop.cart.checkoutOnAccount({ ...target, ...onAccount }, { signal, headers: { "X-Review": "on-account" } }), placedAcceptance());
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].path, `/v1/stores/${ids.store}/carts/accept-on-account`);
  assert.deepEqual(calls[0].body, onAccount);
  assert.equal(calls[0].headers.get("authorization"), "Bearer arky_api_current");
  assert.equal(calls[0].headers.get("x-review"), "on-account");
  assert.equal(calls[0].signal, signal);
  assert.equal(storage.length, 0);
  for (const order_id of [undefined, "", "order-1", ids.order.toUpperCase()]) {
    await assert.rejects(async () => admin().eshop.cart.checkoutOnAccount({ ...target, ...onAccount, order_id }), TypeError);
  }
  await assert.rejects(async () => admin().eshop.cart.checkoutOnAccount({ ...onAccount, store_id: "store/one" }), TypeError);
  assert.equal(calls.length, 1);
});

test("an already_subscribed answer is passed through unchanged for the Admin to show as finished", async (context) => {
  const answer = { type: "already_subscribed", subscription_id: ids.subscription };
  recordFetch(context, () => answer);
  assert.deepEqual(await admin().eshop.cart.checkoutOnAccount({ ...target, ...onAccount }), answer);
  assert.deepEqual(await admin().eshop.cart.checkout({ ...target, ...checkoutRequest(), language: "en" }), answer);
});

test("Admin keeps no browser retention for on-account or ordinary checkout", () => {
  const cart = admin().eshop.cart;
  for (const removed of [
    "retainCheckout", "pendingCheckout", "recoverCheckout",
    "retainOnAccountCheckout", "pendingOnAccountCheckout", "recoverOnAccountCheckout",
    "reviewFirstOrderTerms", "sealFirstOrderTerms", "withdrawFirstOrderTerms", "acceptFutureDeliveries",
  ]) assert.equal(removed in cart, false, removed);
});

test("the storefront has no on-account acceptance; a branch buyer pays on account through the checkout payment choice", async (context) => {
  const calls = recordFetch(context, (call) => call.method === "GET" ? placedOrder() : placedAcceptance());
  const storefront = createStorefront(publishableKey, { apiUrl, locale: "en", market: "bih", sessionStorage: visitorStorage() });
  for (const removed of ["checkoutOnAccount", "retainOnAccountCheckout", "recoverOnAccountCheckout"]) {
    assert.equal(removed in storefront.eshop.cart, false, removed);
  }
  const request = checkoutRequest({ payment: { type: "on_account", payment_option_id: ids.paymentOption } });
  assert.deepEqual(await storefront.eshop.cart.checkout({ ...request, terms: { type: "net_days", days: 0 }, reason: "browser" }), placedAcceptance());
  assert.deepEqual(calls[0].body, request);
  assert.equal(calls[0].path, "/v1/storefront/carts/accept");
});

test("branch commerce policy command preserves the exact version and the full typed policy", async (context) => {
  const calls = recordFetch(context, (call) => ({ id: ids.companyLocation, store_id: ids.store, ...call.body }));
  const commerce = {
    payment: {
      type: "on_account",
      terms: { type: "net_days", days: 30 },
      billing_address: { name: "Branch", company: "Partner", street1: "1 Main", street2: null, city: "Sarajevo", state: null, postal_code: "71000", country: "BA", phone: null, email: null },
    },
    allowed_payment_options: { type: "only", payment_option_ids: [ids.paymentOption] },
    purchase_order_number_required: true,
  };
  const input = { ...target, id: ids.companyLocation, expected_updated_at: 1_800_000_000_000, commerce };
  const signal = new AbortController().signal;
  await admin().companies.location.setCommercePolicy(input, { signal, headers: { "X-Review": "native-cas" } });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "PUT");
  assert.equal(calls[0].path, `/v1/stores/${ids.store}/company-locations/${ids.companyLocation}/commerce`);
  assert.deepEqual(calls[0].body, { expected_updated_at: input.expected_updated_at, commerce });
  assert.equal(calls[0].headers.get("X-Review"), "native-cas");
  assert.equal(calls[0].headers.get("Authorization"), "Bearer arky_api_current");
  const atCheckout = { payment: { type: "at_checkout", billing_address: null }, allowed_payment_options: { type: "all" }, purchase_order_number_required: false };
  await admin().companies.location.setCommercePolicy({ ...input, commerce: atCheckout });
  assert.deepEqual(calls[1].body.commerce, atCheckout);
  await admin().companies.location.setFulfillment({ ...target, id: ids.companyLocation, expected_updated_at: 2, fulfillment: { type: "served_from", store_location_id: ids.otherCompanyLocation } });
  assert.equal(calls[2].path, `/v1/stores/${ids.store}/company-locations/${ids.companyLocation}/served-from`);
  assert.deepEqual(calls[2].body, { expected_updated_at: 2, fulfillment: { type: "served_from", store_location_id: ids.otherCompanyLocation } });
  await admin().companies.location.setFulfillment({ ...target, id: ids.companyLocation, expected_updated_at: 3, fulfillment: { type: "routing" } });
  assert.deepEqual(calls[3].body, { expected_updated_at: 3, fulfillment: { type: "routing" } });
});
