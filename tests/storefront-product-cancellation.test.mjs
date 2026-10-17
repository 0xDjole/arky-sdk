import assert from "node:assert/strict";
import test from "node:test";
import { initialize } from "../dist/storefront.js";
import { apiUrl, ids, publishableKey, recordFetch, visitorStorage, visitorToken } from "./helpers/arky-fixtures.mjs";

test("a buyer's product cancellation keeps the exact units and the app-picked credit id across a lost response", async (context) => {
  const calls = recordFetch(context, (_call, count) => count === 1
    ? Response.json({ error: "GENERAL.UNAVAILABLE", message: "Lost response", status_code: 503, validation_errors: [] }, { status: 503 })
    : { id: ids.order });
  const store = initialize(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, sessionStorage: visitorStorage() });
  const request = {
    order_id: "order/one",
    line_item_id: "line/one",
    credit_id: ids.credit,
    expected_updated_at: 1_700_000_000_000,
    units: [{ first_unit: 2, quantity: 4 }],
  };
  const before = structuredClone(request);
  await assert.rejects(store.eshop.order.cancelProductItem(request), (error) => error.statusCode === 503);
  assert.deepEqual(await store.eshop.order.cancelProductItem(request), { id: ids.order });
  assert.deepEqual(request, before);
  assert.equal(calls.length, 2);
  for (const call of calls) {
    assert.equal(call.method, "POST");
    assert.equal(call.href, `${apiUrl}/v1/storefront/orders/order%2Fone/product-items/line%2Fone/cancel`);
    assert.equal(call.headers.get("authorization"), `Bearer ${visitorToken}`);
    assert.equal(call.headers.get("x-arky-publishable-key"), publishableKey);
    assert.deepEqual(call.body, { credit_id: ids.credit, expected_updated_at: request.expected_updated_at, units: request.units });
  }
  for (const credit_id of [undefined, "customer-cancellation", ids.credit.toUpperCase()]) {
    await assert.rejects(store.eshop.order.cancelProductItem({ ...request, credit_id }), {
      name: "TypeError",
      message: "The credit id must be a canonical UUID v4 picked by the app",
    });
  }
  assert.equal(calls.length, 2);
});

test("a buyer's booking cancellation sends the app-picked credit id and the order version only", async (context) => {
  const calls = recordFetch(context, () => ({ id: ids.order }));
  const store = initialize(publishableKey, { visitorIdentity: { customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, createVisitorIdentity: () => ({ customer_id: "3a7d9c15-6e24-4b80-9f1c-8d5e2a6b0c47", session_id: "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14" }), createSessionId: () => "1d9e7b35-4a62-4c18-8e0f-5b3a7c2d9e14", createId: () => "5c0e7a92-3b14-4d68-9f2a-1e7c4b9d0a36", createOrderToken: () => `arky_ot_${"F".repeat(42)}A`, apiUrl, sessionStorage: visitorStorage() });
  await store.eshop.order.cancelBookingItem({ order_id: ids.order, line_item_id: ids.line, credit_id: ids.credit, expected_updated_at: 7 });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/storefront/orders/${ids.order}/booking-items/${ids.line}/cancel`, { credit_id: ids.credit, expected_updated_at: 7 }],
  ]);
  await assert.rejects(store.eshop.order.cancelBookingItem({ order_id: ids.order, line_item_id: ids.line, credit_id: "credit", expected_updated_at: 7 }), TypeError);
  assert.equal(calls.length, 1);
});
