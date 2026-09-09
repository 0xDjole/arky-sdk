import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { createAdmin, createCartController } from "../dist/index.js";
import { createStorefront, initialize } from "../dist/storefront.js";

const apiUrl = "https://api.example.test";
const publishableKey = `arky_pk_${"c".repeat(43)}`;
const visitorToken = `customer_visitor_${"c".repeat(64)}`;
const cartId = "9f1b6e23-e2ea-4ab9-a1b7-eaaf550ddf41";
const orderId = "2b815d21-78be-431a-b49c-0d5d62c87823";
const providerId = "4a2c7c0d-4389-4aae-b3d7-02ff834a024d";
const savedFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = savedFetch; });

function sessionStorage() {
  const value = JSON.stringify({
    version: 2,
    customer: { id: "customer", status: "active", identities: [], classifications: [], created_at: 1, updated_at: 1 },
    session: { id: "session", customer_id: "customer", type: "visitor", token: visitorToken, status: "active", expires_at: 1900000000000 },
  });
  return { getItem: () => value, setItem() {}, removeItem() {} };
}

function cart() {
  return {
    id: cartId, customer_id: "customer", company_id: "company", company_location_id: "location",
    market_id: "market", sales_channel_id: "channel", token: "recovery",
    status: { type: "active" },
    origin: { type: "storefront", customer_id: "customer", customer_session_id: "session" },
    product_items: [], booking_items: [], digital_items: [],
    audience_items: [{ id: "audience-item", audience_id: "audience", membership_id: "membership" }],
    shipping_address: null, billing_address: null, promo_code: null, payment_provider_id: null,
    shipping_method_id: null, converted_order_id: null, item_count: 1,
    last_action_at: 1, abandoned_at: null, created_at: 1, updated_at: 1,
  };
}

function quote() {
  return {
    context: {
      market_id: "market", sales_channel_id: "channel", sales_channel_snapshot: { key: "web", name: "Web" },
      customer_id: "customer", customer_snapshot: { email: null, authentication: { type: "visitor" } },
      company_id: "company", company_location_id: "location",
      company_snapshot: { name: "Company", legal_name: null, registration_number: null, tax_number: null, contact_email: null },
      origin: cart().origin,
    },
    locale: "bs", presentation_digest: "a".repeat(64),
    product_lines: [], booking_lines: [], digital_lines: [],
    audience_lines: [{
      audience_id: "audience", membership_id: "membership",
      snapshot: {
        audience_key: "members", audience_name: { text: "Members", locale: "bs" },
        price: {
          unit_price: { amount: 0, currency: "bam" }, compare_at: null, billing: { type: "one_time" },
          min_quantity: 1, max_quantity: null, source: { type: "base", price_id: "price" }, priced_at: 1,
        },
      },
      money: { unit_price: 0, subtotal: 0, discount_allocations: [], discount_total: 0, taxable_base: 0, tax_lines: [], tax_total: 0, total: 0 },
    }],
    shipping_lines: [], shipping_methods: [], payment_provider_id: null, payment_provider_ids: [],
    money: { currency: "bam", market: "bih", subtotal: 0, shipping: 0, discount: 0, tax_total: 0, total: 0, promo_code: null, zone_id: null, shipping_method_id: null },
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
  const calls = capture();
  const admin = createAdmin({ baseUrl: apiUrl, storeId: "store/one", apiToken: "arky_api_cart", locale: "bs" });
  const selection = { customer_id: null, company_id: "company", company_location_id: "location", market_id: "market", sales_channel_id: "channel" };
  await admin.eshop.cart.create(selection);
  assert.deepEqual(calls[0].body, { ...selection, product_items: [], booking_items: [], digital_items: [], audience_items: [] });
  assert.equal(calls[0].url.pathname, "/v1/stores/store%2Fone/carts");
  const patch = { company_id: null, company_location_id: null, customer_id: "customer", audience_items: [], shipping_address: null };
  await admin.eshop.cart.update({ id: "cart/one", ...patch });
  assert.deepEqual(calls[1].body, patch);
  assert.equal(calls[1].url.pathname, "/v1/stores/store%2Fone/carts/cart%2Fone");
  await admin.eshop.cart.addAudience({ id: "cart", audience: { audience_id: "audience", membership_id: "membership" } });
  assert.deepEqual(calls[2].body, { audience: { audience_id: "audience", membership_id: "membership" } });
  admin.setStoreId("store/two");
  await admin.eshop.cart.find({ statuses: ["active"], origins: ["admin"] });
  assert.equal(calls[3].url.pathname, "/v1/stores/store%2Ftwo/carts");
  assert.deepEqual(JSON.parse(calls[3].url.searchParams.get("statuses")), ["active"]);
  assert.deepEqual(JSON.parse(calls[3].url.searchParams.get("origins")), ["admin"]);
});

test("Admin quotes send configured or explicit locale and retain resolved quote context", async () => {
  const expected = quote();
  const calls = capture(() => expected);
  const admin = createAdmin({ baseUrl: apiUrl, storeId: "store", apiToken: "arky_api_cart", locale: "bs" });
  assert.deepEqual(await admin.eshop.cart.quote({ id: "cart" }), expected);
  assert.deepEqual(calls[0].body, { locale: "bs" });
  await admin.eshop.cart.quote({ id: "cart", locale: "en" });
  assert.deepEqual(calls[1].body, { locale: "en" });
  await admin.eshop.order.getQuote({ company_id: "company", company_location_id: "location", sales_channel_id: "channel", market: "bih", currency: "bam", audiences: [{ audience_id: "audience", membership_id: "membership" }] });
  assert.deepEqual(calls[2].body, { locale: "bs", company_id: "company", company_location_id: "location", sales_channel_id: "channel", market: "bih", currency: "bam", audiences: [{ audience_id: "audience", membership_id: "membership" }], products: [], bookings: [], digital: [] });
});

