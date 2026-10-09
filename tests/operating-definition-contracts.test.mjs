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
  { path: ["store", "storefrontClient"], route: "storefront-clients", filters: { sales_channel_id: id } },
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

test("the Admin client has no remembered store and no payment-terms definitions", () => {
  const admin = createAdmin({ baseUrl: "https://api.example.test", apiToken: "arky_api_test" });
  assert.equal("setStoreId" in admin, false);
  assert.equal("storeId" in admin, false);
  assert.equal("paymentTerms" in admin.store, false);
});
