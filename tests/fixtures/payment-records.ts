import { epochMilliseconds } from "arky-sdk";
import type {
  CardReceiptDevice,
  EpochMilliseconds,
  MonriCardPaymentStatus,
  MonriCheckoutStatus,
  MonriRefund,
  MonriRefundStatus,
  MonriTransaction,
  Payment,
  PaymentType,
  PaymentTypeName,
  AccountActor,
  RecordedRefund,
  RecordedRefundMethod,
  RecordedRefundReturned,
  RecordedRefundSent,
  RecordedRefundStatus,
  RecordedMethod,
  RecordedPaymentStatus,
  RefundRequest,
  RefundApplication,
  StripeCheckoutStatus,
  StripeCardPaymentStatus,
  StripeDispute,
  StripeRefund,
  StripeDashboardRefund,
  StripeDashboardRefundSource,
  StripeDashboardRefundStatus,
  StripeRefundStatus,
  PaymentStatusName,
  PaymentVoid,
} from "arky-sdk";

type Assert<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type Of<T extends PaymentTypeName> = Extract<PaymentType, { type: T }>;

const at = epochMilliseconds(1_700_000_000_000);
const actor = {
  account_id: "ca60db1c-68d1-42d5-8b55-8a1e04f2cb2f",
  snapshot: {
    email: "owner@example.test",
    credential_type: { type: "session" as const },
  },
};
const transaction: MonriTransaction = {
  transaction_id: "18446744073709551615",
  amount: 4000,
  response_code: "0000",
  created_at: at,
};
const refund: MonriRefund = {
  type: "monri",
  id: "550e8400-e29b-41d4-a716-446655440000",
  money: { amount: 4000, currency: "bam" },
  request: {
    actor,
    reason: "user_request",
    application: {
      type: "commercial_credit",
      allocations: [
        {
          order_credit_id: "credit",
          order_credit_allocation_id: "allocation",
          amount: 4000,
        },
      ],
    },
    notify_user: false,
  },
  status: { type: "succeeded", transaction },
  created_at: at,
};

export const monriPayment: Payment = {
  id: "f17c0b95-2e4d-4a83-9b6c-31d5e8a70f24",
  tenant_id: "5e9b3d71-c826-4a04-b7f5-0d2a8e6c4f19",
  order_id: "4a2c7c0d-4389-4aae-b3d7-02ff834a024d",
  payment_option_id: "5b8c1e47-3d29-4a6f-9c15-7e0d2f4a8b31",
  payment_option_key: "monri-cards",
  money: { amount: 4000, currency: "bam" },
  type: {
    type: "monri_checkout",
    status: { type: "paid", transaction },
    refunds: [refund],
    receipt_device: { type: "device", fiscal_device_id: "2d7f9b14-6c38-4a05-9e21-8b4c0f6a3d57" },
  },
  holds: [],
  status: "paid",
  void: { type: "not_recorded" },
  created_at: at,
  updated_at: at,
};

export const recordedPayment: Payment = {
  ...monriPayment,
  status: "voided",
  void: { type: "voided" },
  id: "a7c3e1f5-6b28-4d90-9e4a-2f8d0b6c1e73",
  type: {
    type: "recorded",
    method: { type: "cash" },
    reference: "Wrong cash entry",
    recorded_by: actor,
    status: {
      type: "voided",
      by: actor,
      reason: "No cash changed hands",
      at,
    },
    refunds: [
      {
        type: "recorded",
        id: "6e2a9d47-1b85-4c30-9f7e-2d4c8a1b5e93",
        money: { amount: 4000, currency: "bam" },
        request: {
          actor,
          reason: "user_request",
          application: { type: "excess_collection", reason: "Extra cash" },
          notify_user: true,
        },
        status: {
          type: "returned",
          sent: { recorded_by: actor, reference: "Payout 1", recorded_at: at, method: { type: "cash" } },
          returned: {
            recorded_by: actor,
            reference: "Returned cash",
            recorded_at: at,
          },
        },
        created_at: at,
      },
    ],
  },
  holds: [
    {
      id: "531b79f6-86d4-48cd-a241-73b7f16256b6",
      reason: { type: "money_after_end" },
      opened_at: at,
      status: {
        type: "resolved",
        by: actor,
        note: "Returned to the user",
        at,
      },
    },
    {
      id: "90ce1835-5c4b-47de-9f81-38980b7e7bcd",
      reason: { type: "money_after_end" },
      opened_at: at,
      status: { type: "open" },
    },
  ],
};

