import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

test("Admin payment resume targets the accepted Order without creating a new request", async () => {
  const original = globalThis.fetch;
  const calls = [];
  const result = { order_id: "order", number: "123", payment: null, payment_action: { type: "none" } };
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    return new Response(JSON.stringify(result), { headers: { "content-type": "application/json" } });
  };
  try {
    const api = createAdmin({ baseUrl: "https://api.example.test", storeId: "default", apiToken: "arky_api_test" }).eshop;
    assert.deepEqual(await api.checkout.resumePayment({ store_id: "selected", order_id: "order" }), result);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url.pathname, "/v1/stores/selected/orders/order/payment-action");
    assert.equal(calls[0].method, "POST");
    assert.deepEqual(JSON.parse(calls[0].body), {});
  } finally { globalThis.fetch = original; }
});

test("known commerce definitions use exact key/binding reads without discovery or creation", async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(url), method: init.method });
    return new Response(JSON.stringify({ id: "retained", key: "selected" }), { headers: { "content-type": "application/json" } });
  };
  try {
    const api = createAdmin({ baseUrl: "https://api.example.test", storeId: "default", apiToken: "arky_api_test" }).eshop;
    for (const owner of [api.product, api.bookingService, api.bookingResource, api.fulfillmentRoutingPolicy]) {
      assert.equal((await owner.getByKey({ store_id: "selected", key: "demo-key" })).id, "retained");
    }
    await api.bookingOffering.getByBinding({ store_id: "selected", booking_service_id: "service", booking_resource_id: "resource" });
    assert.deepEqual(calls.map(({ url }) => url.pathname), [
      "/v1/stores/selected/products/by-key/demo-key",
      "/v1/stores/selected/booking-services/by-key/demo-key",
      "/v1/stores/selected/booking-resources/by-key/demo-key",
      "/v1/stores/selected/fulfillment-routing-policies/by-key/demo-key",
      "/v1/stores/selected/booking-offerings/by-binding",
    ]);
    assert.ok(calls.every(({ method }) => method === "GET"));
    assert.deepEqual(Object.fromEntries(calls[4].url.searchParams), { booking_service_id: "service", booking_resource_id: "resource" });
    for (const status of [403, 404, 409, 503]) {
      let count = 0;
      globalThis.fetch = async () => {
        count += 1;
        return new Response(JSON.stringify({ message: "lookup failed" }), { status, headers: { "content-type": "application/json" } });
      };
      for (const owner of [api.product, api.bookingService, api.bookingResource, api.fulfillmentRoutingPolicy]) {
        await assert.rejects(owner.getByKey({ key: "demo-key" }), (error) => error.statusCode === status);
      }
      await assert.rejects(api.bookingOffering.getByBinding({ booking_service_id: "service", booking_resource_id: "resource" }), (error) => error.statusCode === status);
      assert.equal(count, 5);
    }
  } finally {
    globalThis.fetch = original;
  }
});
