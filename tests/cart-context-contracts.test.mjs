import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { createAdmin, createCartController, cartSubscriptionPlanItems } from "../dist/index.js";
import { createStorefront, initialize } from "../dist/storefront.js";
import { checkoutSources } from "./helpers/checkout-sources.mjs";
import { storefrontSessionStorage } from "./helpers/storefront-session-storage.mjs";

const apiUrl = "https://api.example.test";
const publishableKey = `arky_pk_${"c".repeat(43)}`;
const visitorToken = `customer_visitor_${"c".repeat(64)}`;
const cartId = "9f1b6e23-e2ea-4ab9-a1b7-eaaf550ddf41";
const orderId = "2b815d21-78be-431a-b49c-0d5d62c87823";
const providerId = "4a2c7c0d-4389-4aae-b3d7-02ff834a024d";
const STORE_ID = "5e8a1c93-7d24-4f06-b9e3-2a6f0d8c4b71";
const OTHER_STORE_ID = "c2d7f490-1b36-4e58-a0c9-7e3b5d1f8a26";
const checkoutRequestId = "5d2f1c8b-6a4e-4c39-9b71-2f8e0d47a3c6";
const bihMarket = { id: "market", key: "bih", currency: "bam", tax_mode: "exclusive", payment_option_ids: [] };
const savedFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = savedFetch; });

function sessionStorage() {
  const value = JSON.stringify({
    version: 2,
    customer: { id: "customer", status: { type: "active" }, identities: [], categories: [], created_at: 1, updated_at: 1 },
    session: { id: "session", customer_id: "customer", type: "visitor", token: visitorToken, status: { type: "active" }, expires_at: 1900000000000 },
  });
  return storefrontSessionStorage(value);
}

const planId = "0b3e9c17-5a2d-4f86-9e01-7c4b6d2a8f35";
const planLineId = "19f4bc18-4259-46b8-b5ef-3579d1dac971";
const planSelection = {
  subscription_plan_id: planId,
  subject: { type: "customer", customer_id: "customer" },
  start: { type: "on_acceptance" },
  deliveries: [],
};

function cart() {
  return {
    id: cartId, store_id: STORE_ID, customer_id: "customer",
    company: { company_id: "company", company_location_id: "location" },
    market_id: "market", sales_channel_id: "channel",
    status: { type: "active" },
    origin: { type: "storefront", customer_id: "customer", customer_session_id: "session" },
    line_items: [{ type: "subscription_plan", id: planLineId, ...planSelection, price_override: null }],
    delivery_groups: [], billing_address: null, promotion_code_ids: [],
    purchase_order_number: null, item_count: 1,
    last_action_at: 1, abandoned_at: null, created_at: 1, updated_at: 1,
  };
}

function quote() {
  return {
    sources: checkoutSources(cartId, "subscription_plan", planLineId),
    presentation_digest: "a".repeat(64),
    order: {
    context: {
      market_id: "market",
      market_snapshot: { key: "bih", currency: "bam", tax_mode: "exclusive", source_market_id: "market" },
      sales_channel_id: "channel",
      sales_channel_snapshot: { key: "web", name: "Web", source_sales_channel_id: "channel" },
      customer_id: "customer",
      customer_snapshot: { email: null, authentication: { type: "visitor" }, source_customer_id: "customer", source_email_identity_id: null },
      company_id: "company", company_location_id: "location",
      company_snapshot: { name: "Company", legal_name: null, registration_number: null, contact_email: null, source_company_id: "company" },
      company_location_snapshot: null,
      origin: cart().origin,
    },
    seller: { profile: { legal_name: "Seller", registration_number: null, tax_registrations: [], address: { country: "BA" } }, configuration_digest: "a".repeat(64) },
    timezone: "Europe/Sarajevo",
    payment_terms: null,
    purchase_order_number: null,
    locale: "bs", presentation_digest: "c".repeat(64),
    delivery_quote_version: "v1",
    product_lines: [], booking_lines: [], digital_lines: [],
    subscription_lines: [{
      line_item_id: planLineId,
      subject: planSelection.subject,
      starts_at: 1,
      terms: { plan: {}, deliveries: [], billing_address: null },
      occurrence: { type: "permanent", starts_at: 1 },
      entitlement_lines: [],
      money: { unit_price: 0, subtotal: 0, discount_allocations: [], discount_total: 0, tax_lines: [], tax_total: 0, duty_lines: [], duty_total: 0, total: 0, tax_assessment: { type: "not_required", reason: { type: "noncommercial_subscription_grant" }, policy_version: "v1", decided_at: 1 } },
    }],
    delivery_groups: [], payment_option_id: null, payment_option_ids: [],
    money: { currency: "bam", subtotal: 0, delivery: 0, discount: 0, tax_total: 0, duty_total: 0, total: 0, promotions: [] },
    },
  };
}

