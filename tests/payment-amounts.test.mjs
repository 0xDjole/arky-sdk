import assert from "node:assert/strict";
import test from "node:test";

import { disputeWithdrawnAmount, paymentAmounts, refundAmounts } from "../dist/storefront.js";
import { paymentAmounts as utilsPaymentAmounts } from "../dist/utils.js";
import { ids } from "./helpers/arky-fixtures.mjs";

const actor = { type: "account", account_id: ids.account };
const eur = (amount) => ({ amount, currency: "eur" });

function payment(id, amount, type) {
  return { id, store_id: ids.store, order_id: ids.order, payment_option_id: ids.paymentOption, payment_option_key: "desk", money: eur(amount), type, holds: [], status: "paid", created_at: 1, updated_at: 1 };
}

const stripe = payment(ids.payment, 5000, {
  type: "stripe_checkout",
  return_url: "https://shop.example.test",
  expires_at: 1,
  status: { type: "paid", payment_intent_id: "pi_1", charge_id: "ch_1", amount: 5000 },
  refunds: [
    { id: "r1", money: eur(1000), source: { type: "stripe", reason: "requested" }, status: { type: "succeeded", stripe_refund_id: "re_1", balance_transaction_id: "txn_1" }, created_at: 1 },
    { id: "r2", money: eur(500), source: { type: "stripe", reason: "requested" }, status: { type: "pending", stripe_refund_id: "re_2" }, created_at: 1 },
    { id: "r3", money: eur(300), source: { type: "stripe", reason: "requested" }, status: { type: "failed", stripe_refund_id: "re_3" }, created_at: 1 },
  ],
  disputes: [
    {
      id: "d1",
      stripe_dispute_id: "dp_1",
      money: eur(700),
      reason: "fraudulent",
      status: { type: "under_review" },
      balance_changes: [
        { type: "withdrawn", balance_transaction_id: "txn_2", money: eur(700) },
        { type: "reinstated", balance_transaction_id: "txn_3", money: eur(200) },
        { type: "fee", balance_transaction_id: "txn_4", money: eur(15) },
      ],
      created_at: 1,
    },
  ],
});

const monri = payment(ids.otherOrder, 2000, {
  type: "monri_card",
  payment_method: {},
  purpose: "renewal",
  status: { type: "confirmed_made", transaction_id: "9", by: actor },
  refunds: [
    { id: "m1", money: eur(400), request: {}, status: { type: "succeeded", transaction: { transaction_id: "10", amount: 350, response_code: "0000", created_at: 1 } }, created_at: 1 },
    { id: "m2", money: eur(100), request: {}, status: { type: "confirmed_made", transaction_id: "11", by: actor }, created_at: 1 },
    { id: "m3", money: eur(50), request: {}, status: { type: "sending", claim: {} }, created_at: 1 },
  ],
});

const receipt = { recorded_by: actor, reference: "cash", recorded_at: 1, method: { type: "cash" } };
const cash = payment(ids.credit, 1000, {
  type: "recorded",
  method: { type: "cash" },
  reference: null,
  recorded_by: actor,
  status: { type: "active" },
  refunds: [
    { id: "x1", money: eur(200), request: {}, status: { type: "sent", ...receipt }, created_at: 1 },
    { id: "x2", money: eur(100), request: {}, status: { type: "requested" }, created_at: 1 },
    { id: "x3", money: eur(50), request: {}, status: { type: "returned", sent: receipt, returned: { recorded_by: actor, reference: "cash", recorded_at: 1 } }, created_at: 1 },
  ],
});
const voidedCard = {
  ...payment(ids.line, 500, {
    type: "recorded",
    method: { type: "card" },
    reference: "Terminal slip 7",
    recorded_by: actor,
    status: { type: "voided", by: actor, reason: "Wrong", at: 2 },
    refunds: [],
  }),
  status: "voided",
};

test("paymentAmounts adds up paid, refunded, pending refunds and disputes the way Arky's order summary does", () => {
  assert.deepEqual(paymentAmounts([stripe, monri, cash, voidedCard]), { paid: 8000, refunded: 1650, refund_pending: 650, disputed: 500, net_paid: 5850 });
  assert.deepEqual(paymentAmounts([stripe]), { paid: 5000, refunded: 1000, refund_pending: 500, disputed: 500, net_paid: 3500 });
  assert.deepEqual(utilsPaymentAmounts([]), { paid: 0, refunded: 0, refund_pending: 0, disputed: 0, net_paid: 0 });
  assert.throws(() => paymentAmounts([stripe, { ...cash, order_id: ids.otherOrder }]), TypeError);
  assert.throws(() => paymentAmounts([stripe, { ...cash, money: { amount: 3000, currency: "bam" } }]), TypeError);
});

