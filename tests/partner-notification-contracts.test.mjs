import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";
import { apiUrl, ids, publishableKey, recordFetch, visitorStorage, visitorToken } from "./helpers/arky-fixtures.mjs";

const storeId = "3b21b61d-7162-414c-a73a-888ccbc57c3e";
const notificationId = "d65211c1-743f-45fb-ab24-07221b1e3a7c";
const templateId = "41d550d0-387b-4f24-b17a-87992ebcb3f9";

function admin() {
  return createAdmin({ baseUrl: "https://api.example.test", apiToken: "contract" });
}

test("a staff offer is made from the reviewed quote, sent in the buyer's language and withdrawn by version", async (context) => {
  const calls = recordFetch(context, () => ({ id: ids.cart }));
  const offer = admin().eshop.cart.offer;
  await offer.create({ store_id: storeId, id: ids.cart, expected_updated_at: 123, language: "bs", presentation_digest: "a".repeat(64), supersedes_cart_id: ids.otherCart });
  await offer.send({ store_id: storeId, id: ids.cart, expected_updated_at: 124, language: "bs" });
  await offer.withdraw({ store_id: storeId, id: ids.cart, expected_updated_at: 125 });
  const base = `/v1/stores/${storeId}/carts/${ids.cart}`;
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `${base}/offer`, { expected_updated_at: 123, language: "bs", presentation_digest: "a".repeat(64), supersedes_cart_id: ids.otherCart }],
    ["POST", `${base}/offer/send`, { expected_updated_at: 124, language: "bs" }],
    ["POST", `${base}/offer/withdraw`, { expected_updated_at: 125 }],
  ]);
  for (const removed of ["reviewFirstOrderTerms", "sealFirstOrderTerms", "withdrawFirstOrderTerms"]) assert.equal(removed in admin().eshop.cart, false, removed);
  assert.equal("repeat" in createStorefront(publishableKey, { apiUrl }).eshop.cart, false);
});

test("an email is resolved to its customer or reserved for the app-picked customer id", async (context) => {
  const calls = recordFetch(context, () => ({ id: ids.customer }));
  assert.deepEqual(await admin().customers.resolveOrReserveEmail({ store_id: storeId, email: "partner@example.test", customer_id: ids.customer }), { id: ids.customer });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/stores/${storeId}/customers/resolve-or-reserve`, { email: "partner@example.test", customer_id: ids.customer }],
  ]);
  await assert.rejects(async () => admin().customers.resolveOrReserveEmail({ store_id: storeId, email: "partner@example.test", customer_id: "partner" }), {
    name: "TypeError",
    message: "The customer id must be a canonical UUID v4 picked by the app",
  });
  assert.equal(calls.length, 1);
});

test("notification history and a template preview send only their own fields, and a queued notification has no stop", async (context) => {
  const calls = recordFetch(context, (call) => call.method === "GET" ? { items: [], cursor: "opaque:+/=" } : { id: notificationId });
  const api = admin().notification;
  const signal = new AbortController().signal;
  await api.find({ store_id: storeId, to: "buyer@example.test", type: "receipt_resend", order_id: ids.order, limit: 25, cursor: "opaque:+/=" }, { signal, headers: { "x-request-trace": "delivery-contract" } });
  await api.find({ store_id: storeId, type: "broadcast_email", broadcast_id: ids.form });
  await api.get({ store_id: storeId, id: notificationId });
  const content = { subject: "Narudžba {{order.number}}", preheader: null, body: "<p>{{order.number}}</p>" };
  await api.template.preview({ store_id: storeId, id: templateId, language: "bs", content });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", `/v1/stores/${storeId}/notifications`, { to: "buyer@example.test", type: "receipt_resend", order_id: ids.order, limit: "25", cursor: "opaque:+/=" }, null],
    ["GET", `/v1/stores/${storeId}/notifications`, { type: "broadcast_email", broadcast_id: ids.form }, null],
    ["GET", `/v1/stores/${storeId}/notifications/${notificationId}`, {}, null],
    ["POST", `/v1/stores/${storeId}/email-templates/${templateId}/preview`, {}, { language: "bs", content }],
  ]);
  assert.equal(calls[0].signal, signal);
  assert.equal(calls[0].headers.get("x-request-trace"), "delivery-contract");
  for (const removed of ["save", "delivery", "preview", "stop", "cancel"]) assert.equal(removed in api, false, removed);
});

test("minimum progress is read for exactly one customer, company or company location by staff and by the buyer", async (context) => {
  const locationProgress = { party: { type: "company_location", company_location_id: ids.companyLocation }, state: { type: "unavailable", reason: "no_requirement" } };
  const companyProgress = { party: { type: "company", company_id: ids.company }, state: { type: "unavailable", reason: "per_location" } };
  const calls = recordFetch(context, (call) => "company_id" in call.query ? companyProgress : locationProgress);
  assert.deepEqual(await admin().eshop.minimumProgress.get({ store_id: storeId, company_location_id: ids.companyLocation }), locationProgress);
  assert.deepEqual(await admin().eshop.minimumProgress.get({ store_id: storeId, company_id: ids.company }), companyProgress);
  await admin().eshop.minimumProgress.get({ store_id: storeId, customer_id: ids.customer });
  const shop = createStorefront(publishableKey, { apiUrl, sessionStorage: visitorStorage() });
  assert.deepEqual(await shop.eshop.minimumProgress.get({ company_id: ids.company }), companyProgress);
  assert.deepEqual(await shop.eshop.minimumProgress.get({ company_location_id: ids.companyLocation }), locationProgress);
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", `/v1/stores/${storeId}/minimum-progress`, { company_location_id: ids.companyLocation }, null],
    ["GET", `/v1/stores/${storeId}/minimum-progress`, { company_id: ids.company }, null],
    ["GET", `/v1/stores/${storeId}/minimum-progress`, { customer_id: ids.customer }, null],
    ["GET", "/v1/storefront/minimum-progress", { company_id: ids.company }, null],
    ["GET", "/v1/storefront/minimum-progress", { company_location_id: ids.companyLocation }, null],
  ]);
  for (const call of calls.slice(3)) assert.equal(call.headers.get("authorization"), `Bearer ${visitorToken}`);
  assert.equal("minimumProgress" in admin().companies, false);
  assert.equal("minimumProgress" in shop.companies, false);
});