function capture(respond = () => cart()) {
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    const call = { url: new URL(url), method: init.method, body: init.body ? JSON.parse(init.body) : null, headers: new Headers(init.headers), signal: init.signal };
    calls.push(call);
    return Response.json(respond(call));
  };
  return calls;
}

test("Admin Cart commands preserve explicit context, null clears, empty families and typed filter values", async () => {
  const calls = capture((call) => call.method === "POST" && call.url.pathname.endsWith("/carts")
    ? { cart: cart(), recovery_token: "cart-recovery-token" } : cart());
  const admin = createAdmin({ baseUrl: apiUrl, apiToken: "arky_api_cart", locale: "bs" });
  const selection = { customer_id: "customer", company: { company_id: "company", company_location_id: "location" }, market_id: "market", sales_channel_id: "channel" };
  assert.deepEqual(await admin.eshop.cart.create({ store_id: STORE_ID, ...selection }), { cart: cart(), recovery_token: "cart-recovery-token" });
  assert.deepEqual(calls[0].body, { ...selection, line_items: [], delivery_groups: [] });
  assert.equal(calls[0].url.pathname, `/v1/stores/${STORE_ID}/carts`);
  const patch = { company: null, billing_address: null };
  await admin.eshop.cart.update({ store_id: STORE_ID, id: "cart/one", ...patch });
  assert.deepEqual(calls[1].body, patch);
  assert.equal(calls[1].url.pathname, `/v1/stores/${STORE_ID}/carts/cart%2Fone`);
  await admin.eshop.cart.addSubscriptionPlan({ store_id: STORE_ID, id: "cart", subscription_plan: planSelection });
  assert.deepEqual(calls[2].body, { subscription_plan: planSelection });
  assert.equal(calls[2].url.pathname, `/v1/stores/${STORE_ID}/carts/cart/subscription-plan-items`);
  assert.equal("setStoreId" in admin, false);
  await admin.eshop.cart.find({ store_id: OTHER_STORE_ID, statuses: ["active"], origins: ["admin"] });
  assert.equal(calls[3].url.pathname, `/v1/stores/${OTHER_STORE_ID}/carts`);
  assert.deepEqual(JSON.parse(calls[3].url.searchParams.get("statuses")), ["active"]);
  assert.deepEqual(JSON.parse(calls[3].url.searchParams.get("origins")), ["admin"]);
});

test("Cart discovery preserves combined predicates, ordering and empty-page continuation", async () => {
  const calls = capture(() => ({ items: [], cursor: "next-cart-page" }));
  const admin = createAdmin({ baseUrl: apiUrl, apiToken: "arky_api_cart" });
  const filters = {
    store_id: STORE_ID, customer_id: "customer", statuses: ["active", "abandoned"], origins: ["admin", "storefront"],
    has_items: false, sort_field: "updated_at", sort_direction: "asc", limit: 20,
  };
  const first = await admin.eshop.cart.find(filters);
  assert.deepEqual(first, { items: [], cursor: "next-cart-page" });
  await admin.eshop.cart.find({ ...filters, cursor: first.cursor });
  for (const call of calls) {
    assert.equal(call.url.pathname, `/v1/stores/${STORE_ID}/carts`);
    assert.equal(call.url.searchParams.has("store_id"), false);
    assert.equal(call.method, "GET");
    assert.equal(call.url.searchParams.get("customer_id"), "customer");
    assert.equal(call.url.searchParams.get("has_items"), "false");
    assert.equal(call.url.searchParams.get("sort_field"), "updated_at");
    assert.equal(call.url.searchParams.get("sort_direction"), "asc");
    assert.equal(call.url.searchParams.get("limit"), "20");
    assert.deepEqual(JSON.parse(call.url.searchParams.get("statuses")), filters.statuses);
    assert.deepEqual(JSON.parse(call.url.searchParams.get("origins")), filters.origins);
  }
  assert.equal(calls[1].url.searchParams.get("cursor"), first.cursor);
  globalThis.fetch = async () => Response.json({ message: "Search unavailable" }, { status: 503 });
  await assert.rejects(admin.eshop.cart.find(filters), (error) => error.statusCode === 503);
});

