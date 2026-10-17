import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";
import { apiUrl, ids, publishableKey, recordFetch, visitorStorage, visitorToken } from "./helpers/arky-fixtures.mjs";

const STORE_ID = "9d3e7b50-1a26-4f8c-b74e-0c5a2d9f6e13";

const shared = {
  company_location_id: ids.companyLocation,
  customer_group_member_id: ids.customerGroupMember,
  query: "ORD-2026",
  statuses: ["confirmed", "partially_cancelled"],
  sources: ["renewal"],
  product_statuses: ["confirmed"],
  booking_statuses: ["attended", "no_show"],
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
      ? createAdmin({ baseUrl: apiUrl, secretKey: "arky_api_orders" }).eshop.order
      : createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, sessionStorage: visitorStorage() }).eshop.order;
    const filters = scope === "admin" ? { store_id: STORE_ID, customer_id: ids.customer, company_id: ids.company, ...shared } : shared;
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
        assert.equal("company_id" in call.query, false);
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
  const orders = createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, sessionStorage: visitorStorage() }).eshop.order;
  await orders.get({ id: ids.order });
  await orders.fulfillments({ order_id: ids.order });
  assert.deepEqual(calls.map(({ method, path }) => [method, path]), [
    ["GET", `/v1/storefront/orders/${ids.order}`],
    ["GET", `/v1/storefront/orders/${ids.order}/fulfillments`],
  ]);
  for (const call of calls) assert.equal(call.headers.get("authorization"), `Bearer ${visitorToken}`);
});
