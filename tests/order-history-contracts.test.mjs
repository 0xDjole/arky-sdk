import assert from "node:assert/strict";
import test from "node:test";
import {
  createAdmin,
  orderProductItems,
  orderBookingItems,
  orderDigitalItems,
  orderCustomerGroupPlanItems,
} from "../dist/index.js";
import { retainedOrder as retained } from "./fixtures/retained-order.mjs";

const baseUrl = "https://api.example.test";
const storeId = "store-history-contract";

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
      const order = await client().eshop.order.get({ id: retained.id });
      assert.deepEqual(order, retained);
      assert.deepEqual(order.type, { type: "purchase", source: { type: "checkout", checkout_id: "accepted-checkout" } });
      assert.equal(order.customer_id, "retained-customer");
      assert.equal(order.market_id, null);
      assert.equal(order.market_snapshot.source_market_id, "accepted-market");
      assert.equal(order.sales_channel_id, null);
      assert.equal(order.sales_channel_snapshot.source_sales_channel_id, "accepted-channel");
      const [product] = orderProductItems(order);
      const [booking] = orderBookingItems(order);
      const [digital] = orderDigitalItems(order);
      const [groupPlan] = orderCustomerGroupPlanItems(order);
      assert.deepEqual(order.line_items.map((line) => line.type), ["product", "booking", "digital_product", "customer_group_plan"]);
      assert.equal(product.product_id, null);
      assert.equal(product.variant_id, null);
      assert.equal(product.snapshot.source_product_id, "accepted-product");
      assert.equal(product.snapshot.product_name.text, "Saved product");
      assert.equal(product.money_runs[0].per_unit.unit_price, 1000);
      assert.equal(booking.booking_service_id, null);
      assert.equal(booking.snapshot.source_service_id, "accepted-service");
      assert.equal(booking.snapshot.service_name.text, "Saved service");
      assert.equal(digital.digital_product_id, null);
      assert.equal(digital.snapshot.product_name.text, "Saved guide");
      assert.equal(digital.snapshot.content.assets[0].file_name, "guide.pdf");
      assert.equal(groupPlan.terms.terms.plan.plan_name.text, "Saved membership");
      assert.equal(groupPlan.terms.terms.plan.source_customer_group_plan_id, "accepted-plan");
      assert.equal(order.money.total, 4000);
      for (const retiredField of ["source", "product_items", "booking_items", "digital_items", "audience_items", "payment_id", "shipping_lines"]) {
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
  const cancellation = {
    id: "cancellation-command",
    store_id: "store-next",
    accepted_at: 1789990000000,
    command: {
      type: "order_cancellation_requested",
      order_id: retained.id,
      source: { type: "expiration", expires_at: 1789989999999 },
    },
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
          { id: "order/a?b", store_id: "store/override", confirm: true },
          { signal },
        ),
        retained,
      );
      api.setStoreId("store-next");
      assert.deepEqual(await api.eshop.order.cancelPending({ order_id: retained.id, command_id: "cancellation-command" }), cancellation);
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
    `${baseUrl}/v1/stores/store-next/orders/${retained.id}/cancel`,
  );
  assert.equal(calls[1].method, "POST");
  assert.deepEqual(calls[1].body, { command_id: "cancellation-command" });
});

test("pending cancellation retry preserves its command and returns acceptance, not an Order", async () => {
  const request = { store_id: "store/one", order_id: "order/one", command_id: "cancel-command" };
  const receipt = {
    id: "already-accepted-request",
    store_id: request.store_id,
    accepted_at: 1789990000000,
    command: {
      type: "order_cancellation_requested",
      order_id: request.order_id,
      source: { type: "admin", actor: { account_id: "admin-one", snapshot: { email: "operator@example.test", credential_type: "api_token" } } },
    },
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
      url: `${baseUrl}/v1/stores/store%2Fone/orders/order%2Fone/cancel`,
      method: "POST",
      body: { command_id: request.command_id },
    });
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
        client().eshop.order.update({ id: retained.id, booking_items: [] }),
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
          client().eshop.order.update({ id: retained.id, confirm: true }),
          (error) => error.statusCode === status,
        );
      },
    );
    assert.equal(attempts, 1);
  }
});
