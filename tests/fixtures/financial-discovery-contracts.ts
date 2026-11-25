import { createAdmin, createStorefront } from "arky-sdk";
import type {
  CreatePaymentRefundParams,
  FindOrderFinancialSummariesParams,
  FindPaymentsParams,
  OrderFinancialConcern,
  OrderFinancialSummary,
  OrderFinancialSummaryOfOrder,
  Payment,
  PaymentHold,
  PaymentHoldReason,
  PaymentHoldStatus,
  PaymentStatusName,
  PaymentType,
  RecordRefundReceiptParams,
  RefundReceiptInput,
  ResolvePaymentHoldParams,
  StripeDispute,
  StripeRefund,
  MonriRefund,
  RecordedRefund,
  AccountActor,
  AllocatePaymentRefundParams,
  CalendarDate,
  CardReceiptDevice,
  EpochMilliseconds,
  Money,
  RecordedMethod,
  RecordedPaymentStatus,
  RecordPaymentPart,
  RecordPaymentsParams,
  RecordedPayments,
  RecordedRefundMethod,
  FiscalReceipt,
  RefundAllocation,
  RefundApplication,
  StripeDashboardRefundSource,
  StripeDashboardRefund,
  StripePaymentRefund,
  RefundRequest,
  VoidPaymentParams,
} from "arky-sdk";

type Assert<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Admin = ReturnType<typeof createAdmin>;
type Storefront = ReturnType<typeof createStorefront>;

const store_id = "d2a64f1b-8c37-4e59-b0a1-6f3e9c7d2b84";
const payments: FindPaymentsParams = {
  store_id,
  order_ids: ["b17a2c94-5d3e-4f61-8a07-9c2e4b6d1f38"],
  status: "unknown",
  type: "monri_card",
  on_hold: false,
  sort_field: "updated_at",
  sort_direction: "asc",
  limit: 25,
};
const client = createAdmin({
  apiUrl: "https://example.test",
  accountToken: "arky_at_ttttttttttttttttttttttttttttttttttttttttttA",
});
void client.eshop.payment.find(payments);
void client.eshop.order.findPayments({ store_id, order_id: "order" });
void client.eshop.order.getPayment({
  store_id,
  order_id: "order",
  payment_id: "payment",
});
const concerns: OrderFinancialConcern[] = [
  { type: "payment_hold", payment_id: "payment" },
  { type: "refund_unknown", payment_id: "payment", refund_id: "refund" },
  { type: "open_dispute", payment_id: "payment", dispute_id: "dispute" },
  { type: "excess_collection" },
];
void concerns;

