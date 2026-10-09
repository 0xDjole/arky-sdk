import { createAdmin, createStorefront } from "arky-sdk";
import type { FindPaymentsParams, OrderFinancialConcern, OrderFinancialSummary, Payment, PaymentStatusName, PaymentType, StripeDispute, StripeRefund, MonriRefund, RecordedRefund } from "arky-sdk";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type Admin = ReturnType<typeof createAdmin>;
type Storefront = ReturnType<typeof createStorefront>;

const store_id = "d2a64f1b-8c37-4e59-b0a1-6f3e9c7d2b84";
const payments: FindPaymentsParams = { store_id, order_id: "order", status: "unknown", type: "monri_card", on_hold: false, sort_field: "updated_at", sort_direction: "asc", limit: 25 };
const client = createAdmin({ baseUrl: "https://example.test", apiToken: "arky_api_fixture" });
void client.eshop.payment.find(payments);
void client.eshop.order.findPayments({ store_id, order_id: "order" });
void client.eshop.order.getPayment({ store_id, order_id: "order", payment_id: "payment" });
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
  Assert<Equal<keyof Parameters<Storefront["eshop"]["order"]["findPayments"]>[0], "order_id">>,
  Assert<Equal<keyof Parameters<Storefront["eshop"]["order"]["getPayment"]>[0], "order_id" | "payment_id">>,
  Assert<Equal<NonNullable<FindPaymentsParams["status"]>, PaymentStatusName>>,
  Assert<Equal<NonNullable<FindPaymentsParams["sort_field"]>, "created_at" | "updated_at">>,
  Assert<Equal<Extract<PaymentType, { type: "stripe_checkout" }>["refunds"], StripeRefund[]>>,
  Assert<Equal<Extract<PaymentType, { type: "stripe_checkout" }>["disputes"], StripeDispute[]>>,
  Assert<Equal<Extract<PaymentType, { type: "monri_card" }>["refunds"], MonriRefund[]>>,
  Assert<Equal<Extract<PaymentType, { type: "cash_on_delivery" }>["refunds"], RecordedRefund[]>>,
  Assert<Equal<Payment["holds"][number]["message"], string>>,
  Assert<Equal<Awaited<ReturnType<Admin["eshop"]["order"]["getFinancialSummary"]>>, OrderFinancialSummary>>,
  Assert<Equal<OrderFinancialConcern["type"], "payment_hold" | "payment_unknown" | "refund_unknown" | "open_dispute" | "excess_collection">>,
];
