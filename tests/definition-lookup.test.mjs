import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

const STORE_ID = "3d8f1b62-7c49-4e05-a2b6-9f0d4c7e1a83";

test("Admin payment resume targets the accepted Order without creating a new request", async () => {
  const original = globalThis.fetch;
  const calls = [];
  const result = { order_id: "order", number: "123", payment: null, payment_action: { type: "none" } };
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    return new Response(JSON.stringify(result), { headers: { "content-type": "application/json" } });
  };
  try {
    const api = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop;
    assert.deepEqual(await api.checkout.resumePayment({ store_id: STORE_ID, order_id: "order" }), result);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url.pathname, `/v1/stores/${STORE_ID}/orders/order/payment-action`);
    assert.equal(calls[0].url.search, "");
    assert.equal(calls[0].method, "POST");
    assert.equal(calls[0].body, undefined);
    await assert.rejects(async () => api.checkout.resumePayment({ order_id: "order" }), TypeError);
    assert.equal(calls.length, 1);
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
    const api = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop;
    for (const owner of [api.product, api.bookingService, api.bookingResource, api.catalog]) {
      assert.equal((await owner.getByKey({ store_id: STORE_ID, key: "demo-key" })).id, "retained");
    }
    await api.bookingOffering.lookup({ store_id: STORE_ID, booking_service_id: "service", booking_resource_id: "resource" });
    assert.deepEqual(calls.map(({ url }) => url.pathname), [
      `/v1/stores/${STORE_ID}/products/by-key/demo-key`,
      `/v1/stores/${STORE_ID}/booking-services/by-key/demo-key`,
      `/v1/stores/${STORE_ID}/booking-resources/by-key/demo-key`,
      `/v1/stores/${STORE_ID}/catalogs/by-key/demo-key`,
      `/v1/stores/${STORE_ID}/booking-offerings/lookup`,
    ]);
    assert.ok(calls.every(({ method }) => method === "GET"));
    assert.deepEqual(Object.fromEntries(calls[4].url.searchParams), { booking_service_id: "service", booking_resource_id: "resource" });
    for (const status of [403, 404, 409, 503]) {
      let count = 0;
      globalThis.fetch = async () => {
        count += 1;
        return new Response(JSON.stringify({ message: "lookup failed" }), { status, headers: { "content-type": "application/json" } });
      };
      for (const owner of [api.product, api.bookingService, api.bookingResource, api.catalog]) {
        await assert.rejects(owner.getByKey({ store_id: STORE_ID, key: "demo-key" }), (error) => error.statusCode === status);
      }
      await assert.rejects(api.bookingOffering.lookup({ store_id: STORE_ID, booking_service_id: "service", booking_resource_id: "resource" }), (error) => error.statusCode === status);
      assert.equal(count, 5);
    }
  } finally {
    globalThis.fetch = original;
  }
});

test("a known booking offering is read by its exact id for catalog price labels", async () => {
  const original = globalThis.fetch;
  const calls = [];
  const offering = { id: "offering/one", booking_service_id: "service", booking_resource_id: "resource", status: { type: "active" } };
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(url), method: init.method });
    return new Response(JSON.stringify(offering), { headers: { "content-type": "application/json" } });
  };
  try {
    const api = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).eshop;
    assert.deepEqual(await api.bookingOffering.get({ store_id: STORE_ID, id: "offering/one" }), offering);
    assert.deepEqual(calls.map(({ url, method }) => [method, url.pathname, url.search]), [
      ["GET", `/v1/stores/${STORE_ID}/booking-offerings/offering%2Fone`, ""],
    ]);
    await assert.rejects(async () => api.bookingOffering.get({ id: "offering/one" }), TypeError);
    assert.equal(calls.length, 1);
  } finally {
    globalThis.fetch = original;
  }
});
