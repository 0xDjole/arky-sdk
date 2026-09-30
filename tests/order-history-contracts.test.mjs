import assert from "node:assert/strict";
import test from "node:test";
import {
  createAdmin,
  orderProductItems,
  orderBookingItems,
  orderDigitalItems,
  orderSubscriptionPlanItems,
} from "../dist/index.js";
import { retainedOrder as retained } from "./fixtures/retained-order.mjs";

const baseUrl = "https://api.example.test";
const storeId = retained.store_id;
const otherStoreId = "7d3b9f15-c2a6-4e80-9b4d-1a6e8c2f5d73";

function client() {
  return createAdmin({
    baseUrl,
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
      const order = await client().eshop.order.get({ store_id: storeId, id: retained.id });
      assert.deepEqual(order, retained);
      assert.equal(order.source.type, "cart_acceptance");
      assert.equal(order.source.request_id, "9b2e4d71-6a35-4c08-8f1e-3d7a5c9b2e46");
      assert.equal(order.source.submission_fingerprint, "c".repeat(64));
      assert.equal(order.source.initial_payment_id, null);
      assert.equal("command_id" in order.source, false);
      assert.equal(order.customer_id, "retained-customer");
      assert.equal(order.market_id, null);
      assert.equal(order.market_snapshot.source_market_id, "accepted-market");
      assert.equal(order.sales_channel_id, null);
      assert.equal(order.sales_channel_snapshot.source_sales_channel_id, "accepted-channel");
      const [product] = orderProductItems(order);
      const [booking] = orderBookingItems(order);
      const [digital] = orderDigitalItems(order);
      const [planLine] = orderSubscriptionPlanItems(order);
      assert.deepEqual(order.line_items.map((line) => line.type), ["product", "booking", "digital_product", "subscription_plan"]);
      assert.equal(product.product_id, null);
      assert.equal(product.variant_id, null);
      assert.equal(product.snapshot.source_product_id, "accepted-product");
      assert.equal(product.snapshot.product_key, "consultation-credit");
      assert.equal(product.money_runs[0].per_unit.unit_price, 1000);
      assert.equal(booking.booking_service_id, null);
      assert.equal(booking.snapshot.source_service_id, "accepted-service");
      assert.equal(booking.snapshot.service_key, "consultation");
      assert.equal(digital.digital_product_id, null);
      assert.equal(digital.snapshot.product_key, "guide");
      assert.equal(digital.snapshot.content.assets[0].file_name, "guide.pdf");
      assert.equal(planLine.terms.terms.plan.plan_key, "permanent");
      assert.equal(planLine.terms.terms.plan.source_subscription_plan_id, "accepted-plan");
      assert.equal(order.money.total, 3000);
      for (const retiredField of ["type", "product_items", "booking_items", "digital_items", "audience_items", "payment_id", "shipping_lines"]) {
        assert.equal(retiredField in order, false);
      }
    },
  );
  assert.deepEqual(calls, [
    {
      url: `${baseUrl}/v1/stores/${storeId}/orders/${retained.id}`,
      method: "GET",
    },
  ]);
});

test("Order confirmation and pending cancellation keep their separate request and response contracts", async () => {
  const calls = [];
  const signal = new AbortController().signal;
  const cancellationRequestId = "1f5c8e27-4b9a-4d36-a0c2-6e9d3b7f1a54";
  const cancellation = {
    request_id: cancellationRequestId,
    store_id: otherStoreId,
    order_id: retained.id,
    accepted_at: 1789990000000,
    source: { type: "expiration", expires_at: 1789989999999 },
  };
  await withFetch(
    async (url, init = {}) => {
      calls.push({
        url: String(url),
        method: init.method,
        body: JSON.parse(init.body),
        signal: init.signal,
      });
      return init.method === "POST" ? Response.json(cancellation, { status: 202 }) : Response.json(retained);
    },
    async () => {
      const api = client();
      assert.deepEqual(
        await api.eshop.order.update(
          { id: "order/a?b", store_id: storeId, confirm: true },
          { signal },
        ),
        retained,
      );
      assert.equal("setStoreId" in api, false);
      assert.deepEqual(await api.eshop.order.cancelPending({ store_id: otherStoreId, order_id: retained.id, request_id: cancellationRequestId }), cancellation);
    },
  );
  assert.equal(
    calls[0].url,
    `${baseUrl}/v1/stores/${storeId}/orders/order%2Fa%3Fb`,
  );
  assert.equal(calls[0].method, "PUT");
  assert.deepEqual(calls[0].body, { confirm: true });
  assert.equal(calls[0].signal, signal);
  assert.equal(
    calls[1].url,
    `${baseUrl}/v1/stores/${otherStoreId}/orders/${retained.id}/cancel`,
  );
  assert.equal(calls[1].method, "POST");
  assert.deepEqual(calls[1].body, { request_id: cancellationRequestId });
});

test("pending cancellation retry preserves its request and returns acceptance, not an Order", async () => {
  const request = { store_id: otherStoreId, order_id: "order/one", request_id: "5b1d7f39-8e24-4a60-9c3b-2f6a0d8e4c17" };
  const receipt = {
    request_id: request.request_id,
    store_id: request.store_id,
    order_id: request.order_id,
    accepted_at: 1789990000000,
    source: { type: "admin", actor: { account_id: "admin-one", snapshot: { email: "operator@example.test", credential_type: "api_token" } } },
  };
  const calls = [];
  await withFetch(async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method, body: JSON.parse(init.body) });
    return calls.length === 1
      ? Response.json({ message: "Response unavailable" }, { status: 503 })
      : Response.json(receipt, { status: 202 });
  }, async () => {
    const api = client();
    await assert.rejects(api.eshop.order.cancelPending(request), (error) => error.statusCode === 503);
    assert.equal(calls.length, 1);
    assert.deepEqual(await api.eshop.order.cancelPending(request), receipt);
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[1], calls[0]);
    assert.deepEqual(calls[0], {
      url: `${baseUrl}/v1/stores/${otherStoreId}/orders/order%2Fone/cancel`,
      method: "POST",
      body: { request_id: request.request_id },
    });
    for (const request_id of [undefined, "cancel-command", request.request_id.toUpperCase()]) {
      await assert.rejects(api.eshop.order.cancelPending({ ...request, request_id }), TypeError);
    }
    await assert.rejects(api.eshop.order.cancelPending({ ...request, store_id: "store/one" }), TypeError);
    assert.equal(calls.length, 2);
  });
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
        client().eshop.order.update({ store_id: storeId, id: retained.id, booking_items: [] }),
        (error) => error.statusCode === 422,
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
          client().eshop.order.update({ store_id: storeId, id: retained.id, confirm: true }),
          (error) => error.statusCode === status,
        );
      },
    );
    assert.equal(attempts, 1);
  }
});
