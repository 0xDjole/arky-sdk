import { epochMilliseconds } from "arky-sdk";
import type {
  MonriCardPaymentStatus,
  MonriCheckoutStatus,
  MonriRefund,
  MonriRefundStatus,
  MonriTransaction,
  Payment,
  PaymentType,
  PaymentTypeName,
  RecordedRefund,
  RecordedRefundStatus,
  RecordedRefundReceipt,
  RecordedCollection,
  RecordedCollectionStatus,
  RefundRequest,
  RefundApplication,
  StripeCheckoutStatus,
  StripeCardPaymentStatus,
  StripeDispute,
  StripeRefund,
  StripeRefundSource,
  StripeRefundStatus,
  PaymentStatusName,
} from "arky-sdk";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type Of<T extends PaymentTypeName> = Extract<PaymentType, { type: T }>;

const at = epochMilliseconds(1_700_000_000_000);
const actor = { account_id: "ca60db1c-68d1-42d5-8b55-8a1e04f2cb2f", snapshot: { email: "owner@example.test", credential_type: { type: "session" as const } } };
const transaction: MonriTransaction = { transaction_id: "18446744073709551615", amount: 4000, response_code: "0000", created_at: at };
const refund: MonriRefund = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  money: { amount: 4000, currency: "bam" },
  request: { actor, reason: "customer_request", application: { type: "commercial_credit", allocations: [{ order_credit_id: "credit", order_credit_allocation_id: "allocation", amount: 4000 }] }, notify_customer: false },
  status: { type: "succeeded", transaction },
  created_at: at,
};

export const monriPayment: Payment = {
  id: "f17c0b95-2e4d-4a83-9b6c-31d5e8a70f24",
  store_id: "5e9b3d71-c826-4a04-b7f5-0d2a8e6c4f19",
  order_id: "4a2c7c0d-4389-4aae-b3d7-02ff834a024d",
  payment_option_id: "5b8c1e47-3d29-4a6f-9c15-7e0d2f4a8b31",
  money: { amount: 4000, currency: "bam" },
  type: { type: "monri_checkout", status: { type: "paid", transaction }, refunds: [refund] },
  holds: [],
  created_at: at,
  updated_at: at,
};

export const recordedPayment: Payment = {
  ...monriPayment,
  id: "a7c3e1f5-6b28-4d90-9e4a-2f8d0b6c1e73",
  type: {
    type: "cash_on_delivery",
    status: "cancelled",
    collections: [{ id: "fca5ba8e-86af-4dd8-a1cd-6d19bca62e12", money: { amount: 4000, currency: "bam" }, recorded_by: actor, reference: "Wrong cash entry", recorded_at: at, status: { type: "voided", by: actor, reason: "No cash changed hands", at } }],
    refunds: [{ id: "6e2a9d47-1b85-4c30-9f7e-2d4c8a1b5e93", money: { amount: 4000, currency: "bam" }, request: { actor, reason: "customer_request", application: { type: "excess_collection", reason: "Extra cash" }, notify_customer: true }, status: { type: "returned", sent: { recorded_by: actor, reference: "Payout 1", recorded_at: at }, returned: { recorded_by: actor, reference: "Returned cash", recorded_at: at } }, created_at: at }],
  },
  holds: [
    { id: "531b79f6-86d4-48cd-a241-73b7f16256b6", message: "Late cash", opened_at: at, status: { type: "resolved", by: actor, note: "Returned to the customer", at } },
    { id: "90ce1835-5c4b-47de-9f81-38980b7e7bcd", message: "Late cash", opened_at: at, status: { type: "open" } },
  ],
};

export type PaymentRecordContracts = [
  Assert<Equal<PaymentTypeName, "stripe_checkout" | "stripe_card" | "monri_checkout" | "monri_card" | "cash_on_delivery" | "manual">>,
  Assert<Missing<Payment, "route" | "captures" | "refund_ids" | "status">>,
  Assert<Equal<Of<"monri_checkout">["refunds"], MonriRefund[]>>,
  Assert<Equal<Of<"monri_card">["refunds"], MonriRefund[]>>,
  Assert<Equal<Of<"stripe_checkout">["refunds"], StripeRefund[]>>,
  Assert<Equal<Of<"stripe_checkout">["disputes"], StripeDispute[]>>,
  Assert<Equal<Of<"cash_on_delivery">["refunds"], RecordedRefund[]>>,
  Assert<Equal<Of<"manual">["refunds"], RecordedRefund[]>>,
  Assert<Equal<MonriTransaction["transaction_id"], string>>,
  Assert<Missing<Of<"monri_checkout">, "session" | "client_secret" | "authorization_void" | "transaction_type">>,
  Assert<Equal<MonriCheckoutStatus["type"], "pending" | "creating" | "unknown" | "open" | "paid" | "failed" | "cancelled">>,
  Assert<Equal<Extract<MonriCheckoutStatus, { type: "paid" }>["transaction"], MonriTransaction>>,
  Assert<Equal<Extract<MonriRefundStatus, { type: "confirmed_made" }>["transaction_id"], string>>,
  Assert<Equal<Extract<MonriCardPaymentStatus, { type: "declined" }>["transaction"], MonriTransaction>>,
  Assert<Equal<RefundApplication["type"], "commercial_credit" | "excess_collection">>,
  Assert<Equal<StripeRefundSource["type"], "account" | "stripe">>,
  Assert<Equal<RecordedCollection["status"], RecordedCollectionStatus>>,
  Assert<Equal<RecordedCollectionStatus["type"], "active" | "voided">>,
  Assert<Equal<RecordedRefund["status"], RecordedRefundStatus>>,
  Assert<Equal<RecordedRefundStatus["type"], "requested" | "sent" | "returned" | "cancelled">>,
  Assert<Equal<keyof RecordedRefundReceipt, "recorded_by" | "reference" | "recorded_at">>,
  Assert<Missing<RecordedRefund, "receipts">>,
  Assert<Equal<Extract<RecordedRefundStatus, { type: "returned" }>["sent"], RecordedRefundReceipt>>,
  Assert<Equal<Extract<RecordedRefundStatus, { type: "returned" }>["returned"], RecordedRefundReceipt>>,
  Assert<Equal<RefundRequest["notify_customer"], boolean>>,
  Assert<Equal<StripeCardPaymentStatus["type"], "pending" | "charging" | "unknown" | "requires_action" | "closing" | "paid" | "cancelled" | "failed">>,
  Assert<Equal<StripeCheckoutStatus["type"], "pending" | "creating" | "unknown" | "open" | "closing" | "paid" | "expired" | "failed">>,
  Assert<Equal<Extract<StripeRefundStatus, { type: "requires_action" }>, never>>,
  Assert<Equal<PaymentStatusName, "pending" | "open" | "requires_action" | "closing" | "paid" | "expired" | "cancelled" | "declined" | "failed" | "unknown">>,
  Assert<Missing<Extract<StripeCheckoutStatus, { type: "paid" }>, "account_id" | "connected_account_id">>,
];
