import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

const storeId = "74f46c74-7776-47f4-a249-a57b80af62bb";
const assetId = "030a5ec0-eccf-430c-8c0a-3a68c842de1f";
const cursor = "opaque:page/+=binding";

test("DigitalAsset preserves native status pagination, exact selection and keyed product lookup", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  const asset = { id: assetId, store_id: storeId, file_name: "guide.txt", mime_type: "text/plain", status: { type: "active" }, created_at: 1, updated_at: 1 };
  const product = { id: "923b39af-f939-469e-bf61-4c89bdb544ed", store_id: storeId, key: "protected-guide", asset_ids: [assetId], status: { type: "draft" } };
  const replies = [{ items: [], cursor }, { items: [asset], cursor: null }, asset, product];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method ?? "GET" });
    return new Response(JSON.stringify(replies.shift()), { status: 200, headers: { "content-type": "application/json" } });
  };
  try {
    const admin = createAdmin({ storeId: assetId, baseUrl: "https://api.example.test", apiToken: "arky_api_test" });
    const params = { store_id: storeId, status: "active", limit: 20 };
    const first = await admin.eshop.digital.asset.find(params);
    assert.deepEqual(first, { items: [], cursor });
    assert.equal(calls.length, 1);
    const next = await admin.eshop.digital.asset.find({ ...params, cursor: first.cursor });
    assert.deepEqual(next, { items: [asset], cursor: null });
    assert.equal(next.items[0].status.type, "active");
    assert.deepEqual(await admin.eshop.digital.asset.get({ store_id: storeId, asset_id: assetId }), asset);
    assert.deepEqual(await admin.eshop.digital.product.getByKey({ store_id: storeId, key: product.key }), product);
    assert.equal(calls.length, 4);
    assert.ok(calls.every((call) => call.method === "GET"));
    assert.deepEqual(Object.fromEntries(calls[0].url.searchParams), { status: "active", limit: "20" });
    assert.deepEqual(Object.fromEntries(calls[1].url.searchParams), { status: "active", limit: "20", cursor });
    assert.deepEqual(calls.map((call) => call.url.pathname), [
      `/v1/stores/${storeId}/digital-assets`, `/v1/stores/${storeId}/digital-assets`,
      `/v1/stores/${storeId}/digital-assets/${assetId}`, `/v1/stores/${storeId}/digital-products/by-key/${product.key}`,
    ]);
    assert.equal(calls[2].url.search, "");
    assert.equal(calls[3].url.search, "");
    assert.deepEqual(params, { store_id: storeId, status: "active", limit: 20 });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