test("Admin quotes send configured or explicit locale and retain resolved quote context", async () => {
  const expected = quote();
  const calls = capture(() => expected);
  const admin = createAdmin({ baseUrl: apiUrl, apiToken: "arky_api_cart", locale: "bs" });
  assert.deepEqual(await admin.eshop.cart.quote({ store_id: STORE_ID, id: "cart" }), expected);
  assert.deepEqual(calls[0].body, { locale: "bs" });
  assert.equal(calls[0].url.pathname, `/v1/stores/${STORE_ID}/carts/cart/quote`);
  await admin.eshop.cart.quote({ store_id: STORE_ID, id: "cart", locale: "en" });
  assert.deepEqual(calls[1].body, { locale: "en" });
  await admin.eshop.order.getQuote({ store_id: STORE_ID, company_id: "company", company_location_id: "location", sales_channel_id: "channel", market: "bih", currency: "bam", line_items: [{ type: "subscription_plan", ...planSelection }] });
  assert.deepEqual(calls[2].body, { locale: "bs", company_id: "company", company_location_id: "location", sales_channel_id: "channel", market: "bih", currency: "bam", line_items: [{ type: "subscription_plan", ...planSelection }], delivery_groups: [] });
  assert.equal(calls[2].url.pathname, `/v1/stores/${STORE_ID}/orders/quote`);
});

test("Storefront quotes preserve relative subscription selections and resolved delivery dates separately", async () => {
  const group = {
    id: "weekly-drop",
    items: [{ line_item: { type: "subscription_entitlement", line_item_id: planLineId, entitlement_id: "milk" }, quantity: 15 }],
    destination: { type: "pickup", store_location_id: "warehouse" },
    shipping_rate_id: null,
    quote_acceptance: null,
    scheduled_window: { type: "subscription", delivery_index: 0 },
  };
  const window = { from: 1800000000000, to: 1800086400000 };
  const expected = quote();
  expected.order.delivery_groups = [{ cart_delivery_group_id: group.id, scheduled_window: window }];
  const calls = capture((call) => call.method === "PUT"
    ? { ...cart(), delivery_groups: call.body.delivery_groups } : expected);
  const client = createStorefront(publishableKey, { apiUrl, locale: "bs", market: "bih", sessionStorage: sessionStorage() });
  const saved = await client.eshop.cart.update({ id: cartId, delivery_groups: [group] });
  const reviewed = await client.eshop.cart.quote({ id: cartId });
  assert.deepEqual(calls[0].body, { delivery_groups: [group] });
  assert.deepEqual(saved.delivery_groups[0].scheduled_window, { type: "subscription", delivery_index: 0 });
  assert.deepEqual(reviewed.order.delivery_groups[0].scheduled_window, window);
  assert.deepEqual(group.scheduled_window, { type: "subscription", delivery_index: 0 });
});

