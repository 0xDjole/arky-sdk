import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/index.js";
import { createStorefront } from "../dist/storefront.js";
import { visitorStorage } from "./helpers/arky-fixtures.mjs";

const STORE_ID = "d2a64f1b-8c37-4e59-b0a1-6f3e9c7d2b84";

test("payment discovery keeps combined scope, status, ordering and opaque continuations; refunds and disputes live inside payments", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method || "GET" });
    return Response.json(new URL(url).pathname.endsWith("/payments") && calls.length === 1 ? { items: [], cursor: "next-page+/=" } : []);
  });
  const client = createAdmin({ baseUrl: "https://financial.example.test", apiToken: "arky_api_finance" });
  const filter = { order_id: "order-finance", status: "unknown", type: "stripe_checkout", on_hold: true, updated_at_from: 5, sort_field: "updated_at", sort_direction: "asc", limit: 25, cursor: "opaque+/= č" };
  assert.deepEqual(await client.eshop.payment.find({ store_id: STORE_ID, ...filter }), { items: [], cursor: "next-page+/=" });
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].url.pathname, `/v1/stores/${STORE_ID}/payments`);
  for (const [key, value] of Object.entries(filter)) assert.equal(calls[0].url.searchParams.get(key), String(value));
  assert.equal(calls[0].url.searchParams.has("store_id"), false);
  await client.eshop.order.findPayments({ store_id: STORE_ID, order_id: "order/a" });
  await client.eshop.order.getPayment({ store_id: STORE_ID, order_id: "order/a", payment_id: "payment/b" });
  await client.eshop.order.getFinancialSummary({ store_id: STORE_ID, id: "order/a" });
  assert.deepEqual(calls.slice(1).map((call) => [call.method, call.url.pathname, call.url.search]), [
    ["GET", `/v1/stores/${STORE_ID}/orders/order%2Fa/payments`, ""],
    ["GET", `/v1/stores/${STORE_ID}/orders/order%2Fa/payments/payment%2Fb`, ""],
    ["GET", `/v1/stores/${STORE_ID}/orders/order%2Fa/financial-summary`, ""],
  ]);
  for (const removed of ["refund", "dispute", "paymentDispute", "capture"]) assert.equal(removed in client.eshop, false, removed);
});

test("a buyer reads an order's payments on the storefront by the order and payment ids only", async (context) => {
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method || "GET" });
    return Response.json([]);
  });
  const storefront = createStorefront(`arky_pk_${"f".repeat(42)}A`, { apiUrl: "https://financial.example.test", sessionStorage: visitorStorage() });
  await storefront.eshop.order.findPayments({ order_id: "order/a", store_id: "foreign" });
  await storefront.eshop.order.getPayment({ order_id: "order/a", payment_id: "payment/b" });
  assert.deepEqual(calls.map((call) => [call.method, call.url.pathname, call.url.search]), [
    ["GET", "/v1/storefront/orders/order%2Fa/payments", ""],
    ["GET", "/v1/storefront/orders/order%2Fa/payments/payment%2Fb", ""],
  ]);
});

test("financial list failures are errors, not empty pages or replacement money commands", async (context) => {
  const methods = [];
  context.mock.method(globalThis, "fetch", async (_url, init = {}) => {
    methods.push(init.method || "GET");
    return Response.json({ message: "Discovery unavailable", status_code: 409 }, { status: 409 });
  });
  const client = createAdmin({ baseUrl: "https://financial.example.test", apiToken: "arky_api_finance" });
  await assert.rejects(client.eshop.payment.find({ store_id: STORE_ID }), (error) => error.statusCode === 409);
  await assert.rejects(client.eshop.providerEvent.find({ store_id: STORE_ID }), (error) => error.statusCode === 409);
  assert.deepEqual(methods, ["GET", "GET"]);
  for (const api of [client.eshop.payment, client.eshop.providerEvent]) {
    await assert.rejects(async () => api.find({}), { name: "TypeError", message: "A Store target must be an explicit canonical UUID-v4" });
  }
  assert.deepEqual(methods, ["GET", "GET"]);
});
