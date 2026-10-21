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
  order_token: "arky_ot_" + "A".repeat(43),
  cart_id: ids.cart,
  expected_updated_at: 1_800_000_000_000,
  presentation_digest: "a".repeat(64),
  language: "bs",
  contact_email: { email: "location@example.test", language: "bs" },
  payment_option_id: ids.paymentOption,
  terms: { type: "net_days", days: 30 },
  reason: "Merchant approved Net30 for this one-time location purchase",
};

function admin(token = "arky_api_current") {
  return createAdmin({ apiUrl: apiUrl, secretKey: token });
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

test("an already_member answer is passed through unchanged for the Admin to show as finished", async (context) => {
  const answer = { type: "already_member", customer_group_member_id: ids.customerGroupMember };
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

test("the storefront has no on-account acceptance; a company location buyer pays on account through the checkout payment choice", async (context) => {
  const calls = recordFetch(context, (call) => call.method === "GET" ? placedOrder() : placedAcceptance());
  const storefront = createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, locale: "en", market: "bih", sessionStorage: visitorStorage() });
  for (const removed of ["checkoutOnAccount", "retainOnAccountCheckout", "recoverOnAccountCheckout"]) {
    assert.equal(removed in storefront.eshop.cart, false, removed);
  }
  const request = checkoutRequest({ payment: { type: "on_account", payment_option_id: ids.paymentOption } });
  assert.deepEqual(await storefront.eshop.cart.checkout({ ...request, terms: { type: "net_days", days: 0 }, reason: "browser" }), placedAcceptance());
  assert.deepEqual(calls[0].body, request);
  assert.equal(calls[0].path, "/v1/storefront/carts/accept");
});

test("company and location purchasing commands preserve the exact version and the full typed policy", async (context) => {
  const calls = recordFetch(context, (call) => ({ id: call.path.split("/")[5], store_id: ids.store, ...call.body }));
  const purchasing = {
    payment: {
      type: "on_account",
      terms: { type: "net_days", days: 30 },
      billing_address: { name: "Location", company: "Partner", street1: "1 Main", street2: null, city: "Sarajevo", state: null, postal_code: "71000", country: "BA", phone: null, email: null },
    },
    allowed_payment_option_ids: [ids.paymentOption],
    purchase_order_number_required: true,
  };
  const input = { ...target, id: ids.companyLocation, expected_updated_at: 1_800_000_000_000, purchasing };
  const signal = new AbortController().signal;
  await admin().companies.location.setPurchasing(input, { signal, headers: { "X-Review": "native-cas" } });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "PUT");
  assert.equal(calls[0].path, `/v1/stores/${ids.store}/company-locations/${ids.companyLocation}/purchasing`);
  assert.deepEqual(calls[0].body, { expected_updated_at: input.expected_updated_at, purchasing });
  assert.equal(calls[0].signal, signal);
  assert.equal(calls[0].headers.get("X-Review"), "native-cas");
  assert.equal(calls[0].headers.get("Authorization"), "Bearer arky_api_current");
  const standardCheckout = { payment: { type: "standard_checkout", billing_address: null }, allowed_payment_option_ids: [], purchase_order_number_required: false };
  await admin().companies.location.setPurchasing({ ...input, purchasing: standardCheckout });
  assert.deepEqual(calls[1].body, { expected_updated_at: input.expected_updated_at, purchasing: standardCheckout });
  await admin().companies.setPurchasing({ ...target, id: ids.company, expected_updated_at: 1_800_000_000_001, purchasing });
  assert.equal(calls[2].method, "PUT");
  assert.equal(calls[2].path, `/v1/stores/${ids.store}/companies/${ids.company}/purchasing`);
  assert.deepEqual(calls[2].body, { expected_updated_at: 1_800_000_000_001, purchasing });
  await admin().companies.location.setFulfillment({ ...target, id: ids.companyLocation, expected_updated_at: 2, fulfillment: { type: "served_from", store_location_id: ids.otherCompanyLocation } });
  assert.equal(calls[3].path, `/v1/stores/${ids.store}/company-locations/${ids.companyLocation}/served-from`);
  assert.deepEqual(calls[3].body, { expected_updated_at: 2, fulfillment: { type: "served_from", store_location_id: ids.otherCompanyLocation } });
  await admin().companies.location.setFulfillment({ ...target, id: ids.companyLocation, expected_updated_at: 3, fulfillment: { type: "routing" } });
  assert.deepEqual(calls[4].body, { expected_updated_at: 3, fulfillment: { type: "routing" } });
  for (const removed of ["setCommercePolicy", "minimumProgress"]) {
    assert.equal(removed in admin().companies.location, false, removed);
    assert.equal(removed in admin().companies, false, removed);
  }
});
