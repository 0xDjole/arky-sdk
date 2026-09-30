import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/index.js";

const STORE_ID = "d2a64f1b-8c37-4e59-b0a1-6f3e9c7d2b84";

test("financial discovery preserves combined scope, status, ordering and opaque continuations", async () => {
  const before = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method || "GET" });
    return Response.json({ items: [], cursor: "next-page+/=" });
  };
  try {
    const client = createAdmin({ baseUrl: "https://financial.example.test", apiToken: "arky_api_finance" });
    const filter = { order_id: "order-finance", status: "unknown", sort_field: "updated_at", sort_direction: "asc", limit: 25, cursor: "opaque+/= č" };
    assert.deepEqual(await client.eshop.payment.find({ store_id: STORE_ID, ...filter }), { items: [], cursor: "next-page+/=" });
    assert.deepEqual(await client.eshop.refund.find({ store_id: STORE_ID, ...filter, payment_id: "payment-finance" }), { items: [], cursor: "next-page+/=" });
    for (const call of calls) {
      assert.equal(call.method, "GET");
      for (const [key, value] of Object.entries(filter)) assert.equal(call.url.searchParams.get(key), String(value));
      assert.equal(call.url.searchParams.has("store_id"), false);
    }
    assert.equal(calls[0].url.pathname, `/v1/stores/${STORE_ID}/payments`);
    assert.equal(calls[1].url.pathname, `/v1/stores/${STORE_ID}/refunds`);
    assert.equal(calls[1].url.searchParams.get("payment_id"), "payment-finance");
    await client.eshop.order.findPayments({ store_id: STORE_ID, ...filter, order_id: "order/a" });
    await client.eshop.order.getPayment({ store_id: STORE_ID, order_id: "order/a", payment_id: "payment/b" });
    assert.equal(calls[2].url.pathname, `/v1/stores/${STORE_ID}/orders/order%2Fa/payments`);
    assert.equal(calls[2].url.searchParams.get("store_id"), null);
    assert.equal(calls[2].url.searchParams.get("order_id"), null);
    assert.equal(calls[2].url.searchParams.get("cursor"), filter.cursor);
    assert.equal(calls[3].url.pathname, `/v1/stores/${STORE_ID}/orders/order%2Fa/payments/payment%2Fb`);
    assert.equal(calls[3].method, "GET");
    const disputes = { payment_id: "payment-finance", status: "under_review", sort_field: "updated_at", sort_direction: "asc", limit: 25, cursor: filter.cursor };
    assert.deepEqual(await client.eshop.dispute.find({ store_id: STORE_ID, ...disputes }), { items: [], cursor: "next-page+/=" });
    assert.equal(calls[4].url.pathname, `/v1/stores/${STORE_ID}/disputes`);
    assert.equal(calls[4].method, "GET");
    for (const [key, value] of Object.entries(disputes)) assert.equal(calls[4].url.searchParams.get(key), String(value));
  } finally {
    globalThis.fetch = before;
  }
});

test("financial list failures are errors, not empty pages or replacement money commands", async () => {
  const before = globalThis.fetch;
  const methods = [];
  globalThis.fetch = async (_url, init = {}) => {
    methods.push(init.method || "GET");
    return Response.json({ message: "Discovery unavailable" }, { status: 409 });
  };
  try {
    const client = createAdmin({ baseUrl: "https://financial.example.test", apiToken: "arky_api_finance" });
    await assert.rejects(client.eshop.payment.find({ store_id: STORE_ID }), (error) => error.statusCode === 409);
    await assert.rejects(client.eshop.refund.find({ store_id: STORE_ID }), (error) => error.statusCode === 409);
    await assert.rejects(client.eshop.dispute.find({ store_id: STORE_ID }), (error) => error.statusCode === 409);
    assert.deepEqual(methods, ["GET", "GET", "GET"]);
    for (const api of [client.eshop.payment, client.eshop.refund, client.eshop.dispute]) {
      await assert.rejects(async () => api.find({}), { name: "TypeError", message: "A Store target must be an explicit canonical UUID-v4" });
    }
    assert.deepEqual(methods, ["GET", "GET", "GET"]);
  } finally {
    globalThis.fetch = before;
  }
});
