import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";
import { apiUrl, errorResponse, ids, publishableKey, recordFetch, visitorStorage, visitorToken } from "./helpers/arky-fixtures.mjs";

const storeId = "5d1e8b24-9c63-4a07-b2f5-8e3a6c0d9f41";
const otherStoreId = "a7c3e915-2d48-4b6f-8e01-3f9b5d7c2a64";
const paymentId = ids.payment;
const refundId = "6e2a9d47-1b85-4c30-9f7e-2d4c8a1b5e93";
const receiptId = "86b7bf60-67e8-4c92-b14c-e98f4b2f4101";
const collectionId = "fca5ba8e-86af-4dd8-a1cd-6d19bca62e12";
const eventId = "d8b35cf1-6867-49b0-863d-fdc1a6a6e6dc";
const money = { amount: 1200, currency: "eur" };
const application = {
  type: "commercial_credit",
  allocations: [{ order_credit_id: ids.credit, order_credit_allocation_id: "allocation", amount: 1200 }],
};

function payments() {
  return createAdmin({ baseUrl: apiUrl, apiToken: "contract-token" }).eshop.payment;
}

test("payment discovery keeps native filters and its continuation on the named store", async (context) => {
  const calls = recordFetch(context, () => ({ items: [], cursor: null }));
  const filters = { order_id: ids.order, status: "unknown", type: "monri_checkout", on_hold: true, updated_at_from: 5, sort_field: "updated_at", sort_direction: "asc", limit: 10, cursor: "next" };
  await payments().find({ store_id: storeId, ...filters });
  await payments().get({ store_id: otherStoreId, id: paymentId });
  assert.deepEqual(calls.map(({ method, path }) => [method, path]), [
    ["GET", `/v1/stores/${storeId}/payments`],
    ["GET", `/v1/stores/${otherStoreId}/payments/${paymentId}`],
  ]);
  assert.deepEqual(calls[0].query, Object.fromEntries(Object.entries(filters).map(([key, value]) => [key, String(value)])));
});

