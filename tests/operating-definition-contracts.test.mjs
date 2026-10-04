import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

const storeId = "be7c716f-e6a8-41ea-a966-b92f357a39f1";
const selectedStoreId = "74f46c74-7776-47f4-a249-a57b80af62bb";
const id = "030a5ec0-eccf-430c-8c0a-3a68c842de1f";
const marketId = "c383595f-8bcc-4dcd-9f0a-aaf0e31d7557";
const cursor = "opaque:page/+=binding";

for (const definition of [
  { path: ["store", "paymentTerms"], route: "payment-terms", filters: {} },
  { path: ["eshop", "fulfillmentRoutingPolicy"], route: "fulfillment-routing-policies", filters: { market_id: marketId, sales_channel_id: id } },
  { path: ["store", "storefrontClient"], route: "storefront-clients", filters: { sales_channel_id: id } },
]) {
  test(`${definition.route} retains empty-page continuation and exact Store/filter binding`, async () => {
    const calls = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, init = {}) => {
      calls.push({ url: new URL(url), method: init.method ?? "GET" });
      return new Response(JSON.stringify(
        calls.length === 1 ? { items: [], cursor } : { items: [{ id, store_id: selectedStoreId }], cursor: null }
      ), { status: 200, headers: { "content-type": "application/json" } });
    };
    try {
      const admin = createAdmin({ storeId, baseUrl: "https://api.example.test", apiToken: "arky_api_test" });
      const api = definition.path.reduce((owner, key) => owner[key], admin);
      const query = { store_id: selectedStoreId, ...definition.filters, limit: 20 };
      const first = await api.find(query);
      assert.deepEqual(first, { items: [], cursor });
      assert.equal(calls.length, 1, "An empty page does not authorize scanning later pages");
      const second = await api.find({ ...query, cursor: first.cursor });
      assert.deepEqual(second, { items: [{ id, store_id: selectedStoreId }], cursor: null });
      assert.equal(calls.length, 2);
      for (const [index, call] of calls.entries()) {
        assert.equal(call.method, "GET");
        assert.equal(call.url.pathname, `/v1/stores/${selectedStoreId}/${definition.route}`);
        assert.deepEqual(Object.fromEntries(call.url.searchParams), {
          ...definition.filters, limit: "20", ...(index === 0 ? {} : { cursor })
        });
      }
      assert.deepEqual(query, { store_id: selectedStoreId, ...definition.filters, limit: 20 });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
}