export type PaymentRecordContracts = [
  Assert<
    Equal<
      PaymentTypeName,
      | "stripe_checkout"
      | "stripe_card"
      | "monri_checkout"
      | "monri_card"
      | "recorded"
    >
  >,
  Assert<Missing<Payment, "route" | "captures" | "refund_ids" | "status_revision">>,
  Assert<Equal<Payment["status"], PaymentStatusName>>,
  Assert<Equal<Payment["void"], PaymentVoid>>,
  Assert<Equal<PaymentVoid["type"], "available" | "not_recorded" | "voided" | "refunded" | "receipted">>,
  Assert<Equal<Extract<PaymentVoid, { type: "receipted" }>, { type: "receipted" }>>,
  Assert<Equal<"invoice_id" extends keyof Payment ? true : false, false>>,
  Assert<Equal<Of<"monri_checkout">["refunds"], MonriRefund[]>>,
  Assert<Equal<Of<"monri_card">["refunds"], MonriRefund[]>>,
  Assert<Equal<Of<"stripe_checkout">["refunds"], (StripeRefund | StripeDashboardRefund)[]>>,
  Assert<Equal<Of<"stripe_checkout">["disputes"], StripeDispute[]>>,
  Assert<Equal<Of<"recorded">["refunds"], RecordedRefund[]>>,
  Assert<Equal<Of<"recorded">["method"], RecordedMethod>>,
  Assert<Equal<Of<"recorded">["status"], RecordedPaymentStatus>>,
  Assert<Missing<Of<"recorded">, "collections" | "requested" | "receipt_device">>,
  Assert<Equal<Of<"monri_checkout">["receipt_device"], CardReceiptDevice>>,
  Assert<Equal<Of<"stripe_card">["receipt_device"], CardReceiptDevice>>,
  Assert<Equal<MonriTransaction["transaction_id"], string>>,
  Assert<
    Missing<
      Of<"monri_checkout">,
      "session" | "client_secret" | "authorization_void" | "transaction_type"
    >
  >,
  Assert<
    Equal<
      MonriCheckoutStatus["type"],
      | "pending"
      | "creating"
      | "unknown"
      | "open"
      | "paid"
      | "failed"
      | "cancelled"
      | "confirmed_made"
    >
  >,
  Assert<
    Equal<
      Extract<MonriCheckoutStatus, { type: "paid" }>["transaction"],
      MonriTransaction
    >
  >,
  Assert<
    Equal<
      Extract<MonriRefundStatus, { type: "confirmed_made" }>["transaction_id"],
      string
    >
  >,
  Assert<
    Equal<
      Extract<MonriCardPaymentStatus, { type: "declined" }>["transaction"],
      MonriTransaction
    >
  >,
  Assert<
    Equal<RefundApplication["type"], "commercial_credit" | "excess_collection">
  >,
  Assert<Equal<StripeDashboardRefundSource["type"], "unallocated" | "allocated">>,
  Assert<Equal<StripeDashboardRefundStatus["type"], "unknown" | "pending" | "succeeded" | "returned" | "failed" | "cancelled">>,
  Assert<Equal<Extract<StripeCardPaymentStatus, { type: "confirmed_made" }>, { type: "confirmed_made"; payment_intent_id: string; by: AccountActor }>>,
  Assert<Equal<Extract<MonriCheckoutStatus, { type: "confirmed_made" }>, { type: "confirmed_made"; transaction_id: string; by: AccountActor }>>,
  Assert<Equal<RecordedPaymentStatus["type"], "active" | "voided">>,
  Assert<Equal<RecordedRefund["status"], RecordedRefundStatus>>,
  Assert<Equal<RecordedMethod["type"], "cash" | "card" | "bank_transfer" | "other">>,
  Assert<
    Equal<
      RecordedRefundStatus["type"],
      "requested" | "sent" | "returned" | "cancelled"
    >
  >,
  Assert<
    Equal<
      keyof RecordedRefundSent,
      "recorded_by" | "reference" | "recorded_at" | "method"
    >
  >,
  Assert<Equal<RecordedRefundSent["method"], RecordedRefundMethod>>,
  Assert<
    Equal<
      RecordedRefundMethod,
      | { type: "cash" }
      | { type: "cash_with_identity_document"; number: string }
      | { type: "card" }
      | { type: "bank_transfer" }
      | { type: "other" }
    >
  >,
  Assert<
    Equal<
      RecordedRefundReturned,
      { recorded_by: AccountActor; reference: string; recorded_at: EpochMilliseconds }
    >
  >,
  Assert<Missing<RecordedRefund, "receipts">>,
  Assert<
    Equal<
      Extract<RecordedRefundStatus, { type: "sent" }>,
      { type: "sent" } & RecordedRefundSent
    >
  >,
  Assert<
    Equal<
      Extract<RecordedRefundStatus, { type: "returned" }>["sent"],
      RecordedRefundSent
    >
  >,
  Assert<
    Equal<
      Extract<RecordedRefundStatus, { type: "returned" }>["returned"],
      RecordedRefundReturned
    >
  >,
  Assert<Missing<RecordedRefundReturned, "method">>,
  Assert<Equal<RefundRequest["notify_user"], boolean>>,
  Assert<
    Equal<
      StripeCardPaymentStatus["type"],
      | "pending"
      | "charging"
      | "unknown"
      | "requires_action"
      | "closing"
      | "paid"
      | "cancelled"
      | "failed"
      | "confirmed_made"
      | "confirmed_not_made"
    >
  >,
  Assert<
    Equal<
      StripeCheckoutStatus["type"],
      | "pending"
      | "creating"
      | "unknown"
      | "open"
      | "closing"
      | "paid"
      | "expired"
      | "failed"
    >
  >,
  Assert<
    Equal<Extract<StripeRefundStatus, { type: "requires_action" }>, never>
  >,
  Assert<
    Equal<
      PaymentStatusName,
      | "pending"
      | "open"
      | "requires_action"
      | "closing"
      | "paid"
      | "expired"
      | "cancelled"
      | "declined"
      | "failed"
      | "unknown"
      | "voided"
    >
  >,
  Assert<
    Missing<
      Extract<StripeCheckoutStatus, { type: "paid" }>,
      "account_id" | "connected_account_id"
    >
  >,
];