test("manual payments and recorded collections carry the app-picked id and the exact money", async (context) => {
  const calls = recordFetch(context, () => ({ id: paymentId }));
  await payments().createManual({ store_id: storeId, id: paymentId, order_id: ids.order, payment_option_id: ids.paymentOption, money, reference: "Bank transfer 42" });
  await payments().recordCollection({ store_id: storeId, payment_id: paymentId, id: collectionId, money, reference: null });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/stores/${storeId}/payments/manual`, { id: paymentId, order_id: ids.order, payment_option_id: ids.paymentOption, money, reference: "Bank transfer 42" }],
    ["POST", `/v1/stores/${storeId}/payments/${paymentId}/collections`, { id: collectionId, money, reference: null }],
  ]);
});

test("refunds live inside their payment: create, record receipts, cancel and resolve an unclear Monri refund", async (context) => {
  const calls = recordFetch(context, () => ({ id: paymentId }));
  const api = payments();
  for (const removed of ["refund", "capture", "dispute"]) {
    assert.equal(removed in createAdmin({ baseUrl: apiUrl, apiToken: "contract-token" }).eshop, false, removed);
  }
  await api.createRefund({ store_id: storeId, payment_id: paymentId, id: refundId, money, reason: "customer_request", application });
  await api.recordRefundReceipt({ store_id: storeId, payment_id: paymentId, refund_id: refundId, id: receiptId, receipt: { type: "sent", money, allocations: application.allocations, reference: "SEPA-1" } });
  await api.cancelRefund({ store_id: storeId, payment_id: paymentId, refund_id: refundId, expected_updated_at: 3 });
  await api.resolveRefund({ store_id: storeId, payment_id: paymentId, refund_id: refundId, expected_updated_at: 4, outcome: { type: "made", transaction_id: "18446744073709551615" } });
  const base = `/v1/stores/${storeId}/payments/${paymentId}/refunds`;
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", base, { id: refundId, money, reason: "customer_request", application }],
    ["POST", `${base}/${refundId}/receipts`, { id: receiptId, receipt: { type: "sent", money, allocations: application.allocations, reference: "SEPA-1" } }],
    ["POST", `${base}/${refundId}/cancel`, { expected_updated_at: 3 }],
    ["POST", `${base}/${refundId}/resolve`, { expected_updated_at: 4, outcome: { type: "made", transaction_id: "18446744073709551615" } }],
  ]);
});

test("an unclear charge, a hold and a cancellation each name the payment and its version", async (context) => {
  const calls = recordFetch(context, () => ({ id: paymentId }));
  const api = payments();
  await api.resolveCharge({ store_id: storeId, payment_id: paymentId, expected_updated_at: 5, outcome: { type: "not_made" } });
  await api.resolveHold({ store_id: storeId, payment_id: paymentId, expected_updated_at: 6, index: 0 });
  await api.cancel({ store_id: storeId, payment_id: paymentId, expected_updated_at: 7 });
  const base = `/v1/stores/${storeId}/payments/${paymentId}`;
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `${base}/resolve-charge`, { expected_updated_at: 5, outcome: { type: "not_made" } }],
    ["POST", `${base}/resolve-hold`, { expected_updated_at: 6, index: 0 }],
    ["POST", `${base}/cancel`, { expected_updated_at: 7 }],
  ]);
});

test("money commands refuse an invented id or store before any request", async (context) => {
  const calls = recordFetch(context, () => ({ id: paymentId }));
  const api = payments();
  const cases = [
    [() => api.createManual({ store_id: storeId, id: "payment", order_id: ids.order, payment_option_id: ids.paymentOption, money, reference: null }), "The payment id must be a canonical UUID v4 picked by the app"],
    [() => api.recordCollection({ store_id: storeId, payment_id: paymentId, id: "collection", money, reference: null }), "The collection id must be a canonical UUID v4 picked by the app"],
    [() => api.createRefund({ store_id: storeId, payment_id: paymentId, id: refundId.toUpperCase(), money, reason: "other", application }), "The refund id must be a canonical UUID v4 picked by the app"],
    [() => api.recordRefundReceipt({ store_id: storeId, payment_id: paymentId, refund_id: refundId, id: undefined, receipt: { type: "returned", sent_id: receiptId, money, reference: "R" } }), "The refund receipt id must be a canonical UUID v4 picked by the app"],
    [() => api.cancel({ store_id: "store", payment_id: paymentId, expected_updated_at: 1 }), "A Store target must be an explicit canonical UUID-v4"],
  ];
  for (const [call, message] of cases) await assert.rejects(async () => call(), { name: "TypeError", message });
  assert.equal(calls.length, 0);
});

test("a refused money command is propagated once with its code and never retried", async (context) => {
  for (const status of [403, 409, 422, 503]) {
    const calls = recordFetch(context, () => errorResponse(status, "PAYMENT.REFUSED", "Refused"));
    await assert.rejects(payments().createRefund({ store_id: storeId, payment_id: paymentId, id: refundId, money, reason: "duplicate", application }), (error) => error.statusCode === status && error.code === "PAYMENT.REFUSED");
    assert.equal(calls.length, 1);
    context.mock.restoreAll();
  }
});

test("provider events are listed by status, read by id and resolved with their version", async (context) => {
  const calls = recordFetch(context, (call) => call.path.endsWith("provider-events") ? { items: [], cursor: null } : { id: eventId });
  const events = createAdmin({ baseUrl: apiUrl, apiToken: "contract-token" }).eshop.providerEvent;
  await events.find({ store_id: storeId, status: "review", limit: 20, cursor: "next" });
  await events.get({ store_id: storeId, id: eventId });
  await events.resolve({ store_id: storeId, id: eventId, expected_updated_at: 9, resolution: "ignore" });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", `/v1/stores/${storeId}/provider-events`, { status: "review", limit: "20", cursor: "next" }, null],
    ["GET", `/v1/stores/${storeId}/provider-events/${eventId}`, {}, null],
    ["POST", `/v1/stores/${storeId}/provider-events/${eventId}/resolve`, {}, { expected_updated_at: 9, resolution: "ignore" }],
  ]);
});

test("a buyer reads their own order's payments through storefront routes", async (context) => {
  const calls = recordFetch(context, (call) => call.path.endsWith("/payments") ? [] : { id: paymentId });
  const orders = createStorefront(publishableKey, { apiUrl, sessionStorage: visitorStorage() }).eshop.order;
  await orders.findPayments({ order_id: ids.order });
  await orders.getPayment({ order_id: ids.order, payment_id: paymentId });
  await orders.paymentAction({ order_id: ids.order });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["GET", `/v1/storefront/orders/${ids.order}/payments`, null],
    ["GET", `/v1/storefront/orders/${ids.order}/payments/${paymentId}`, null],
    ["POST", `/v1/storefront/orders/${ids.order}/payment-action`, null],
  ]);
  for (const call of calls) assert.equal(call.headers.get("authorization"), `Bearer ${visitorToken}`);
});
