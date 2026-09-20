import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/index.js";

test("financial discovery preserves combined scope, status, ordering and opaque continuations", async () => {
  const before = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method || "GET" });
    return Response.json({ items: [], cursor: "next-page+/=" });
  };
  try {
    const client = createAdmin({ baseUrl: "https://financial.example.test", storeId: "store-finance", apiToken: "arky_api_finance" });
    const filter = { order_id: "order-finance", status: "unknown", sort_field: "updated_at", sort_direction: "asc", limit: 25, cursor: "opaque+/= č" };
    assert.deepEqual(await client.eshop.payment.find(filter), { items: [], cursor: "next-page+/=" });
    assert.deepEqual(await client.eshop.refund.find({ ...filter, payment_id: "payment-finance" }), { items: [], cursor: "next-page+/=" });
    for (const call of calls) {
      assert.equal(call.method, "GET");
      for (const [key, value] of Object.entries(filter)) assert.equal(call.url.searchParams.get(key), String(value));
    }
    assert.equal(calls[0].url.pathname, "/v1/stores/store-finance/payments");
    assert.equal(calls[1].url.pathname, "/v1/stores/store-finance/refunds");
    assert.equal(calls[1].url.searchParams.get("payment_id"), "payment-finance");
    await client.eshop.order.findPayments({ ...filter, order_id: "order/a" });
    await client.eshop.order.getPayment({ order_id: "order/a", payment_id: "payment/b" });
    assert.equal(calls[2].url.pathname, "/v1/stores/store-finance/orders/order%2Fa/payments");
    assert.equal(calls[2].url.searchParams.get("order_id"), null);
    assert.equal(calls[2].url.searchParams.get("cursor"), filter.cursor);
    assert.equal(calls[3].url.pathname, "/v1/stores/store-finance/orders/order%2Fa/payments/payment%2Fb");
    assert.equal(calls[3].method, "GET");
    const disputes = { payment_id: "payment-finance", status: "under_review", sort_field: "updated_at", sort_direction: "asc", limit: 25, cursor: filter.cursor };
    assert.deepEqual(await client.eshop.dispute.find(disputes), { items: [], cursor: "next-page+/=" });
    assert.equal(calls[4].url.pathname, "/v1/stores/store-finance/disputes");
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
    const client = createAdmin({ baseUrl: "https://financial.example.test", storeId: "store-finance", apiToken: "arky_api_finance" });
    await assert.rejects(client.eshop.payment.find(), (error) => error.statusCode === 409);
    await assert.rejects(client.eshop.refund.find(), (error) => error.statusCode === 409);
    await assert.rejects(client.eshop.dispute.find(), (error) => error.statusCode === 409);
    assert.deepEqual(methods, ["GET", "GET", "GET"]);
  } finally {
    globalThis.fetch = before;
  }
});
