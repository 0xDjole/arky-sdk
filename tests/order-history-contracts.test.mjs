import assert from "node:assert/strict";
import test from "node:test";
import {
  createAdmin,
  orderBookingItems,
  orderProductItems,
  orderPurchaseAccessItems,
  orderCustomerGroupItems,
  orderRentalUseItems,
} from "../dist/index.js";
import { companyLocationOrder, retainedOrder as retained } from "./fixtures/retained-order.mjs";
import { errorResponse, ids, recordFetch } from "./helpers/arky-fixtures.mjs";

const baseUrl = "https://api.example.test";
const storeId = retained.store_id;
const otherStoreId = "7d3b9f15-c2a6-4e80-9b4d-1a6e8c2f5d73";

function client() {
  return createAdmin({ baseUrl, apiToken: "arky_api_history_contract" });
}

test("an order read keeps its cart source, the placed snapshot and every line family as sent", async (context) => {
  const calls = recordFetch(context, () => retained);
  const order = await client().eshop.order.get({ store_id: storeId, id: retained.id });
  assert.deepEqual(order, retained);
  assert.deepEqual(order.source, { type: "cart", cart_id: retained.source.cart_id, placed_by: retained.source.placed_by });
  assert.deepEqual(order.line_items.map((line) => line.type), ["product", "booking", "customer_group", "purchase_access"]);
  assert.deepEqual(order.source.placed_by, { type: "customer", customer_id: retained.customer_id, customer_session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" });
  assert.deepEqual(order.buyer, { type: "customer" });
  const [product] = orderProductItems(order);
  const [booking] = orderBookingItems(order);
  const [group] = orderCustomerGroupItems(order);
  const [access] = orderPurchaseAccessItems(order);
  assert.equal(product.snapshot.product_key, "consultation-credit");
  assert.equal(product.money_runs[0].money.unit_price, 1000);
  assert.equal("type" in product, true);
  assert.equal(booking.snapshot.service_key, "consultation");
  assert.equal(booking.attendance, "upcoming");
  assert.equal(group.customer_group_member_id, ids.customerGroupMember);
  assert.equal(access.order_customer_group_line_item_id, group.id);
  assert.equal("type" in group, true);
  assert.deepEqual(orderRentalUseItems(order), []);
  assert.deepEqual(orderProductItems(null), []);
  assert.equal(order.totals.total, 2900);
  for (const retired of ["product_items", "booking_items", "digital_items", "payment_id", "shipping_lines", "market_snapshot", "money"]) {
    assert.equal(retired in order, false, retired);
  }
  assert.deepEqual(calls.map(({ method, href }) => [method, href]), [["GET", `${baseUrl}/v1/stores/${storeId}/orders/${retained.id}`]]);
});

test("a company location order keeps its buyer, purchase order number, tax registrations, account placement and on-account approval", async (context) => {
  const calls = recordFetch(context, () => companyLocationOrder);
  const order = await client().eshop.order.get({ store_id: storeId, id: companyLocationOrder.id });
  assert.deepEqual(order, companyLocationOrder);
  assert.deepEqual(order.buyer, {
    type: "company_location",
    company_location_id: ids.companyLocation,
    purchase_order_number: "PO-2026-7",
    tax_registrations: [{ country: "BA", region: null, identifier: "4200000000000" }],
  });
  assert.deepEqual(order.source.placed_by, { type: "account", account_id: ids.account, snapshot: { email: "staff@example.test", credential_type: "session" } });
  assert.deepEqual(order.collection.approval, { type: "account", reason: "One-time Net30 for the location" });
  assert.equal("actor" in order.collection.approval, false);
  assert.equal("company_id" in order.buyer, false);
  assert.deepEqual(calls.map(({ method, path }) => [method, path]), [["GET", `/v1/stores/${storeId}/orders/${companyLocationOrder.id}`]]);
});

test("cancelling a whole order sends only the order version to the named store and answers the order", async (context) => {
  const signal = new AbortController().signal;
  const calls = recordFetch(context, () => retained);
  const api = client();
  assert.equal("setStoreId" in api, false);
  for (const removed of ["update", "cancelPending"]) assert.equal(removed in api.eshop.order, false, removed);
  assert.deepEqual(await api.eshop.order.cancel({ store_id: otherStoreId, order_id: "order/a?b", expected_updated_at: 7 }, { signal }), retained);
  assert.deepEqual(calls.map(({ method, href, body }) => [method, href, body]), [
    ["POST", `${baseUrl}/v1/stores/${otherStoreId}/orders/order%2Fa%3Fb/cancel`, { expected_updated_at: 7 }],
  ]);
  assert.equal(calls[0].signal, signal);
  await assert.rejects(async () => api.eshop.order.cancel({ store_id: "store/one", order_id: retained.id, expected_updated_at: 7 }), TypeError);
  assert.equal(calls.length, 1);
});

test("booking attendance, access revocation and a receipt resend each name the line or the app-picked id", async (context) => {
  const calls = recordFetch(context, (call) => call.path.endsWith("/resend-receipt") ? { id: ids.credit } : retained);
  const api = client().eshop.order;
  const lineId = "19f4bc18-4259-46b8-b5ef-3579d1dac971";
  await api.completeBookingItem({ store_id: storeId, order_id: retained.id, line_item_id: lineId, expected_updated_at: 3 });
  await api.markBookingItemNoShow({ store_id: storeId, order_id: retained.id, line_item_id: lineId, expected_updated_at: 4 });
  await api.revokeAccess({ store_id: storeId, id: retained.id, expected_updated_at: 5, line_item_id: "3e956b8d-efc3-42e6-a5c1-9fb38ea840fa", effective_at: 1_789_000_000_000, reason: "Chargeback" });
  await api.resendReceipt({ store_id: storeId, order_id: retained.id, id: ids.credit });
  const base = `/v1/stores/${storeId}/orders/${retained.id}`;
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `${base}/booking-items/${lineId}/complete`, { expected_updated_at: 3 }],
    ["POST", `${base}/booking-items/${lineId}/no-show`, { expected_updated_at: 4 }],
    ["POST", `${base}/access/revoke`, { expected_updated_at: 5, line_item_id: "3e956b8d-efc3-42e6-a5c1-9fb38ea840fa", effective_at: 1_789_000_000_000, reason: "Chargeback" }],
    ["POST", `${base}/resend-receipt`, { id: ids.credit }],
  ]);
  await assert.rejects(async () => api.resendReceipt({ store_id: storeId, order_id: retained.id, id: "receipt" }), {
    name: "TypeError",
    message: "The receipt id must be a canonical UUID v4 picked by the app",
  });
  assert.equal(calls.length, 4);
});

test("a refused order change is propagated once, without a retry or a replacement request", async (context) => {
  for (const status of [403, 409, 422]) {
    const calls = recordFetch(context, () => errorResponse(status, "ORDER.REFUSED", "Lifecycle denied"));
    await assert.rejects(client().eshop.order.cancel({ store_id: storeId, order_id: retained.id, expected_updated_at: 1 }), (error) => error.statusCode === status && error.code === "ORDER.REFUSED");
    assert.equal(calls.length, 1);
    context.mock.restoreAll();
  }
});
