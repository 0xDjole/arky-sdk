import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";
import { storefrontSessionStorage } from "./helpers/storefront-session-storage.mjs";

const storeId = "3b21b61d-7162-414c-a73a-888ccbc57c3e";
const id = "d65211c1-743f-45fb-ab24-07221b1e3a7c";
const requestId = "41d550d0-387b-4f24-b17a-87992ebcb3f9";

test("first-order review and sealing retain explicit terms while repeat uses current storefront scope", async (context) => {
  const calls = [];
  const created = { cart: { id, first_order_terms: null, repeat_order_source: null }, recovery_token: requestId };
  context.mock.method(globalThis, "fetch", async (input, options) => {
    calls.push({ url: new URL(input.toString()), method: options.method, body: options.body && JSON.parse(options.body), headers: new Headers(options.headers) });
    return Response.json(created);
  });
  const api = createAdmin({ baseUrl: "https://api.example.test", apiToken: "contract", locale: "en" });
  const review = { request_id: requestId, version_id: id, expected_updated_at: 123, presentation_digest: "a".repeat(64), locale: null, supersedes: { cart_id: requestId, version_id: id, terms_digest: `v1:sha256:${"b".repeat(64)}` } };
  await api.eshop.cart.reviewFirstOrderTerms({ store_id: storeId, id, ...review });
  assert.equal(calls[0].url.pathname, `/v1/stores/${storeId}/carts/${id}/first-order-terms/review`);
  assert.deepEqual(calls[0].body, review);
  const seal = { request_id: requestId, version_id: id, terms_digest: `v1:sha256:${"c".repeat(64)}`, expected_updated_at: 124 };
  await api.eshop.cart.sealFirstOrderTerms({ store_id: storeId, id, ...seal });
  assert.equal(calls[1].url.pathname, `/v1/stores/${storeId}/carts/${id}/first-order-terms/seal`);
  assert.deepEqual(calls[1].body, seal);
  const token = `customer_visitor_${"r".repeat(64)}`;
  const sessionStorage = storefrontSessionStorage(JSON.stringify({
    version: 2,
    customer: { id, status: { type: "active" }, identities: [], categories: [], created_at: 1, updated_at: 1 },
    session: { id: requestId, customer_id: id, type: "visitor", token, status: { type: "active" }, expires_at: 1900000000000 },
  }));
  const publishableKey = `arky_pk_${"r".repeat(42)}A`;
  const shop = createStorefront(publishableKey, { apiUrl: "https://api.example.test", sessionStorage });
  const repeat = { request_id: id, recovery_token: requestId, company_id: id, company_location_id: requestId };
  assert.deepEqual(await shop.eshop.cart.repeat({ ...repeat, market_id: "forged", customer_id: "forged", store_id: "forged" }), created);
  assert.equal(calls[2].url.pathname, "/v1/storefront/carts/repeat");
  assert.deepEqual(calls[2].body, repeat);
  assert.equal(calls[2].headers.get("x-arky-publishable-key"), publishableKey);
  assert.equal(calls[2].headers.get("authorization"), `Bearer ${token}`);
});

test("reservation and private Form processing preserve explicit scope and decision evidence", async (context) => {
  const calls = [];
  const response = { customer: { id }, identity: { id, email_claim: { type: "reserved", reserved_at: 1 } } };
  context.mock.method(globalThis, "fetch", async (input, options) => {
    calls.push({ url: new URL(input.toString()), method: options.method, body: JSON.parse(options.body) });
    return Response.json(response);
  });
  const api = createAdmin({ baseUrl: "https://api.example.test", apiToken: "contract" });
  assert.deepEqual(await api.customers.resolveOrReserveEmail({ store_id: storeId, email: "partner@example.test", customer_id: id }), response);
  assert.equal(calls[0].url.pathname, `/v1/stores/${storeId}/customers/resolve-or-reserve`);
  assert.equal(calls[0].method, "POST");
  assert.deepEqual(calls[0].body, { email: "partner@example.test", customer_id: id });
  const decision = { type: "rejected", reason: "Missing branch details", note: null, expected_processed_at: 123 };
  await api.forms.processSubmission({ store_id: storeId, form_id: id, id: requestId, ...decision });
  assert.equal(calls[1].url.pathname, `/v1/stores/${storeId}/forms/${id}/submissions/${requestId}/process`);
  assert.deepEqual(calls[1].body, decision);
});

