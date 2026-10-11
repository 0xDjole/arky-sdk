import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { recordFetch } from "./helpers/arky-fixtures.mjs";

const selectedStoreId = "74f46c74-7776-47f4-a249-a57b80af62bb";
const id = "030a5ec0-eccf-430c-8c0a-3a68c842de1f";
const marketId = "c383595f-8bcc-4dcd-9f0a-aaf0e31d7557";
const cursor = "opaque:page/+=binding";

for (const definition of [
  { path: ["store", "salesChannel"], route: "sales-channels", filters: { key: "web" } },
  { path: ["store", "zone"], route: "zones", filters: { market_id: marketId } },
  { path: ["store", "taxCategory"], route: "tax-categories", filters: { key: "reduced" } },
  { path: ["eshop", "catalog"], route: "catalogs", filters: { market_id: marketId } },
  { path: ["store", "storefrontKey"], route: "storefront-keys", filters: { sales_channel_id: id } },
]) {
  test(`${definition.route} keep the empty-page continuation and the exact store and filters`, async (context) => {
    const calls = recordFetch(context, (_call, count) => count === 1 ? { items: [], cursor } : { items: [{ id, store_id: selectedStoreId }], cursor: null });
    const admin = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" });
    const api = definition.path.reduce((owner, key) => owner[key], admin);
    const query = { store_id: selectedStoreId, ...definition.filters, limit: 20 };
    const first = await api.find(query);
    assert.deepEqual(first, { items: [], cursor });
    assert.equal(calls.length, 1);
    const second = await api.find({ ...query, cursor: first.cursor });
    assert.deepEqual(second, { items: [{ id, store_id: selectedStoreId }], cursor: null });
    assert.equal(calls.length, 2);
    for (const [index, call] of calls.entries()) {
      assert.equal(call.method, "GET");
      assert.equal(call.path, `/v1/stores/${selectedStoreId}/${definition.route}`);
      assert.deepEqual(call.query, { ...definition.filters, limit: "20", ...(index === 0 ? {} : { cursor }) });
    }
    assert.deepEqual(query, { store_id: selectedStoreId, ...definition.filters, limit: 20 });
    await assert.rejects(async () => api.find({ ...definition.filters }), TypeError);
    assert.equal(calls.length, 2);
  });
}

test("a storefront key is made for one sales channel under the app's id, read by id and revoked with its version", async (context) => {
  const channelId = "5d8e2b17-4c93-4a06-b1f8-9e3c7a2d6f40";
  const publishableKey = `arky_pk_${"k".repeat(42)}A`;
  const key = { id, store_id: selectedStoreId, key: "web-shop", publishable_key: publishableKey, sales_channel_id: channelId, status: { type: "active" }, created_at: 1, updated_at: 1 };
  const revoked = { ...key, status: { type: "revoked", revoked_at: 2 }, updated_at: 2 };
  const calls = recordFetch(context, (call) => call.path.endsWith("/revoke") ? revoked : key);
  const api = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" }).store.storefrontKey;
  assert.deepEqual(await api.create({ store_id: selectedStoreId, id, key: "web-shop", sales_channel_id: channelId }), key);
  assert.deepEqual(await api.get({ store_id: selectedStoreId, id }), key);
  assert.deepEqual(await api.revoke({ store_id: selectedStoreId, id, expected_updated_at: 1 }), revoked);
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["POST", `/v1/stores/${selectedStoreId}/storefront-keys`, {}, { id, key: "web-shop", sales_channel_id: channelId }],
    ["GET", `/v1/stores/${selectedStoreId}/storefront-keys/${id}`, {}, null],
    ["POST", `/v1/stores/${selectedStoreId}/storefront-keys/${id}/revoke`, {}, { expected_updated_at: 1 }],
  ]);
  for (const invented of [undefined, "web-shop", id.toUpperCase()]) {
    await assert.rejects(async () => api.create({ store_id: selectedStoreId, id: invented, key: "web-shop", sales_channel_id: channelId }), TypeError);
  }
  assert.equal(calls.length, 3);
  for (const removed of ["update", "delete"]) assert.equal(removed in api, false, removed);
});

test("the Admin client has no remembered store and no payment-terms definitions", () => {
  const admin = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" });
  assert.equal("setStoreId" in admin, false);
  assert.equal("storeId" in admin, false);
  assert.equal("paymentTerms" in admin.store, false);
  assert.equal("storefrontClient" in admin.store, false);
});
