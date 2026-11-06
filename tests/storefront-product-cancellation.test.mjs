import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { createStorefront, initialize } from "../dist/storefront.js";
import { apiUrl, fixedIdFactories, ids, publishableKey, recordFetch, visitorStorage } from "./helpers/arky-fixtures.mjs";

test("a buyer cannot cancel a product line from the storefront: the route is gone and only staff cancel product items", () => {
  const store = initialize(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, sessionStorage: visitorStorage() });
  const client = createStorefront(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, sessionStorage: visitorStorage() });
  assert.equal("cancelProductItem" in store.eshop.order, false);
  assert.equal("cancelProductItem" in client.eshop.order, false);
  assert.equal(typeof store.eshop.order.cancelBookingItem, "function");
  assert.equal(typeof createAdmin({ apiUrl, secretKey: "arky_secret_test" }).eshop.order.cancelProductItem, "function");
});

test("a buyer's booking cancellation sends the app-picked credit id and the order version only", async (context) => {
  const calls = recordFetch(context, () => ({ id: ids.order }));
  const store = initialize(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, sessionStorage: visitorStorage() });
  await store.eshop.order.cancelBookingItem({ order_id: ids.order, line_item_id: ids.line, credit_id: ids.credit, expected_updated_at: 7 });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/storefront/orders/${ids.order}/booking-items/${ids.line}/cancel`, { credit_id: ids.credit, expected_updated_at: 7 }],
  ]);
  await assert.rejects(store.eshop.order.cancelBookingItem({ order_id: ids.order, line_item_id: ids.line, credit_id: "credit", expected_updated_at: 7 }), TypeError);
  assert.equal(calls.length, 1);
});
