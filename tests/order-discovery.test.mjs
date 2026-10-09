import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";
import { apiUrl, ids, publishableKey, recordFetch, visitorStorage, visitorToken } from "./helpers/arky-fixtures.mjs";

const STORE_ID = "9d3e7b50-1a26-4f8c-b74e-0c5a2d9f6e13";

const shared = {
  company_id: ids.company,
  company_location_id: ids.companyLocation,
  subscription_id: ids.subscription,
  query: "ORD-2026",
  statuses: ["confirmed", "partially_cancelled"],
  sources: ["renewal"],
  product_statuses: ["confirmed"],
  booking_statuses: ["completed", "no_show"],
  product_ids: [ids.product],
  booking_service_ids: ["service"],
  booking_resource_ids: ["resource"],
  from: 0,
  to: 20,
  created_at_from: 0,
  created_at_to: 30,
  updated_at_from: 5,
  limit: 1,
  sort_field: "price",
  sort_direction: "asc",
};

for (const scope of ["admin", "storefront"]) {
  test(`${scope} order discovery keeps combined filters, the chosen ordering and the opaque continuation`, async (context) => {
    const calls = recordFetch(context, (_call, count) => ({ items: [], cursor: count === 1 ? "order:+/=" : null }));
    const api = scope === "admin"
      ? createAdmin({ baseUrl: apiUrl, apiToken: "arky_api_orders" }).eshop.order
      : createStorefront(publishableKey, { apiUrl, sessionStorage: visitorStorage() }).eshop.order;
    const filters = scope === "admin" ? { store_id: STORE_ID, customer_id: ids.customer, ...shared } : shared;
    const first = await api.find(filters);
    assert.deepEqual(first, { items: [], cursor: "order:+/=" });
    assert.deepEqual(await api.find({ ...filters, cursor: first.cursor }), { items: [], cursor: null });
    assert.equal(calls.length, 2);
    assert.equal(calls[1].query.cursor, first.cursor);
    for (const call of calls) {
      assert.equal(call.path, scope === "admin" ? `/v1/stores/${STORE_ID}/orders` : "/v1/storefront/orders");
      assert.equal(call.method, "GET");
      assert.equal(call.body, null);
      assert.equal("store_id" in call.query, false);
      for (const [key, value] of Object.entries(filters)) {
        if (key === "store_id") continue;
        if (Array.isArray(value)) assert.deepEqual(JSON.parse(call.query[key]), value, key);
        else assert.equal(call.query[key], String(value), key);
      }
      if (scope === "storefront") {
        assert.equal("customer_id" in call.query, false);
        assert.equal(call.headers.get("authorization"), `Bearer ${visitorToken}`);
        assert.equal(call.headers.get("x-arky-publishable-key"), publishableKey);
      } else {
        assert.equal(call.query.customer_id, ids.customer);
        assert.equal(call.headers.get("authorization"), "Bearer arky_api_orders");
      }
    }
  });
}

test("storefront order reads go through the buyer's own routes and need the buyer's session", async (context) => {
  const calls = recordFetch(context, (call) => call.path.endsWith("/fulfillments") ? [] : { id: ids.order });
  const orders = createStorefront(publishableKey, { apiUrl, sessionStorage: visitorStorage() }).eshop.order;
  await orders.get({ id: ids.order });
  await orders.fulfillments({ order_id: ids.order });
  assert.deepEqual(calls.map(({ method, path }) => [method, path]), [
    ["GET", `/v1/storefront/orders/${ids.order}`],
    ["GET", `/v1/storefront/orders/${ids.order}/fulfillments`],
  ]);
  for (const call of calls) assert.equal(call.headers.get("authorization"), `Bearer ${visitorToken}`);
});