function disputedCheckout(money, dispute) {
  return {
    ...payment(ids.payment, money.amount, {
      type: "stripe_checkout",
      return_url: "https://shop.example.test",
      expires_at: 1,
      status: { type: "paid", payment_intent_id: "pi_9", charge_id: "ch_9", amount: money.amount },
      refunds: [],
      disputes: [dispute],
    }),
    money,
  };
}

function dispute(money, balanceChanges) {
  return { id: "d9", stripe_dispute_id: "dp_9", money, reason: "fraudulent", status: { type: "under_review" }, balance_changes: balanceChanges, created_at: 1 };
}

test("a reinstatement nets against its withdrawal", () => {
  const partly = dispute(eur(100), [
    { type: "withdrawn", balance_transaction_id: "txn_9", money: eur(100) },
    { type: "reinstated", balance_transaction_id: "txn_10", money: eur(60) },
  ]);
  assert.equal(disputeWithdrawnAmount(partly), 40);
  assert.equal(paymentAmounts([disputedCheckout(eur(5000), partly)]).disputed, 40);
});

test("a withdrawal in another currency counts as the dispute's amount", () => {
  const usd = (amount) => ({ amount, currency: "usd" });
  const converted = dispute(usd(10000), [{ type: "withdrawn", balance_transaction_id: "txn_11", money: eur(9215) }]);
  assert.equal(disputeWithdrawnAmount(converted), 10000);
  assert.equal(paymentAmounts([disputedCheckout(usd(10000), converted)]).disputed, 10000);
});

test("refundAmounts reads a payment's refunds the way paymentAmounts counts them", () => {
  assert.deepEqual(
    stripe.type.refunds.map((refund) => refundAmounts({ type: "stripe", refund })),
    [{ refunded: 1000, pending: 0 }, { refunded: 0, pending: 500 }, { refunded: 0, pending: 0 }],
  );
});

test("a recorded payment counts its whole money while active and nothing once voided", () => {
  assert.deepEqual(paymentAmounts([cash]), { paid: 1000, refunded: 200, refund_pending: 100, disputed: 0, net_paid: 800 });
  assert.deepEqual(paymentAmounts([voidedCard]), { paid: 0, refunded: 0, refund_pending: 0, disputed: 0, net_paid: 0 });
  assert.deepEqual(
    cash.type.refunds.map((refund) => refundAmounts({ type: "recorded", refund })),
    [{ refunded: 200, pending: 0 }, { refunded: 0, pending: 100 }, { refunded: 0, pending: 0 }],
  );
});

test("a staff payment adds up the same way, and a refund paid out in cash against an identity document counts once it is sent", () => {
  const identityDocument = { type: "cash_with_identity_document", number: "0123456789" };
  const request = { actor, reason: "customer_request", application: { type: "excess_collection", reason: "Paid twice" }, notify_customer: false };
  const paidOut = (reference) => ({ recorded_by: actor, reference, recorded_at: 2, method: identityDocument });
  const staffCash = {
    ...payment(ids.payment, 3000, {
      type: "recorded",
      method: { type: "cash" },
      reference: null,
      recorded_by: actor,
      status: { type: "active" },
      refunds: [
        { id: "s1", money: eur(700), request, status: { type: "sent", ...paidOut("Payout 7") }, created_at: 2 },
        { id: "s2", money: eur(300), request, status: { type: "requested" }, created_at: 2 },
        { id: "s3", money: eur(200), request, status: { type: "returned", sent: paidOut("Payout 8"), returned: { recorded_by: actor, reference: "Came back", recorded_at: 3 } }, created_at: 2 },
      ],
    }),
    void: { type: "refunded" },
  };
  assert.deepEqual(paymentAmounts([staffCash]), { paid: 3000, refunded: 700, refund_pending: 300, disputed: 0, net_paid: 2300 });
  assert.deepEqual(utilsPaymentAmounts([staffCash]), paymentAmounts([staffCash]));
  assert.deepEqual(
    staffCash.type.refunds.map((refund) => refundAmounts({ type: "recorded", refund })),
    [{ refunded: 700, pending: 0 }, { refunded: 0, pending: 300 }, { refunded: 0, pending: 0 }],
  );
});
