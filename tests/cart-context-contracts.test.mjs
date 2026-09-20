import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { createAdmin, createCartController, cartCustomerGroupPlanItems } from "../dist/index.js";
import { createStorefront, initialize } from "../dist/storefront.js";
import { checkoutSources } from "./helpers/checkout-sources.mjs";
import { storefrontSessionStorage } from "./helpers/storefront-session-storage.mjs";

const apiUrl = "https://api.example.test";
const publishableKey = `arky_pk_${"c".repeat(43)}`;
const visitorToken = `customer_visitor_${"c".repeat(64)}`;
const cartId = "9f1b6e23-e2ea-4ab9-a1b7-eaaf550ddf41";
const orderId = "2b815d21-78be-431a-b49c-0d5d62c87823";
const checkoutId = "3e6b7f70-4d2f-4f0e-9b7b-5d3b6c0a51d2";
const providerId = "4a2c7c0d-4389-4aae-b3d7-02ff834a024d";
const savedFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = savedFetch; });

function sessionStorage() {
  const value = JSON.stringify({
    version: 2,
    customer: { id: "customer", status: "active", identities: [], classifications: [], created_at: 1, updated_at: 1 },
    session: { id: "session", customer_id: "customer", type: "visitor", token: visitorToken, status: "active", expires_at: 1900000000000 },
  });
  return storefrontSessionStorage(value);
}

const planId = "0b3e9c17-5a2d-4f86-9e01-7c4b6d2a8f35";
const planLineId = "19f4bc18-4259-46b8-b5ef-3579d1dac971";
const planSelection = {
  customer_group_plan_id: planId,
  member: { type: "customer", customer_id: "customer" },
  start: { type: "on_acceptance" },
  deliveries: [],
};

function cart() {
  return {
    id: cartId, store_id: "store", customer_id: "customer",
    company: { company_id: "company", company_location_id: "location" },
    market_id: "market", sales_channel_id: "channel",
    status: { type: "active" },
    origin: { type: "storefront", customer_id: "customer", customer_session_id: "session" },
    line_items: [{ type: "customer_group_plan", id: planLineId, ...planSelection, price_override: null }],
    delivery_groups: [], billing_address: null, promotion_code_ids: [],
    purchase_order_number: null, item_count: 1,
    last_action_at: 1, abandoned_at: null, created_at: 1, updated_at: 1,
  };
}

function quote() {
  return {
    sources: checkoutSources(cartId, "customer_group_plan", planLineId),
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
    seller: { profile: { legal_name: "Seller", tax_identifier: null, address: { country: "BA" } }, configuration_digest: "a".repeat(64) },
    invoice_policy: { type: "external" },
    timezone: "Europe/Sarajevo",
    payment_terms: null,
    purchase_order_number: null,
    locale: "bs", presentation_digest: "c".repeat(64),
    delivery_quote_version: "v1",
    product_lines: [], booking_lines: [], digital_lines: [],
    customer_group_lines: [{
      line_item_id: planLineId,
      member: planSelection.member,
      starts_at: 1,
      terms: { plan: {}, deliveries: [], billing_address: null },
      occurrence: { type: "permanent", starts_at: 1 },
      benefit_lines: [],
      money: { unit_price: 0, subtotal: 0, discount_allocations: [], discount_total: 0, tax_lines: [], tax_total: 0, duty_lines: [], duty_total: 0, total: 0, tax_assessment: { type: "not_required", reason: { type: "noncommercial_customer_group_grant" }, policy_version: "v1", decided_at: 1 } },
    }],
    delivery_groups: [], payment_provider_id: null, payment_provider_ids: [],
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
  const admin = createAdmin({ baseUrl: apiUrl, storeId: "store/one", apiToken: "arky_api_cart", locale: "bs" });
  const selection = { customer_id: "customer", company: { company_id: "company", company_location_id: "location" }, market_id: "market", sales_channel_id: "channel" };
  assert.deepEqual(await admin.eshop.cart.create(selection), { cart: cart(), recovery_token: "cart-recovery-token" });
  assert.deepEqual(calls[0].body, { ...selection, line_items: [], delivery_groups: [] });
  assert.equal(calls[0].url.pathname, "/v1/stores/store%2Fone/carts");
  const patch = { company: null, billing_address: null };
  await admin.eshop.cart.update({ id: "cart/one", ...patch });
  assert.deepEqual(calls[1].body, patch);
  assert.equal(calls[1].url.pathname, "/v1/stores/store%2Fone/carts/cart%2Fone");
  await admin.eshop.cart.addCustomerGroupPlan({ id: "cart", customer_group_plan: planSelection });
  assert.deepEqual(calls[2].body, { customer_group_plan: planSelection });
  assert.equal(calls[2].url.pathname, "/v1/stores/store%2Fone/carts/cart/customer-group-plan-items");
  admin.setStoreId("store/two");
  await admin.eshop.cart.find({ statuses: ["active"], origins: ["admin"] });
  assert.equal(calls[3].url.pathname, "/v1/stores/store%2Ftwo/carts");
  assert.deepEqual(JSON.parse(calls[3].url.searchParams.get("statuses")), ["active"]);
  assert.deepEqual(JSON.parse(calls[3].url.searchParams.get("origins")), ["admin"]);
});

