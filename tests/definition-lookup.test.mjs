import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

const TENANT_ID = "3d8f1b62-7c49-4e05-a2b6-9f0d4c7e1a83";

test("Admin payment resume targets the placed Order without creating a new request", async () => {
  const original = globalThis.fetch;
  const calls = [];
  const action = { type: "stripe_embedded_checkout", publishable_key: "pk_test_resume", client_secret: "cs_resume_secret", expires_at: 1900000000000, runs_on: { type: "provider" } };
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(url), method: init.method, body: init.body });
    return new Response(JSON.stringify(action), { headers: { "content-type": "application/json" } });
  };
  try {
    const api = createAdmin({ apiUrl: "https://api.example.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" }).eshop;
    assert.deepEqual(await api.order.resumePayment({ tenant_id: TENANT_ID, order_id: "order/one" }), action);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url.pathname, `/v1/tenants/${TENANT_ID}/orders/order%2Fone/payment-action`);
    assert.equal(calls[0].url.search, "");
    assert.equal(calls[0].method, "POST");
    assert.equal(calls[0].body, undefined);
    await assert.rejects(async () => api.order.resumePayment({ order_id: "order" }), TypeError);
    assert.equal("paymentAction" in api.cart, false);
    assert.equal(calls.length, 1);
    assert.equal("checkout" in api, false);
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
    const api = createAdmin({ apiUrl: "https://api.example.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" }).eshop;
    for (const owner of [api.product, api.bookingService, api.bookingResource, api.package]) {
      assert.equal((await owner.getByKey({ tenant_id: TENANT_ID, key: "demo-key" })).id, "retained");
    }
    assert.equal("getByServiceAndResource" in api.bookingOffering, false, "an offering names many resources, so no service and resource pair finds one");
    assert.deepEqual(calls.map(({ url }) => url.pathname), [
      `/v1/tenants/${TENANT_ID}/products/by-key/demo-key`,
      `/v1/tenants/${TENANT_ID}/booking-services/by-key/demo-key`,
      `/v1/tenants/${TENANT_ID}/booking-resources/by-key/demo-key`,
      `/v1/tenants/${TENANT_ID}/packages/by-key/demo-key`,
    ]);
    assert.ok(calls.every(({ method }) => method === "GET"));
    for (const status of [403, 404, 409, 503]) {
      let count = 0;
      globalThis.fetch = async () => {
        count += 1;
        return new Response(JSON.stringify({ message: "lookup failed" }), { status, headers: { "content-type": "application/json" } });
      };
      for (const owner of [api.product, api.bookingService, api.bookingResource, api.package]) {
        await assert.rejects(owner.getByKey({ tenant_id: TENANT_ID, key: "demo-key" }), (error) => error.statusCode === status);
      }
      assert.equal(count, 4);
    }
  } finally {
    globalThis.fetch = original;
  }
});

test("a known booking offering is read by its exact id for package price labels", async () => {
  const original = globalThis.fetch;
  const calls = [];
  const offering = { id: "offering/one", booking_service_id: "service", resources: { type: "ids", booking_resource_ids: ["resource"] }, status: { type: "active" } };
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(url), method: init.method });
    return new Response(JSON.stringify(offering), { headers: { "content-type": "application/json" } });
  };
  try {
    const api = createAdmin({ apiUrl: "https://api.example.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" }).eshop;
    assert.deepEqual(await api.bookingOffering.get({ tenant_id: TENANT_ID, id: "offering/one" }), offering);
    assert.deepEqual(calls.map(({ url, method }) => [method, url.pathname, url.search]), [
      ["GET", `/v1/tenants/${TENANT_ID}/booking-offerings/offering%2Fone`, ""],
    ]);
    await assert.rejects(async () => api.bookingOffering.get({ id: "offering/one" }), TypeError);
    assert.equal(calls.length, 1);
  } finally {
    globalThis.fetch = original;
  }
});
