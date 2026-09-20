import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

test("variant discovery forwards combined parent, exact SKU, lifecycle and ordering with empty-page continuation", async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(url), init });
    return new Response(JSON.stringify({ items: [], cursor: "continue-after-stale" }), { headers: { "content-type": "application/json" } });
  };
  try {
    const api = createAdmin({ baseUrl: "https://api.example.test", storeId: "default", apiToken: "arky_api_test" }).eshop.productVariant;
    const input = { product_id: "product", sku: "a".repeat(255), status: "archived", sort_field: "updated_at", sort_direction: "asc", limit: 200, cursor: "previous" };
    assert.deepEqual(await api.find({ store_id: "selected", ...input }), { items: [], cursor: "continue-after-stale" });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url.pathname, "/v1/stores/selected/product-variants");
    assert.equal(calls[0].url.searchParams.has("store_id"), false);
    for (const [key, value] of Object.entries(input)) assert.equal(calls[0].url.searchParams.get(key), String(value));
  } finally { globalThis.fetch = original; }
});

test("variant deletion preserves the version and distinguishes accepted deletion from absence", async () => {
  const original = globalThis.fetch;
  const storeId = "9d5fab61-155c-45a9-b350-ed604548b0bc";
  const id = "5b572371-c4fe-4a59-88c5-a8e704724b13";
  const expected = 1789822000000;
  const value = { id, store_id: storeId, product_id: "467f22db-ff1f-4559-8558-2f27aa1a5aed", sku: null,
    attributes: [], reference_labels: {}, fulfillment: { type: "none" }, tax_category_id: null,
    status: { type: "deleting" }, created_at: expected - 1000, updated_at: expected + 1 };
  const calls = [];
  let status = 202;
  globalThis.fetch = async (input, init) => {
    calls.push({ url: new URL(input), init });
    return status === 204 ? new Response(null, { status }) : new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });
  };
  try {
    const api = createAdmin({ baseUrl: "https://api.example.test", storeId: "other", apiToken: "arky_api_test" }).eshop.productVariant;
    const params = { store_id: storeId, id, expected_updated_at: expected };
    assert.deepEqual(await api.delete(params), value);
    status = 204;
    assert.equal(await api.delete(params), undefined);
    assert.equal(calls.length, 2);
    for (const { url, init } of calls) {
      assert.equal(init.method, "DELETE");
      assert.equal(url.pathname, `/v1/stores/${storeId}/product-variants/${id}`);
      assert.equal(url.searchParams.get("expected_updated_at"), String(expected));
      assert.equal(url.searchParams.has("store_id"), false);
      assert.equal(init.body, undefined);
    }
    for (const failure of [400, 403, 409, 503]) {
      let requests = 0;
      globalThis.fetch = async () => { requests += 1; return new Response(JSON.stringify({ message: "Cannot delete" }), { status: failure, headers: { "content-type": "application/json" } }); };
      await assert.rejects(api.delete(params), (error) => error.statusCode === failure);
      assert.equal(requests, 1);
    }
  } finally { globalThis.fetch = original; }
});