export type FinancialContracts = [
  Assert<Missing<Admin["eshop"], "refund">>,
  Assert<Missing<Admin["eshop"], "dispute">>,
  Assert<
    Equal<
      keyof Parameters<Storefront["eshop"]["order"]["findPayments"]>[0],
      "order_id"
    >
  >,
  Assert<
    Equal<
      keyof Parameters<Storefront["eshop"]["order"]["getPayment"]>[0],
      "order_id" | "payment_id"
    >
  >,
  Assert<Equal<NonNullable<FindPaymentsParams["status"]>, PaymentStatusName>>,
  Assert<Equal<FindPaymentsParams["order_ids"], string[] | undefined>>,
  Assert<Missing<FindPaymentsParams, "order_id">>,
  Assert<Equal<FindPaymentsParams["method"], "cash" | "card" | "bank_transfer" | "other" | undefined>>,
  Assert<Equal<Awaited<ReturnType<Admin["eshop"]["order"]["findPayments"]>>, Payment[]>>,
  Assert<RequiredField<Payment, "status">>,
  Assert<Missing<Payment, "status_revision">>,
  Assert<Equal<Payment["status"], PaymentStatusName>>,
  Assert<Equal<Payment["order_id"], string>>,
  Assert<Equal<Extract<PaymentStatusName, "voided">, "voided">>,
  Assert<Equal<PaymentType["type"], "stripe_checkout" | "stripe_card" | "monri_checkout" | "monri_card" | "recorded">>,
  Assert<Equal<Extract<PaymentType, { type: "stripe_checkout" | "stripe_card" | "monri_checkout" | "monri_card" }>["receipt_device"], CardReceiptDevice>>,
  Assert<Equal<CardReceiptDevice, { type: "no_receipt" } | { type: "device"; fiscal_device_id: string }>>,
  Assert<Equal<keyof Extract<PaymentType, { type: "recorded" }>, "type" | "method" | "reference" | "recorded_by" | "status" | "refunds">>,
  Assert<Missing<Extract<PaymentType, { type: "recorded" }>, "collections" | "requested">>,
  Assert<Equal<RecordedMethod, { type: "cash" } | { type: "card" } | { type: "bank_transfer"; received_on: CalendarDate } | { type: "other" }>>,
  Assert<Equal<RecordedPaymentStatus, { type: "active" } | { type: "voided"; by: AccountActor; reason: string; at: EpochMilliseconds }>>,
  Assert<Equal<Extract<StripeDashboardRefundSource, { type: "unallocated" }>, { type: "unallocated"; reason: string | null }>>,
  Assert<Equal<Extract<StripeDashboardRefundSource, { type: "allocated" }>, { type: "allocated"; reason: string | null; by: AccountActor; application: RefundApplication }>>,
  Assert<Equal<StripePaymentRefund, StripeRefund | StripeDashboardRefund>>,
  Assert<Equal<StripeRefund["request"], RefundRequest>>,
  Assert<Equal<StripeRefund["type"], "stripe">>,
  Assert<Equal<StripeDashboardRefund["type"], "stripe_dashboard">>,
  Assert<Equal<Extract<PaymentType, { type: "stripe_checkout" }>["refunds"], StripePaymentRefund[]>>,
  Assert<Equal<RefundApplication, { type: "commercial_credit"; allocations: RefundAllocation[] } | { type: "excess_collection"; reason: string }>>,
  Assert<
    Equal<
      NonNullable<FindPaymentsParams["sort_field"]>,
      "created_at" | "updated_at"
    >
  >,
  Assert<
    Equal<
      Extract<PaymentType, { type: "stripe_card" }>["refunds"],
      StripePaymentRefund[]
    >
  >,
  Assert<
    Equal<
      Extract<PaymentType, { type: "stripe_checkout" }>["disputes"],
      StripeDispute[]
    >
  >,
  Assert<
    Equal<
      Extract<PaymentType, { type: "monri_card" }>["refunds"],
      MonriRefund[]
    >
  >,
  Assert<
    Equal<
      Extract<PaymentType, { type: "recorded" }>["refunds"],
      RecordedRefund[]
    >
  >,
  Assert<Equal<Payment["holds"][number]["reason"], PaymentHoldReason>>,
  Assert<Missing<PaymentHold, "message">>,
  Assert<Equal<PaymentHoldReason["type"], "money_after_end" | "amount_mismatch" | "second_charge" | "unknown_provider_state" | "dispute_currency" | "account_outcome_disagrees" | "refund_amount_mismatch" | "binding_mismatch" | "refusal_disagrees" | "unproven_card_attempt" | "unproven_refund">>,
  Assert<Equal<Extract<PaymentHoldReason, { type: "account_outcome_disagrees" }>["operation"], "charge" | "refund" | "void" | "refund_not_made">>,
  Assert<Equal<keyof Extract<PaymentHoldReason, { type: "amount_mismatch" }>, "type">>,
  Assert<Equal<keyof Extract<PaymentHoldReason, { type: "refund_amount_mismatch" }>, "type" | "refund_id" | "reported">>,
  Assert<Equal<Extract<PaymentHoldReason, { type: "unproven_refund" }>, { type: "unproven_refund"; refund_id: string }>>,
  Assert<Equal<keyof Extract<PaymentHoldReason, { type: "refusal_disagrees" }>, "type" | "http_status" | "intent_id" | "state">>,
  Assert<Equal<PaymentHold["status"], PaymentHoldStatus>>,
  Assert<Equal<PaymentHoldStatus["type"], "open" | "resolved">>,
  Assert<RequiredField<PaymentHold, "id">>,
  Assert<Equal<Parameters<Admin["eshop"]["payment"]["void"]>[0], VoidPaymentParams>>,
  Assert<Equal<Awaited<ReturnType<Admin["eshop"]["payment"]["void"]>>, Payment>>,
  Assert<Equal<keyof VoidPaymentParams, "store_id" | "payment_id" | "expected_updated_at" | "reason">>,
  Assert<Equal<Parameters<Admin["eshop"]["payment"]["record"]>[0], RecordPaymentsParams>>,
  Assert<Equal<Awaited<ReturnType<Admin["eshop"]["payment"]["record"]>>, RecordedPayments>>,
  Assert<Equal<RecordedPayments, { payments: Payment[]; fiscal_receipts: FiscalReceipt[] }>>,
  Assert<Equal<keyof RecordPaymentsParams, "store_id" | "order_id" | "fiscal_device_id" | "payments">>,
  Assert<Equal<RecordPaymentsParams["fiscal_device_id"], string | null>>,
  Assert<RequiredField<RecordPaymentsParams, "fiscal_device_id">>,
  Assert<Equal<RecordPaymentPart, { id: string; payment_option_id: string; money: Money; method: RecordedMethod; reference: string | null }>>,
  Assert<Equal<Parameters<Admin["eshop"]["payment"]["allocateRefund"]>[0], AllocatePaymentRefundParams>>,
  Assert<Equal<keyof AllocatePaymentRefundParams, "store_id" | "payment_id" | "refund_id" | "expected_updated_at" | "application">>,
  Assert<Equal<AllocatePaymentRefundParams["application"], RefundApplication>>,
  Assert<Missing<AllocatePaymentRefundParams, "allocations">>,
  Assert<Missing<Admin["eshop"]["payment"], "createManual" | "recordCollection" | "voidCollection" | "cancel">>,
  Assert<RequiredField<CreatePaymentRefundParams, "notify_customer">>,
  Assert<Equal<CreatePaymentRefundParams["notify_customer"], boolean>>,
  Assert<
    Equal<
      Parameters<Admin["eshop"]["payment"]["recordRefundReceipt"]>[0],
      RecordRefundReceiptParams
    >
  >,
  Assert<
    Equal<
      keyof RecordRefundReceiptParams,
      | "store_id"
      | "payment_id"
      | "refund_id"
      | "expected_updated_at"
      | "receipt"
    >
  >,
  Assert<Equal<keyof RefundReceiptInput, "type" | "reference">>,
  Assert<Equal<RefundReceiptInput["type"], "sent" | "returned">>,
  Assert<Equal<RefundReceiptInput, { type: "sent"; reference: string; method: RecordedRefundMethod } | { type: "returned"; reference: string }>>,
  Assert<
    Equal<
      keyof ResolvePaymentHoldParams,
      "store_id" | "payment_id" | "expected_updated_at" | "hold_id" | "note"
    >
  >,
  Assert<RequiredField<VoidPaymentParams, "expected_updated_at">>,
  Assert<
    Equal<
      Awaited<ReturnType<Admin["eshop"]["order"]["getFinancialSummary"]>>,
      OrderFinancialSummary
    >
  >,
  Assert<
    Equal<
      Parameters<Admin["eshop"]["order"]["findFinancialSummaries"]>[0],
      FindOrderFinancialSummariesParams
    >
  >,
  Assert<Equal<keyof FindOrderFinancialSummariesParams, "store_id" | "order_ids">>,
  Assert<Equal<FindOrderFinancialSummariesParams["order_ids"], string[]>>,
  Assert<
    Equal<
      Awaited<ReturnType<Admin["eshop"]["order"]["findFinancialSummaries"]>>,
      OrderFinancialSummaryOfOrder[]
    >
  >,
  Assert<Equal<keyof OrderFinancialSummaryOfOrder, "order_id" | "summary">>,
  Assert<Equal<OrderFinancialSummaryOfOrder["summary"], OrderFinancialSummary>>,
  Assert<
    Equal<
      OrderFinancialConcern["type"],
      | "payment_hold"
      | "payment_unknown"
      | "refund_unknown"
      | "open_dispute"
      | "excess_collection"
    >
  >,
];
