import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/index.js";

const baseUrl = "https://api.example.test";
const storeId = "store-history-contract";
const retained = {
  id: "order-history-contract",
  number: "1001",
  store_id: storeId,
  source: { type: "cart", request_id: "accepted-cart-request", cart_id: null },
  customer_id: null,
  customer_snapshot: {
    email: "buyer@example.test",
    authentication: { type: "visitor" },
  },
  company_id: null,
  company_location_id: null,
  company_snapshot: null,
  market_id: null,
  sales_channel_id: null,
  sales_channel_snapshot: { key: "web", name: "Web" },
  origin: {
    type: "storefront",
    customer_id: "accepted-customer",
    customer_session_id: "accepted-session",
  },
  status: { type: "confirmed" },
  payment_id: "accepted-payment",
  product_items: [],
  booking_items: [],
  digital_items: [],
  audience_items: [
    {
      id: "audience-item",
      audience_id: null,
      membership_id: null,
      snapshot: {
        audience_key: "members",
        audience_name: { text: "Saved membership", locale: "en" },
        price: {
          unit_price: { currency: "usd", amount: 1000 },
          compare_at: null,
          billing: { type: "one_time" },
          min_quantity: 1,
          max_quantity: null,
          source: {
            type: "price_list",
            price_id: "accepted-price",
            price_list_id: "accepted-list",
          },
          priced_at: 1788870000000,
        },
      },
      money: {
        unit_price: 1000,
        subtotal: 1000,
        discount_allocations: [],
        discount_total: 0,
        taxable_base: 1000,
        tax_lines: [],
        tax_total: 0,
        total: 1000,
      },
      status: { type: "confirmed" },
      created_at: 1788870000000,
      updated_at: 1788870000000,
    },
  ],
  money: {
    currency: "usd",
    market: "us",
    subtotal: 1000,
    shipping: 0,
    discount: 0,
    tax_total: 0,
    total: 1000,
    promo_code: null,
    zone_id: null,
    shipping_method_id: null,
  },
  shipping_lines: [],
  shipping_address: null,
  billing_address: null,
  created_at: 1788870000000,
  updated_at: 1788870000000,
};

function client() {
  return createAdmin({
    baseUrl,
    storeId,
    apiToken: "arky_api_history_contract",
  });
}

async function withFetch(handler, run) {
  const before = globalThis.fetch;
  globalThis.fetch = handler;
  try {
    await run();
  } finally {
    globalThis.fetch = before;
  }
}

test("Order reads retain detached navigation, immutable provenance, accepted names and all item families", async () => {
  const calls = [];
  await withFetch(
    async (url, init = {}) => {
      calls.push({ url: String(url), method: init.method || "GET" });
      return Response.json(retained);
    },
    async () => {
      assert.deepEqual(
        await client().eshop.order.get({ id: retained.id }),
        retained,
      );
    },
  );
  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/stores/${storeId}/orders/${retained.id}`,
      method: "GET",
    },
  ]);
});

test("Order lifecycle updates preserve exact request body, encoded routing scope and response", async () => {
  const calls = [];
  const signal = new AbortController().signal;
  await withFetch(
    async (url, init = {}) => {
      calls.push({
        url: String(url),
        method: init.method,
        body: JSON.parse(init.body),
        signal: init.signal,
      });
      return Response.json(retained);
    },
    async () => {
      const api = client();
      assert.deepEqual(
        await api.eshop.order.update(
          { id: "order/a?b", store_id: "store/override", confirm: true },
          { signal },
        ),
        retained,
      );
      api.setStoreId("store-next");
      await api.eshop.order.update({ id: retained.id, cancel: true });
    },
  );
  assert.equal(
    calls[0].url,
    `${baseUrl}/v1/stores/store%2Foverride/orders/order%2Fa%3Fb`,
  );
  assert.equal(calls[0].method, "PUT");
  assert.deepEqual(calls[0].body, { confirm: true });
  assert.equal(calls[0].signal, signal);
  assert.equal(
    calls[1].url,
    `${baseUrl}/v1/stores/store-next/orders/${retained.id}`,
  );
  assert.deepEqual(calls[1].body, { cancel: true });
});

test("Unsupported accepted-line edits are not silently discarded into successful no-ops", async () => {
  let request;
  await withFetch(
    async (_url, init = {}) => {
      request = JSON.parse(init.body);
      return Response.json(
        { message: "Unknown field booking_items" },
        { status: 422 },
      );
    },
    async () => {
      await assert.rejects(
        client().eshop.order.update({ id: retained.id, booking_items: [] }),
        (error) => error.status === 422,
      );
    },
  );
  assert.deepEqual(request, { booking_items: [] });
});

test("Order lifecycle denial is propagated without retry or a replacement command", async () => {
  for (const status of [401, 403, 409, 422]) {
    let attempts = 0;
    await withFetch(
      async () => {
        attempts += 1;
        return Response.json({ message: "Lifecycle denied" }, { status });
      },
      async () => {
        await assert.rejects(
          client().eshop.order.update({ id: retained.id, confirm: true }),
          (error) => error.status === status,
        );
      },
    );
    assert.equal(attempts, 1);
  }
});
