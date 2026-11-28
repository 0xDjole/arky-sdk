import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";

const tenantId = "74f46c74-7776-47f4-a249-a57b80af62bb";
const assetId = "030a5ec0-eccf-430c-8c0a-3a68c842de1f";
const cursor = "opaque:page/+=binding";

test("DigitalAsset keeps native status pagination and exact selection, and the product is read by key", async (context) => {
  const calls = [];
  const asset = { id: assetId, tenant_id: tenantId, file_name: "guide.txt", mime_type: "text/plain", size_bytes: 9, sha256: "a".repeat(64), status: { type: "active" }, created_at: 1, updated_at: 1 };
  const product = { id: "923b39af-f939-469e-bf61-4c89bdb544ed", tenant_id: tenantId, key: "protected-guide", slugs: {}, blocks: [], categories: [], status: { type: "draft" }, created_at: 1, updated_at: 1 };
  const replies = [{ items: [], cursor }, { items: [asset], cursor: null }, asset, product];
  context.mock.method(globalThis, "fetch", async (url, init = {}) => {
    calls.push({ url: new URL(url), method: init.method ?? "GET" });
    return new Response(JSON.stringify(replies.shift()), { status: 200, headers: { "content-type": "application/json" } });
  });
  const admin = createAdmin({ apiUrl: "https://api.example.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
  const params = { tenant_id: tenantId, status: "active", limit: 20 };
  const first = await admin.eshop.digitalAsset.find(params);
  assert.deepEqual(first, { items: [], cursor });
  assert.equal(calls.length, 1);
  const next = await admin.eshop.digitalAsset.find({ ...params, cursor: first.cursor });
  assert.deepEqual(next, { items: [asset], cursor: null });
  assert.equal(next.items[0].status.type, "active");
  assert.deepEqual(await admin.eshop.digitalAsset.get({ tenant_id: tenantId, id: assetId }), asset);
  assert.deepEqual(await admin.eshop.product.getByKey({ tenant_id: tenantId, key: product.key }), product);
  assert.equal(calls.length, 4);
  assert.ok(calls.every((call) => call.method === "GET"));
  assert.deepEqual(Object.fromEntries(calls[0].url.searchParams), { status: "active", limit: "20" });
  assert.deepEqual(Object.fromEntries(calls[1].url.searchParams), { status: "active", limit: "20", cursor });
  assert.deepEqual(calls.map((call) => call.url.pathname), [
    `/v1/tenants/${tenantId}/digital-assets`, `/v1/tenants/${tenantId}/digital-assets`,
    `/v1/tenants/${tenantId}/digital-assets/${assetId}`, `/v1/tenants/${tenantId}/products/by-key/${product.key}`,
  ]);
  assert.equal(calls[2].url.search, "");
  assert.equal(calls[3].url.search, "");
  assert.deepEqual(params, { tenant_id: tenantId, status: "active", limit: 20 });
  assert.equal("digital" in admin.eshop, false);
});
