import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

const selectedStoreId = "74f46c74-7776-47f4-a249-a57b80af62bb";
const orderId = "030a5ec0-eccf-430c-8c0a-3a68c842de1f";
const cursor = "opaque:page/+=binding";

for (const definition of [
  { path: ["eshop", "orderCredit"], route: "credits", limit: 25 },
  { path: ["eshop", "shipment", "fulfillment"], route: "fulfillment-orders", limit: 100 },
]) {
  test(`${definition.route} keeps exact Order scope and empty-page continuation`, async () => {
    const calls = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, init = {}) => {
      calls.push({ url: new URL(url), method: init.method ?? "GET" });
      return new Response(JSON.stringify({ items: [], cursor: calls.length === 1 ? cursor : null }), {
        status: 200, headers: { "content-type": "application/json" },
      });
    };
    try {
      const admin = createAdmin({ storeId: orderId, baseUrl: "https://api.example.test", apiToken: "arky_api_test" });
      const api = definition.path.reduce((owner, key) => owner[key], admin);
      const query = { store_id: selectedStoreId, order_id: orderId };
      const first = await api.find(query);
      assert.deepEqual(first, { items: [], cursor });
      assert.equal(calls.length, 1);
      assert.deepEqual(await api.find({ ...query, limit: definition.limit, cursor: first.cursor }), { items: [], cursor: null });
      assert.equal(calls.length, 2, "Continuation is explicit, not an automatic whole-history scan");
      for (const call of calls) {
        assert.equal(call.method, "GET");
        assert.equal(call.url.pathname, `/v1/stores/${selectedStoreId}/orders/${orderId}/${definition.route}`);
      }
      assert.deepEqual(Object.fromEntries(calls[0].url.searchParams), {});
      assert.deepEqual(Object.fromEntries(calls[1].url.searchParams), { limit: String(definition.limit), cursor });
      assert.deepEqual(query, { store_id: selectedStoreId, order_id: orderId });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
}
