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
  RefundApplication,
  StripeCheckoutStatus,
  StripeDispute,
  StripeRefund,
  StripeRefundSource,
} from "arky-sdk";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type Of<T extends PaymentTypeName> = Extract<PaymentType, { type: T }>;

const at = epochMilliseconds(1_700_000_000_000);
const actor = { account_id: "ca60db1c-68d1-42d5-8b55-8a1e04f2cb2f", snapshot: { email: "owner@example.test", credential_type: "session" as const } };
const transaction: MonriTransaction = { transaction_id: "18446744073709551615", amount: 4000, response_code: "0000", created_at: at };
const refund: MonriRefund = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  money: { amount: 4000, currency: "bam" },
  request: { actor, reason: "customer_request", application: { type: "commercial_credit", allocations: [{ order_credit_id: "credit", order_credit_allocation_id: "allocation", amount: 4000 }] } },
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
  Assert<Missing<Extract<StripeCheckoutStatus, { type: "paid" }>, "account_id" | "connected_account_id">>,
];