test("Cart discovery preserves combined predicates, ordering and empty-page continuation", async () => {
  const calls = capture(() => ({ items: [], cursor: "next-cart-page" }));
  const admin = createAdmin({ baseUrl: apiUrl, storeId: "store", apiToken: "arky_api_cart" });
  const filters = {
    customer_id: "customer", statuses: ["active", "checking_out"], origins: ["admin", "storefront"],
    has_items: false, sort_field: "updated_at", sort_direction: "asc", limit: 20,
  };
  const first = await admin.eshop.cart.find(filters);
  assert.deepEqual(first, { items: [], cursor: "next-cart-page" });
  await admin.eshop.cart.find({ ...filters, cursor: first.cursor });
  for (const call of calls) {
    assert.equal(call.url.pathname, "/v1/stores/store/carts");
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
  await assert.rejects(admin.eshop.cart.find(filters));
});

test("Admin quotes send configured or explicit locale and retain resolved quote context", async () => {
  const expected = quote();
  const calls = capture(() => expected);
  const admin = createAdmin({ baseUrl: apiUrl, storeId: "store", apiToken: "arky_api_cart", locale: "bs" });
  assert.deepEqual(await admin.eshop.cart.quote({ id: "cart" }), expected);
  assert.deepEqual(calls[0].body, { locale: "bs" });
  await admin.eshop.cart.quote({ id: "cart", locale: "en" });
  assert.deepEqual(calls[1].body, { locale: "en" });
  await admin.eshop.order.getQuote({ company_id: "company", company_location_id: "location", sales_channel_id: "channel", market: "bih", currency: "bam", line_items: [{ type: "customer_group_plan", ...planSelection }] });
  assert.deepEqual(calls[2].body, { locale: "bs", company_id: "company", company_location_id: "location", sales_channel_id: "channel", market: "bih", currency: "bam", line_items: [{ type: "customer_group_plan", ...planSelection }], delivery_groups: [] });
});

test("Storefront Cart permits explicit Company selection but strips browser authority and overrides", async () => {
  const calls = capture((call) => call.method === "POST" && call.url.pathname.endsWith("/carts")
    ? { cart: cart(), recovery_token: "cart-recovery-token" } : cart());
  const client = createStorefront(publishableKey, { apiUrl, locale: "bs", market: "bih", sessionStorage: sessionStorage() });
  await client.eshop.cart.current({ company: { company_id: "company", company_location_id: "location", extra: "spoof" }, customer_id: "spoof", market_id: "spoof" });
  assert.equal(calls[0].url.pathname, "/v1/storefront/carts");
  assert.deepEqual(calls[0].body, { company: { company_id: "company", company_location_id: "location" } });
  const override = { money: { amount: 1, currency: "bam" }, reason: "browser" };
  await client.eshop.cart.update({
    id: "cart", customer_id: "spoof", store_id: "spoof", origin: { type: "admin" }, company: null,
    line_items: [
      { type: "product", product_id: "product", variant_id: "variant", quantity: 0, price_override: override },
      { type: "booking", booking_offering_id: "offering", requested_interval: { from: 0, to: 60000 }, price_override: override },
      { type: "digital_product", digital_product_id: "digital", beneficiary_customer_id: "customer", form_submission_id: null, price_override: override },
      { type: "customer_group_plan", ...planSelection, price_override: override },
    ],
  });
  assert.deepEqual(calls[1].body, {
    company: null,
    line_items: [
      { type: "product", product_id: "product", variant_id: "variant", quantity: 0 },
      { type: "booking", booking_offering_id: "offering", requested_interval: { from: 0, to: 60000 } },
      { type: "digital_product", digital_product_id: "digital", beneficiary_customer_id: "customer", form_submission_id: null },
      { type: "customer_group_plan", ...planSelection },
    ],
  });
  await client.eshop.cart.addCustomerGroupPlan({ id: "cart/one", customer_group_plan: { ...planSelection, price_override: override } });
  assert.equal(calls[2].url.pathname, "/v1/storefront/carts/cart%2Fone/customer-group-plan-items");
  assert.deepEqual(calls[2].body, { customer_group_plan: planSelection });
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
  const request = { id: cartId, request_id: "5d2f1c8b-6a4e-4c39-9b71-2f8e0d47a3c6", locale: "bs", presentation_digest: "b".repeat(64), sources: quote().sources, payment_provider_id: providerId, return_url: "https://merchant.example/return" };
  const admin = createAdmin({ baseUrl: apiUrl, storeId: "store", apiToken: "arky_api_cart" });
  const storefront = createStorefront(publishableKey, { apiUrl, locale: "bs", sessionStorage: sessionStorage() });
  for (const client of [admin, storefront]) {
    await assert.rejects(client.eshop.cart.checkout(request), (error) => error.statusCode === 409);
  }
  assert.equal(calls.length, 2);
  const { id, locale, ...payload } = request;
  const adminBody = { ...payload, locale };
  const storefrontBody = payload;
  assert.deepEqual(calls.map((call) => call.body), [adminBody, storefrontBody]);
  assert.ok(calls.every((call) => call.path.endsWith("/checkouts")));
});

test("initialize handles a CustomerGroupPlan-only Cart through quote and exact reviewed checkout", async () => {
  const store = initialize(publishableKey, { apiUrl, locale: "bs", market: "bih", sessionStorage: sessionStorage() });
  const current = cart();
  store.eshop.cart.cart.set(current);
  store.eshop.cart.customer_group_plan_items.set(cartCustomerGroupPlanItems(current));
  assert.equal(store.eshop.cart.snapshot.get().item_count, 1);
  const result = { checkout_id: checkoutId, order_id: orderId, number: "1001", payment: null, payment_action: { type: "none" } };
  let checkoutRequestId;
  const calls = capture((call) => {
    if (call.url.pathname.endsWith("/quote")) return quote();
    if (call.url.pathname.endsWith("/checkouts")) {
      checkoutRequestId = call.body.request_id;
      return result;
    }
    if (call.method === "GET") return { id: checkoutId, request_id: checkoutRequestId, carts: quote().sources.carts, state: { type: "accepted", accepted_at: 1, result: { order_id: orderId, bindings: quote().sources.lines } } };
    return current;
  });
  await assert.rejects(store.eshop.cart.checkout(), /Review a Cart quote/);
  assert.equal(calls.length, 0);
  assert.deepEqual(await store.eshop.cart.quote(), quote());
  assert.deepEqual(await store.eshop.cart.checkout({ clear_after_checkout: false }), result);
  assert.deepEqual(calls[0].body.line_items, [
    { type: "customer_group_plan", id: planLineId, ...planSelection },
  ]);
  assert.deepEqual(calls[1].body, {});
  assert.deepEqual(
    { ...calls[2].body, request_id: undefined },
    { presentation_digest: "a".repeat(64), sources: quote().sources, request_id: undefined },
  );
  assert.deepEqual(calls.map((call) => call.method), ["PUT", "POST", "POST", "GET"]);
  assert.equal(calls[3].url.pathname, `/v1/storefront/checkouts/${checkoutId}`);
  assert.deepEqual(store.eshop.cart.cart.get(), null);
  assert.deepEqual(
    store.eshop.cart.last_order.get().customer_group_plan_items,
    cartCustomerGroupPlanItems(current),
  );
});

test("Cart controller forwards CustomerGroupPlan selection and caller-reviewed checkout without implicit quoting", async () => {
  const calls = [];
  const controller = createCartController({
    current: async () => cart(),
    addCustomerGroupPlan: async (input) => { calls.push(input); return cart(); },
    quote: async () => { throw new Error("Must not quote implicitly"); },
    checkout: async (input) => { calls.push(input); return { order_id: "order", number: "1001", payment: null, payment_action: { type: "none" } }; },
  });
  await controller.init();
  await controller.addCustomerGroupPlan({ customer_group_plan: planSelection });
  await controller.checkout({ locale: "bs", presentation_digest: "a".repeat(64) });
  assert.deepEqual(calls, [
    { id: cartId, customer_group_plan: planSelection },
    { id: cartId, locale: "bs", presentation_digest: "a".repeat(64) },
  ]);
});