test("Storefront Cart permits explicit Company selection but strips browser authority and overrides", async () => {
  const calls = capture((call) => call.url.pathname.endsWith("/markets/by-key/bih") ? bihMarket
    : call.method === "POST" && call.url.pathname.endsWith("/carts")
      ? { cart: cart(), recovery_token: "cart-recovery-token" } : cart());
  const client = createStorefront(publishableKey, { apiUrl, locale: "bs", market: "bih", sessionStorage: sessionStorage() });
  await client.eshop.cart.current({ company: { company_id: "company", company_location_id: "location", extra: "spoof" }, customer_id: "spoof", market_id: "spoof" });
  assert.equal(calls[0].url.pathname, "/v1/storefront/markets/by-key/bih");
  assert.equal(calls[0].method, "GET");
  calls.shift();
  assert.equal(calls[0].url.pathname, "/v1/storefront/carts");
  assert.deepEqual(calls[0].body, { company: { company_id: "company", company_location_id: "location" } });
  const override = { money: { amount: 1, currency: "bam" }, reason: "browser" };
  await client.eshop.cart.update({
    id: "cart", customer_id: "spoof", store_id: "spoof", origin: { type: "admin" }, company: null,
    line_items: [
      { type: "product", product_id: "product", variant_id: "variant", quantity: 0, price_override: override, purchase: { type: "catalog", spoof: true } },
      { type: "product", product_id: "product", variant_id: "access-variant", quantity: 1, price_override: override,
        purchase: { type: "existing_purchase_access", grant: { order_id: "order", order_purchase_access_line_item_id: "access-line", price: 0 } } },
      { type: "booking", booking_offering_id: "offering", requested_interval: { from: 0, to: 60000 }, capacity_units: 1, price_override: override },
      { type: "digital_product", digital_product_id: "digital", beneficiary_customer_id: "customer", form_submission_id: null, price_override: override },
      { type: "subscription_plan", ...planSelection, price_override: override },
    ],
  });
  assert.deepEqual(calls[1].body, {
    company: null,
    line_items: [
      { type: "product", product_id: "product", variant_id: "variant", quantity: 0, purchase: { type: "catalog" } },
      { type: "product", product_id: "product", variant_id: "access-variant", quantity: 1,
        purchase: { type: "existing_purchase_access", grant: { order_id: "order", order_purchase_access_line_item_id: "access-line" } } },
      { type: "booking", booking_offering_id: "offering", requested_interval: { from: 0, to: 60000 }, capacity_units: 1 },
      { type: "digital_product", digital_product_id: "digital", beneficiary_customer_id: "customer", form_submission_id: null },
      { type: "subscription_plan", ...planSelection },
    ],
  });
  const beforeUnroutedProduct = calls.length;
  await assert.rejects(client.eshop.cart.update({ id: "cart", line_items: [{ type: "product", product_id: "product", variant_id: "variant", quantity: 1 }] }));
  await assert.rejects(client.eshop.cart.update({ id: "cart", line_items: [{ type: "product", product_id: "product", variant_id: "variant", quantity: 1, purchase: { type: "browser_grant" } }] }), /explicit supported purchase route/);
  assert.equal(calls.length, beforeUnroutedProduct);
  await client.eshop.cart.addSubscriptionPlan({ id: "cart/one", subscription_plan: { ...planSelection, price_override: override } });
  assert.equal(calls[2].url.pathname, "/v1/storefront/carts/cart%2Fone/subscription-plan-items");
  assert.deepEqual(calls[2].body, { subscription_plan: planSelection });
  for (const call of calls) {
    assert.equal(call.headers.get("authorization"), `Bearer ${visitorToken}`);
    assert.equal(call.headers.get("x-arky-market"), "bih");
    assert.equal(call.headers.get("x-arky-locale"), "bs");
  }
});

test("Checkout forwards only the reviewed locale/digest and does not replace a rejected presentation", async () => {
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ path: new URL(url).pathname, body: JSON.parse(init.body) });
    return Response.json({ message: "Review the changed quote", error: "COMMERCE.PRESENTATION_CHANGED", status_code: 409, validation_errors: [], quote: quote() }, { status: 409 });
  };
  const request = { id: cartId, request_id: checkoutRequestId, locale: "bs", presentation_digest: "b".repeat(64), sources: quote().sources, payment_option_id: providerId, return_url: "https://merchant.example/return" };
  const admin = createAdmin({ baseUrl: apiUrl, apiToken: "arky_api_cart" });
  const storefront = createStorefront(publishableKey, { apiUrl, locale: "bs", sessionStorage: sessionStorage() });
  for (const [client, target] of [[admin, { store_id: STORE_ID }], [storefront, {}]]) {
    await assert.rejects(client.eshop.cart.checkout({ ...target, ...request }), (error) => error.statusCode === 409 && error.name === "CartPresentationChangedError");
  }
  assert.equal(calls.length, 2);
  assert.equal(calls[0].path, `/v1/stores/${STORE_ID}/carts/accept`);
  assert.equal(calls[1].path, "/v1/storefront/carts/accept");
  const { id, locale, ...payload } = request;
  const adminBody = { ...payload, locale };
  const storefrontBody = payload;
  assert.deepEqual(calls.map((call) => call.body), [adminBody, storefrontBody]);
  assert.ok(calls.every((call) => call.path.endsWith("/carts/accept")));
});