test("Notification configuration and delivery history transport only their public contracts", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (input, options) => {
    calls.push({ url: new URL(input.toString()), method: options.method, body: options.body && JSON.parse(options.body), headers: new Headers(options.headers) });
    return Response.json(options.method === "GET" ? { items: [], cursor: "opaque:+/=" } : { id });
  });
  const api = createAdmin({ baseUrl: "https://api.example.test", apiToken: "contract" });
  const config = { key: "partner-access", name: null, purpose: { type: "partner_access" }, recipient: { type: "prepared_customer" }, channel: { type: "email", sender: { type: "platform" }, template_id: requestId }, active: true, expected_updated_at: null };
  await api.notification.save({ store_id: storeId, id, ...config });
  assert.equal(calls[0].method, "PUT");
  assert.equal(calls[0].url.pathname, `/v1/stores/${storeId}/notifications/${id}`);
  assert.deepEqual(calls[0].body, config);
  const signal = new AbortController().signal;
  await api.notification.delivery.find({ store_id: storeId, limit: 25, cursor: "opaque:+/=" }, { signal, headers: { "x-request-trace": "delivery-contract" } });
  assert.equal(calls[1].url.pathname, `/v1/stores/${storeId}/notification-deliveries`);
  assert.equal(calls[1].url.searchParams.get("cursor"), "opaque:+/=");
  assert.equal(calls[1].url.searchParams.get("limit"), "25");
  assert.equal(calls[1].url.searchParams.has("store_id"), false);
  assert.equal(calls[1].body, undefined);
  assert.equal(calls[1].headers.get("x-request-trace"), "delivery-contract");
  await api.notification.preview({ store_id: storeId, id, data: { customer: { id } } });
  assert.equal(calls[2].url.pathname, `/v1/stores/${storeId}/notifications/${id}/preview`);
  assert.deepEqual(calls[2].body, { data: { customer: { id } } });
  await api.notification.delivery.stop({ store_id: storeId, id, expected_updated_at: 123 });
  assert.equal(calls[3].url.pathname, `/v1/stores/${storeId}/notification-deliveries/${id}/stop`);
  assert.deepEqual(calls[3].body, { expected_updated_at: 123 });
});

test("requirement amendments and branch minimum reads use the owning routes", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (input, options) => {
    calls.push({ url: new URL(input.toString()), method: options.method, body: options.body && JSON.parse(options.body) });
    return Response.json([]);
  });
  const api = createAdmin({ baseUrl: "https://api.example.test", apiToken: "contract" });
  const changes = [{ request_id: requestId, subscription_id: id, expected_updated_at: 100, effective_at: 200, previous: null, current: { unit: { type: "count" }, minimum_quantity: 10, period: { type: "calendar_month", timezone: "Europe/Sarajevo" }, qualifying_variants: [{ source_product_id: id, source_variant_id: requestId, contribution_per_unit: 1 }] } }];
  await api.eshop.subscription.changePurchaseRequirements({ store_id: storeId, company_id: id, changes });
  assert.equal(calls[0].url.pathname, `/v1/stores/${storeId}/subscriptions/purchase-requirements`);
  assert.deepEqual(calls[0].body, { company_id: id, changes });
  await api.companies.location.minimumProgress({ store_id: storeId, company_id: id, company_location_id: requestId });
  assert.equal(calls[1].url.pathname, `/v1/stores/${storeId}/companies/${id}/locations/${requestId}/minimum-progress`);
  assert.equal(calls[1].method, "GET");
  assert.equal(calls[1].body, undefined);
});