test("Storefront Cart permits explicit Company selection but strips browser authority and overrides", async () => {
  const calls = capture();
  const client = createStorefront(publishableKey, { apiUrl, locale: "bs", market: "bih", sessionStorage: sessionStorage() });
  await client.eshop.cart.current({ company_id: "company", company_location_id: "location", customer_id: "spoof", market_id: "spoof" });
  assert.deepEqual(calls[0].body, { company_id: "company", company_location_id: "location" });
  const override = { money: { amount: 1, currency: "bam" }, reason: "browser" };
  await client.eshop.cart.update({
    id: "cart", customer_id: "spoof", store_id: "spoof", origin: { type: "admin" }, company_id: null, company_location_id: null,
    product_items: [{ product_id: "product", variant_id: "variant", quantity: 0, price_override: override }],
    booking_items: [{ booking_offering_id: "offering", requested_interval: { from: 0, to: 60000 }, price_override: override }],
    digital_items: [{ digital_product_id: "digital", name_block_id: "name", form_submission_id: null, price_override: override }],
    audience_items: [{ audience_id: "audience", membership_id: "membership", price_override: override }],
  });
  assert.deepEqual(calls[1].body, {
    company_id: null, company_location_id: null,
    product_items: [{ product_id: "product", variant_id: "variant", quantity: 0 }],
    booking_items: [{ booking_offering_id: "offering", requested_interval: { from: 0, to: 60000 } }],
    digital_items: [{ digital_product_id: "digital", name_block_id: "name", form_submission_id: null }],
    audience_items: [{ audience_id: "audience", membership_id: "membership" }],
  });
  await client.eshop.cart.addAudience({ id: "cart/one", audience: { audience_id: "audience", membership_id: "membership", price_override: override } });
  assert.equal(calls[2].url.pathname, "/v1/storefront/carts/cart%2Fone/audience-items");
  assert.deepEqual(calls[2].body, { audience: { audience_id: "audience", membership_id: "membership" } });
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
  const request = { id: cartId, locale: "bs", presentation_digest: "b".repeat(64), payment_provider_id: providerId, return_url: "https://merchant.example/return" };
  const admin = createAdmin({ baseUrl: apiUrl, storeId: "store", apiToken: "arky_api_cart" });
  const storefront = createStorefront(publishableKey, { apiUrl, locale: "bs", sessionStorage: sessionStorage() });
  for (const client of [admin, storefront]) {
    await assert.rejects(client.eshop.cart.checkout(request), (error) => error.statusCode === 409);
  }
  assert.equal(calls.length, 2);
  const { id, ...payload } = request;
  assert.deepEqual(calls.map((call) => call.body), [payload, payload]);
  assert.ok(calls.every((call) => call.path.endsWith(`/carts/${cartId}/checkout`)));
});

test("initialize handles an Audience-only Cart through quote and exact reviewed checkout", async () => {
  const store = initialize(publishableKey, { apiUrl, locale: "bs", market: "bih", sessionStorage: sessionStorage() });
  const current = cart();
  store.eshop.cart.cart.set(current);
  store.eshop.cart.audience_items.set(current.audience_items);
  assert.equal(store.eshop.cart.snapshot.get().item_count, 1);
  const result = { order_id: orderId, number: "1001", payment: null, payment_action: { type: "none" } };
  const calls = capture((call) => call.url.pathname.endsWith("/quote") ? quote() : call.url.pathname.endsWith("/checkout") ? result : call.method === "GET" ? { ...current, status: { type: "converted" }, converted_order_id: orderId } : current);
  await assert.rejects(store.eshop.cart.checkout(), /Review a Cart quote/);
  assert.equal(calls.length, 0);
  assert.deepEqual(await store.eshop.cart.quote(), quote());
  assert.deepEqual(await store.eshop.cart.checkout({ clear_after_checkout: false }), result);
  assert.deepEqual(calls[0].body.audience_items, current.audience_items);
  assert.deepEqual(calls[1].body, { locale: "bs" });
  assert.deepEqual(calls[2].body, { locale: "bs", presentation_digest: "a".repeat(64) });
  assert.deepEqual(calls.map((call) => call.method), ["PUT", "POST", "POST", "GET"]);
  assert.equal(calls[3].url.pathname, `/v1/storefront/carts/${cartId}`);
  assert.deepEqual(store.eshop.cart.cart.get().status, { type: "converted" });
  assert.deepEqual(store.eshop.cart.last_order.get().audience_items, current.audience_items);
});

test("Cart controller forwards Audience selection and caller-reviewed checkout without implicit quoting", async () => {
  const calls = [];
  const controller = createCartController({
    current: async () => cart(),
    addAudience: async (input) => { calls.push(input); return cart(); },
    quote: async () => { throw new Error("Must not quote implicitly"); },
    checkout: async (input) => { calls.push(input); return { order_id: "order", number: "1001", payment: null, payment_action: { type: "none" } }; },
  });
  await controller.init();
  await controller.addAudience({ audience: { audience_id: "audience", membership_id: "membership" } });
  await controller.checkout({ locale: "bs", presentation_digest: "a".repeat(64) });
  assert.deepEqual(calls, [
    { id: cartId, audience: { audience_id: "audience", membership_id: "membership" } },
    { id: cartId, locale: "bs", presentation_digest: "a".repeat(64) },
  ]);
});