test("initialize handles a SubscriptionPlan-only Cart through quote and exact reviewed checkout", async () => {
  const store = initialize(publishableKey, { apiUrl, locale: "bs", market: "bih", sessionStorage: sessionStorage() });
  const current = cart();
  store.eshop.cart.cart.set(current);
  store.eshop.cart.subscription_plan_items.set(cartSubscriptionPlanItems(current));
  assert.equal(store.eshop.cart.snapshot.get().item_count, 1);
  const result = { order_id: orderId, number: "1001", payment: null, payment_action: { type: "none" } };
  let checkoutRequestId;
  const calls = capture((call) => {
    if (call.url.pathname.endsWith("/quote")) return quote();
    if (call.url.pathname.endsWith("/carts/accept")) {
      checkoutRequestId = call.body.request_id;
      return result;
    }
    if (call.method === "GET") return { id: orderId, source: { type: "cart_acceptance", request_id: checkoutRequestId, submission_fingerprint: "e".repeat(64), initial_payment_id: null, cart: quote().sources.cart, converted_lines: quote().sources.converted_lines } };
    return current;
  });
  await assert.rejects(store.eshop.cart.checkout({ request_id: "7a1e5c39-4b82-4d60-9f17-3c8e2a6d0b54" }), /Review a Cart quote/);
  assert.equal(calls.length, 0);
  assert.deepEqual(await store.eshop.cart.quote(), quote());
  assert.deepEqual(await store.eshop.cart.checkout({ request_id: "7a1e5c39-4b82-4d60-9f17-3c8e2a6d0b54", clear_after_checkout: false }), result);
  assert.equal(checkoutRequestId, "7a1e5c39-4b82-4d60-9f17-3c8e2a6d0b54");
  assert.deepEqual(calls[0].body.line_items, [
    { type: "subscription_plan", id: planLineId, ...planSelection },
  ]);
  assert.equal(calls[1].body, null);
  assert.equal(calls[1].headers.get("x-arky-locale"), "bs");
  assert.deepEqual(
    { ...calls[2].body, request_id: undefined },
    { presentation_digest: "a".repeat(64), sources: quote().sources, request_id: undefined },
  );
  assert.deepEqual(calls.map((call) => call.method), ["PUT", "POST", "POST", "GET"]);
  assert.equal(calls[3].url.pathname, `/v1/storefront/orders/${orderId}`);
  assert.deepEqual(store.eshop.cart.cart.get(), null);
  assert.deepEqual(
    store.eshop.cart.last_order.get().subscription_plan_items,
    cartSubscriptionPlanItems(current),
  );
});

test("Admin and storefront future delivery review preserve choices and accepted quote evidence", async () => {
  const choice = { id: "delivery", entitlement_ids: ["milk"], destination: { type: "pickup", store_location_id: "warehouse" }, shipping_rate_id: "rate" };
  const plans = [{ cart_line_item_id: planLineId, deliveries: [choice] }];
  const acceptance = { quote_digest: "signed", customer_subtotal: { amount: 500, currency: "bam" }, expires_at: 1900000000000, cart_version: "version" };
  const acceptedPlans = [{ cart_line_item_id: planLineId, deliveries: [{ ...choice, quote_acceptance: acceptance }] }];
  const reviewed = { cart: { cart_id: cartId, version: "revision" }, cart_version: "version", quoted_at: 1800000000000, plans: [] };
  const calls = capture((call) => call.method === "POST" ? reviewed : cart());
  const admin = createAdmin({ baseUrl: apiUrl, apiToken: "arky_api_cart", locale: "bs" });
  const client = createStorefront(publishableKey, { apiUrl, locale: "bs", market: "bih", sessionStorage: sessionStorage() });
  assert.deepEqual(await admin.eshop.cart.quoteFutureDeliveries({ store_id: STORE_ID, id: "cart/one", plans }), reviewed);
  await admin.eshop.cart.acceptFutureDeliveries({ store_id: STORE_ID, id: "cart/one", locale: "en", plans: acceptedPlans });
  assert.deepEqual(await client.eshop.cart.quoteFutureDeliveries({ id: "cart/one", store_id: "spoof", locale: "spoof", plans }), reviewed);
  await client.eshop.cart.acceptFutureDeliveries({ id: "cart/one", store_id: "spoof", locale: "spoof", plans: acceptedPlans });
  assert.deepEqual(calls.map((call) => [call.method, call.url.pathname]), [
    ["POST", `/v1/stores/${STORE_ID}/carts/cart%2Fone/future-delivery-quote`],
    ["PUT", `/v1/stores/${STORE_ID}/carts/cart%2Fone/future-deliveries`],
    ["POST", "/v1/storefront/carts/cart%2Fone/future-delivery-quote"],
    ["PUT", "/v1/storefront/carts/cart%2Fone/future-deliveries"],
  ]);
  assert.deepEqual(calls.map((call) => call.body), [{ locale: "bs", plans }, { locale: "en", plans: acceptedPlans }, { plans }, { plans: acceptedPlans }]);
  assert.equal(calls[2].headers.get("x-arky-locale"), "bs");
});

