import assert from "node:assert/strict";
import test from "node:test";

import { createAdmin } from "../dist/admin.js";
import { createStorefront } from "../dist/storefront.js";
import { apiUrl, errorResponse, fixedIdFactories, ids, storefrontIdentity, recordFetch, visitorStorage, visitorToken } from "./helpers/arky-fixtures.mjs";

const tenantId = "5d1e8b24-9c63-4a07-b2f5-8e3a6c0d9f41";
const otherTenantId = "a7c3e915-2d48-4b6f-8e01-3f9b5d7c2a64";
const paymentId = ids.payment;
const refundId = "6e2a9d47-1b85-4c30-9f7e-2d4c8a1b5e93";
const eventId = "d8b35cf1-6867-49b0-863d-fdc1a6a6e6dc";
const money = { amount: 1200, currency: "eur" };
const application = {
  type: "commercial_credit",
  allocations: [{ order_credit_id: ids.credit, order_credit_allocation_id: "allocation", amount: 1200 }],
};

function payments() {
  return createAdmin({ apiUrl: apiUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" }).eshop.payment;
}

test("payment discovery keeps native filters and its continuation on the named tenant, and an Order's payments are read through the Order", async (context) => {
  const calls = recordFetch(context, (call) => (call.path.includes("/orders/") ? [] : { items: [], cursor: null }));
  const filters = { status: "unknown", type: "monri_checkout", on_hold: true, updated_at_from: 5, sort_field: "updated_at", sort_direction: "asc", limit: 10, cursor: "next" };
  await payments().find({ tenant_id: tenantId, ...filters, order_id: ids.order });
  await payments().get({ tenant_id: otherTenantId, id: paymentId });
  const orders = createAdmin({ apiUrl: apiUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" }).eshop.order;
  assert.deepEqual(await orders.findPayments({ tenant_id: tenantId, order_id: ids.order }), []);
  assert.deepEqual(calls.map(({ method, path }) => [method, path]), [
    ["GET", `/v1/tenants/${tenantId}/payments`],
    ["GET", `/v1/tenants/${otherTenantId}/payments/${paymentId}`],
    ["GET", `/v1/tenants/${tenantId}/orders/${ids.order}/payments`],
  ]);
  assert.deepEqual(calls[0].query, Object.fromEntries(Object.entries(filters).map(([key, value]) => [key, String(value)])));
});

test("recorded payments carry the app-picked id, the exact money and how it came, on the invoice they pay", async (context) => {
  const calls = recordFetch(context, () => ({ payments: [{ id: paymentId }], fiscal_receipts: [] }));
  const part = { id: paymentId, payment_option_id: ids.paymentOption, money, method: { type: "bank_transfer", received_on: "2026-11-14" }, reference: "Bank transfer 42" };
  await payments().record({ tenant_id: tenantId, order_id: ids.order, fiscal_device_id: null, payments: [part] });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/tenants/${tenantId}/orders/${ids.order}/payments`, { fiscal_device_id: null, payments: [part] }],
  ]);
  for (const removed of ["createManual", "recordCollection", "voidCollection"]) assert.equal(removed in payments(), false, removed);
});

test("refunds live inside their payment: create, record receipts, cancel and resolve an unclear Monri refund", async (context) => {
  const calls = recordFetch(context, () => ({ id: paymentId }));
  const api = payments();
  for (const removed of ["refund", "capture", "dispute"]) {
    assert.equal(removed in createAdmin({ apiUrl: apiUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" }).eshop, false, removed);
  }
  await api.createRefund({ tenant_id: tenantId, payment_id: paymentId, id: refundId, money, reason: "user_request", application, notify_user: true });
  await api.recordRefundReceipt({ tenant_id: tenantId, payment_id: paymentId, refund_id: refundId, expected_updated_at: 2, receipt: { type: "sent", reference: "SEPA-1", method: { type: "bank_transfer" } } });
  await api.cancelRefund({ tenant_id: tenantId, payment_id: paymentId, refund_id: refundId, expected_updated_at: 3 });
  await api.resolveRefund({ tenant_id: tenantId, payment_id: paymentId, refund_id: refundId, expected_updated_at: 4, outcome: { type: "made", transaction_id: "18446744073709551615" } });
  const base = `/v1/tenants/${tenantId}/payments/${paymentId}/refunds`;
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", base, { id: refundId, money, reason: "user_request", application, notify_user: true }],
    ["POST", `${base}/${refundId}/receipts`, { expected_updated_at: 2, receipt: { type: "sent", reference: "SEPA-1", method: { type: "bank_transfer" } } }],
    ["POST", `${base}/${refundId}/cancel`, { expected_updated_at: 3 }],
    ["POST", `${base}/${refundId}/resolve`, { expected_updated_at: 4, outcome: { type: "made", transaction_id: "18446744073709551615" } }],
  ]);
});

test("an unclear charge, a hold and a void each name the payment and its version, and nothing cancels a payment any more", async (context) => {
  const calls = recordFetch(context, () => ({ id: paymentId }));
  const api = payments();
  await api.resolveCharge({ tenant_id: tenantId, payment_id: paymentId, expected_updated_at: 5, outcome: { type: "not_made" } });
  await api.resolveHold({ tenant_id: tenantId, payment_id: paymentId, expected_updated_at: 6, hold_id: "native-hold", note: "Reviewed original provider evidence" });
  await api.void({ tenant_id: tenantId, payment_id: paymentId, expected_updated_at: 7, reason: "Recorded twice" });
  const base = `/v1/tenants/${tenantId}/payments/${paymentId}`;
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `${base}/resolve-charge`, { expected_updated_at: 5, outcome: { type: "not_made" } }],
    ["POST", `${base}/resolve-hold`, { expected_updated_at: 6, hold_id: "native-hold", note: "Reviewed original provider evidence" }],
    ["POST", `${base}/void`, { expected_updated_at: 7, reason: "Recorded twice" }],
  ]);
  assert.equal("cancel" in api, false);
});

test("money commands refuse an invented id or tenant before any request", async (context) => {
  const calls = recordFetch(context, () => ({ id: paymentId }));
  const api = payments();
  const cases = [
    [() => api.record({ tenant_id: tenantId, order_id: ids.order, fiscal_device_id: null, payments: [{ id: "payment", payment_option_id: ids.paymentOption, money, method: { type: "cash" }, reference: null }] }), "The payment id must be a canonical UUID v4 picked by the app"],
    [() => api.createRefund({ tenant_id: tenantId, payment_id: paymentId, id: refundId.toUpperCase(), money, reason: "other", application, notify_user: false }), "The refund id must be a canonical UUID v4 picked by the app"],
    [() => api.void({ tenant_id: "tenant", payment_id: paymentId, expected_updated_at: 1, reason: "Wrong" }), "A Tenant target must be an explicit canonical UUID-v4"],
  ];
  for (const [call, message] of cases) await assert.rejects(async () => call(), { name: "TypeError", message });
  assert.equal(calls.length, 0);
});

test("a refused money command is propagated once with its code and never retried", async (context) => {
  for (const status of [403, 409, 422, 503]) {
    const calls = recordFetch(context, () => errorResponse(status, "PAYMENT.REFUSED", "Refused"));
    await assert.rejects(payments().createRefund({ tenant_id: tenantId, payment_id: paymentId, id: refundId, money, reason: "duplicate", application, notify_user: false }), (error) => error.statusCode === status && error.code === "PAYMENT.REFUSED");
    assert.equal(calls.length, 1);
    context.mock.restoreAll();
  }
});

test("provider events are listed per card payment option and status, read by id and resolved with their version", async (context) => {
  const calls = recordFetch(context, (call) => call.path.endsWith("incoming-webhooks") ? { items: [], cursor: null } : { id: eventId });
  const events = createAdmin({ apiUrl: apiUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" }).notification.incomingWebhook;
  await events.find({ tenant_id: tenantId, payment_option_id: ids.paymentOption, status: "review", limit: 20, cursor: "next" });
  await events.get({ tenant_id: tenantId, id: eventId });
  await events.resolve({ tenant_id: tenantId, id: eventId, expected_updated_at: 9, resolution: "ignore" });
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["GET", `/v1/tenants/${tenantId}/incoming-webhooks`, { payment_option_id: ids.paymentOption, status: "review", limit: "20", cursor: "next" }, null],
    ["GET", `/v1/tenants/${tenantId}/incoming-webhooks/${eventId}`, {}, null],
    ["POST", `/v1/tenants/${tenantId}/incoming-webhooks/${eventId}/resolve`, {}, { expected_updated_at: 9, resolution: "ignore" }],
  ]);
});

test("a cash or manual option's inbox comes back as the Server's not-a-card-option refusal", async (context) => {
  const calls = recordFetch(context, () => errorResponse(409, "INCOMING_WEBHOOK.NOT_CARD_OPTION", "Only card payment options receive provider events"));
  const events = createAdmin({ apiUrl: apiUrl, accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" }).notification.incomingWebhook;
  await assert.rejects(events.find({ tenant_id: tenantId, payment_option_id: ids.otherPaymentOption, status: "review" }), (error) => error.statusCode === 409 && error.code === "INCOMING_WEBHOOK.NOT_CARD_OPTION");
  assert.deepEqual(calls[0].query, { payment_option_id: ids.otherPaymentOption, status: "review" });
});

test("a refund made in Monri's back office is recorded under the app's refund id with its transaction", async (context) => {
  const calls = recordFetch(context, () => ({ id: paymentId }));
  const request = { tenant_id: tenantId, payment_id: paymentId, id: refundId, money, reason: "user_request", application, notify_user: true, transaction_id: "monri-refund-42" };
  const before = structuredClone(request);
  assert.deepEqual(await payments().recordMadeRefund(request), { id: paymentId });
  assert.deepEqual(request, before);
  assert.deepEqual(calls.map(({ method, path, query, body }) => [method, path, query, body]), [
    ["POST", `/v1/tenants/${tenantId}/payments/${paymentId}/refunds/made`, {}, { id: refundId, money, reason: "user_request", application, notify_user: true, transaction_id: "monri-refund-42" }],
  ]);
  for (const id of [undefined, "refund-1", refundId.toUpperCase()]) {
    await assert.rejects(async () => payments().recordMadeRefund({ ...request, id }), {
      name: "TypeError",
      message: "The refund id must be a canonical UUID v4 picked by the app",
    });
  }
  await assert.rejects(async () => payments().recordMadeRefund({ ...request, tenant_id: "tenant/one" }), TypeError);
  assert.equal(calls.length, 1);
});

test("a buyer reads their own order's payments through storefront routes", async (context) => {
  const calls = recordFetch(context, (call) => call.path.endsWith("/payments") ? [] : { id: paymentId });
  const orders = createStorefront(storefrontIdentity, { visitorIdentity: { user_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58", session_id: "8f2b6d41-3c95-4e07-b1a8-7d4c0e9f2b63" }, ...fixedIdFactories, apiUrl, sessionStorage: visitorStorage() }).eshop.order;
  await orders.findPayments({ order_id: ids.order });
  await orders.getPayment({ order_id: ids.order, payment_id: paymentId });
  await orders.resumePayment({ order_id: ids.order });
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["GET", `/v1/storefront/orders/${ids.order}/payments`, null],
    ["GET", `/v1/storefront/orders/${ids.order}/payments/${paymentId}`, null],
    ["POST", `/v1/storefront/orders/${ids.order}/payment-action`, null],
  ]);
  for (const call of calls) assert.equal(call.headers.get("authorization"), `Bearer ${visitorToken}`);
});
