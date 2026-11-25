import assert from "node:assert/strict";
import test from "node:test";
import { createAdmin } from "../dist/admin.js";
import { errorResponse, ids, recordFetch } from "./helpers/arky-fixtures.mjs";

const deskDevice = "2d7f9b14-6c38-4a05-9e21-8b4c0f6a3d57";
const cardPayment = "8b3e6f21-4c97-4d0a-b5e2-1f7c9a3d6e84";
const actor = { account_id: ids.account, snapshot: { email: "desk@example.test", credential_type: { type: "session" } } };

function admin() {
  return createAdmin({ apiUrl: "https://desk.example.test", accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA" });
}

function saleReceipt() {
  return {
    id: "3c8e1a64-7b29-4d05-9f3e-2a6c8b0d4e17",
    store_id: ids.store,
    order_id: ids.order,
    fiscal_device_id: deskDevice,
    type: {
      type: "sale",
      targets: [{ type: "booking", line_item_id: ids.line }],
      payments: [{ payment_id: ids.payment, amount: 600 }, { payment_id: cardPayment, amount: 400 }],
    },
    document: {
      type: "tax_core_items",
      lines: [
        {
          target: { type: "booking", line_item_id: ids.line },
          name: "Pregled",
          unit: "kom",
          code: "86900000",
          label: "Ђ",
          rate: { numerator: 17, denominator: 100 },
          quantity: 1,
          unit_price: 1000,
        },
      ],
      cashier: "Ana Kovač",
      buyer: { type: "anonymous" },
      state: { type: "requested" },
    },
    created_at: 2,
    updated_at: 2,
  };
}

function recorded(id, money, method, reference) {
  return {
    id,
    store_id: ids.store,
    order_id: ids.order,
    payment_option_id: ids.paymentOption,
    payment_option_key: "desk",
    money,
    type: { type: "recorded", method, reference, recorded_by: actor, status: { type: "active" }, refunds: [] },
    holds: [],
    status: "paid",
    void: { type: "available" },
    created_at: 2,
    updated_at: 2,
  };
}

test("a desk sitting records its payments on the invoice in one request that names the device, and answers each payment paid with the receipts that save made", async (context) => {
  const parts = [
    { id: ids.payment, payment_option_id: ids.paymentOption, money: { amount: 600, currency: "bam" }, method: { type: "cash" }, reference: null },
    { id: cardPayment, payment_option_id: ids.otherPaymentOption, money: { amount: 400, currency: "bam" }, method: { type: "card" }, reference: "Terminal slip 42" },
  ];
  const answer = { payments: parts.map((part) => recorded(part.id, part.money, part.method, part.reference)), fiscal_receipts: [saleReceipt()] };
  const calls = recordFetch(context, () => answer);
  const recordedPayments = await admin().eshop.payment.record({ store_id: ids.store, order_id: ids.order, fiscal_device_id: deskDevice, payments: parts });
  assert.deepEqual(recordedPayments, answer);
  assert.deepEqual(recordedPayments.payments.map((payment) => [payment.type.type, payment.status]), [["recorded", "paid"], ["recorded", "paid"]]);
  assert.deepEqual(recordedPayments.fiscal_receipts.map((receipt) => [receipt.fiscal_device_id, receipt.type.payments]), [[deskDevice, [{ payment_id: ids.payment, amount: 600 }, { payment_id: cardPayment, amount: 400 }]]]);
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/stores/${ids.store}/orders/${ids.order}/payments`, { fiscal_device_id: deskDevice, payments: parts }],
  ]);
});

test("a bank transfer names the day it arrived, and a place that receipts nothing sends no device on purpose", async (context) => {
  const part = {
    id: ids.payment,
    payment_option_id: ids.paymentOption,
    money: { amount: 1000, currency: "eur" },
    method: { type: "bank_transfer", received_on: "2026-11-14" },
    reference: "Statement 2026-11-14",
  };
  const answer = { payments: [recorded(part.id, part.money, part.method, part.reference)], fiscal_receipts: [] };
  const calls = recordFetch(context, () => answer);
  assert.deepEqual(await admin().eshop.payment.record({ store_id: ids.store, order_id: ids.order, fiscal_device_id: null, payments: [{ ...part, extra: "dropped" }] }), answer);
  assert.deepEqual(calls[0].body, { fiscal_device_id: null, payments: [part] });
});

test("every recorded payment carries an id the app picked, so one made-up id stops the whole sitting before any request", async (context) => {
  const calls = recordFetch(context, () => []);
  const parts = [
    { id: ids.payment, payment_option_id: ids.paymentOption, money: { amount: 600, currency: "bam" }, method: { type: "cash" }, reference: null },
    { id: "payment-2", payment_option_id: ids.paymentOption, money: { amount: 400, currency: "bam" }, method: { type: "cash" }, reference: null },
  ];
  await assert.rejects(async () => admin().eshop.payment.record({ store_id: ids.store, order_id: ids.order, fiscal_device_id: deskDevice, payments: parts }), {
    name: "TypeError",
    message: "The payment id must be a canonical UUID v4 picked by the app",
  });
  await assert.rejects(async () => admin().eshop.payment.record({ store_id: "store", order_id: ids.order, fiscal_device_id: deskDevice, payments: [parts[0]] }), TypeError);
  assert.equal(calls.length, 0);
});

test("a recorded payment is voided with the version and reason, and a void a receipt blocks reaches the caller unchanged", async (context) => {
  const voided = { ...recorded(ids.payment, { amount: 600, currency: "bam" }, { type: "cash" }, null), status: "voided", void: { type: "voided" } };
  let refuse = false;
  const calls = recordFetch(context, () => (refuse ? errorResponse(409, "PAYMENT.RECEIPTED", "A fiscal receipt names this payment; a correction must reverse that receipt first") : voided));
  const api = admin().eshop.payment;
  const answered = await api.void({ store_id: ids.store, payment_id: ids.payment, expected_updated_at: 2, reason: "Typed the wrong amount" });
  assert.deepEqual(answered, voided);
  assert.deepEqual(answered.void, { type: "voided" });
  refuse = true;
  await assert.rejects(api.void({ store_id: ids.store, payment_id: ids.payment, expected_updated_at: 3, reason: "Again" }), (error) => error.statusCode === 409 && error.code === "PAYMENT.RECEIPTED");
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", `/v1/stores/${ids.store}/payments/${ids.payment}/void`, { expected_updated_at: 2, reason: "Typed the wrong amount" }],
    ["POST", `/v1/stores/${ids.store}/payments/${ids.payment}/void`, { expected_updated_at: 3, reason: "Again" }],
  ]);
  for (const removed of ["createManual", "recordCollection", "voidCollection", "cancel"]) assert.equal(removed in api, false, removed);
});

test("a refund Stripe started is allocated with the payment version, to the order's credits or as excess money with its reason", async (context) => {
  const refundId = "6e2a9d47-1b85-4c30-9f7e-2d4c8a1b5e93";
  const credit = { type: "commercial_credit", allocations: [{ order_credit_id: ids.credit, order_credit_allocation_id: "7c4d1e92-5a38-4b06-9f2e-1d8b3c6a0e57", amount: 500 }] };
  const excess = { type: "excess_collection", reason: "The customer paid twice" };
  const by = { account_id: ids.account, snapshot: { email: "owner@example.test", credential_type: { type: "session" } } };
  const allocated = (application) => ({
    id: ids.payment,
    type: {
      type: "stripe_checkout",
      refunds: [{ type: "stripe_dashboard", id: refundId, money: { amount: 500, currency: "eur" }, source: { type: "allocated", reason: "requested_by_customer", by, application }, status: { type: "succeeded", stripe_refund_id: "re_1", balance_transaction_id: "txn_1" }, created_at: 2 }],
    },
  });
  const answers = [allocated(credit), allocated(excess)];
  const calls = recordFetch(context, () => answers.shift());
  const api = admin().eshop.payment;
  const first = await api.allocateRefund({ store_id: ids.store, payment_id: ids.payment, refund_id: refundId, expected_updated_at: 9, application: credit, allocations: credit.allocations });
  const second = await api.allocateRefund({ store_id: ids.store, payment_id: ids.payment, refund_id: refundId, expected_updated_at: 10, application: excess });
  assert.deepEqual([first.type.refunds[0].source.application, second.type.refunds[0].source.application], [credit, excess]);
  assert.equal("allocations" in second.type.refunds[0].source, false);
  const path = `/v1/stores/${ids.store}/payments/${ids.payment}/refunds/${refundId}/allocations`;
  assert.deepEqual(calls.map(({ method, path, body }) => [method, path, body]), [
    ["POST", path, { expected_updated_at: 9, application: credit }],
    ["POST", path, { expected_updated_at: 10, application: excess }],
  ]);
});

test("a second allocation of the same refund ends with Arky's REFUND_ALLOCATED", async (context) => {
  const refundId = "6e2a9d47-1b85-4c30-9f7e-2d4c8a1b5e93";
  const calls = recordFetch(context, () => errorResponse(409, "PAYMENT.REFUND_ALLOCATED", "This refund already names its application"));
  await assert.rejects(
    admin().eshop.payment.allocateRefund({ store_id: ids.store, payment_id: ids.payment, refund_id: refundId, expected_updated_at: 11, application: { type: "excess_collection", reason: "Again" } }),
    (error) => error.statusCode === 409 && error.code === "PAYMENT.REFUND_ALLOCATED",
  );
  assert.equal(calls.length, 1);
});