test("initialize accepts future promises into the loaded Cart and clears its purchase review", async () => {
  const store = initialize(publishableKey, { apiUrl, locale: "bs", market: "bih", sessionStorage: sessionStorage() });
  store.eshop.cart.cart.set(cart());
  store.eshop.cart.quote_result.set(quote());
  const plans = [{ cart_line_item_id: planLineId, deliveries: [] }];
  const reviewed = { cart: { cart_id: cartId, version: "revision" }, cart_version: "version", quoted_at: 1800000000000, plans: [] };
  const updated = { ...cart(), updated_at: 2 };
  const calls = capture((call) => call.method === "POST" ? reviewed : updated);
  assert.deepEqual(await store.eshop.cart.quoteFutureDeliveries({ plans }), reviewed);
  assert.notEqual(store.eshop.cart.quote_result.get(), null);
  assert.deepEqual(await store.eshop.cart.acceptFutureDeliveries({ plans }), updated);
  assert.deepEqual(store.eshop.cart.cart.get(), updated);
  assert.equal(store.eshop.cart.quote_result.get(), null);
  assert.deepEqual(calls.map((call) => call.body), [{ plans }, { plans }]);
});

test("initialize rejects a late future delivery preview after Cart edits", async () => {
  const store = initialize(publishableKey, { apiUrl, locale: "bs", market: "bih", sessionStorage: sessionStorage() });
  store.eshop.cart.cart.set(cart());
  let release;
  let started;
  const pending = new Promise((resolve) => { release = resolve; });
  const entered = new Promise((resolve) => { started = resolve; });
  globalThis.fetch = async () => { started(); return pending; };
  const review = store.eshop.cart.quoteFutureDeliveries({ plans: [] });
  await entered;
  store.eshop.cart.clearLocal();
  release(Response.json({ cart: { cart_id: cartId, version: "revision" }, cart_version: "version", quoted_at: 1, plans: [] }));
  await assert.rejects(review, /Cart selections or language changed/);
  assert.equal(store.eshop.cart.cart.get(), null);
});

test("Cart controller forwards SubscriptionPlan selection and caller-reviewed checkout without implicit quoting", async () => {
  const calls = [];
  const controller = createCartController({
    current: async () => cart(),
    addSubscriptionPlan: async (input) => { calls.push(input); return cart(); },
    quote: async () => { throw new Error("Must not quote implicitly"); },
    checkout: async (input) => { calls.push(input); return { order_id: "order", number: "1001", payment: null, payment_action: { type: "none" } }; },
  });
  await controller.init({ store_id: STORE_ID });
  await controller.addSubscriptionPlan({ store_id: STORE_ID, subscription_plan: planSelection });
  const reviewed = { store_id: STORE_ID, request_id: checkoutRequestId, locale: "bs", presentation_digest: "a".repeat(64), sources: quote().sources };
  await controller.checkout(reviewed);
  assert.deepEqual(calls, [
    { id: cartId, store_id: STORE_ID, subscription_plan: planSelection },
    { id: cartId, ...reviewed },
  ]);
});
