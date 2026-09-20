import { createAdmin, createStorefront } from "arky-sdk";
import type { FindPaymentsParams, FindRefundsParams, FindPaymentDisputesParams, PaymentDispute, DisputeFinancialEffect } from "arky-sdk";

const payments: FindPaymentsParams = { order_id: "order", status: "unknown", sort_field: "updated_at", sort_direction: "asc", limit: 25 };
const refunds: FindRefundsParams = { order_id: "order", payment_id: "payment", status: "requested", sort_field: "created_at", sort_direction: "desc", cursor: "opaque" };
const disputes: FindPaymentDisputesParams = { payment_id: "payment", status: "warning_needs_response", sort_field: "updated_at", sort_direction: "asc", limit: 25, cursor: "opaque" };
const client = createAdmin({ baseUrl: "https://example.test", apiToken: "arky_api_fixture", storeId: "store", market: "market" });
void client.eshop.payment.find(payments);
void client.eshop.refund.find(refunds);
void client.eshop.dispute.find(disputes);
void client.eshop.order.findPayments({ ...payments, order_id: "order" });
void client.eshop.order.getPayment({ order_id: "order", payment_id: "payment" });
declare const storefront: ReturnType<typeof createStorefront>;
void storefront.eshop.order.findPayments({ order_id: "order", status: "unknown", limit: 25, cursor: "next" });
void storefront.eshop.order.getPayment({ order_id: "order", payment_id: "payment" });
// @ts-expect-error Exact observation requires both identities, never the removed singular route.
void storefront.eshop.order.getPayment({ id: "order" });
// @ts-expect-error Storefront scope comes from the session, not a caller Store override.
void storefront.eshop.order.findPayments({ order_id: "order", store_id: "foreign" });
// @ts-expect-error Payment status is a closed flat filter.
payments.status = { type: "unknown" };
// @ts-expect-error Refund discovery has no monetary ordering authority.
refunds.sort_field = "amount";
// @ts-expect-error A provider completion is not an extra Refund status.
refunds.status = "completed";
// @ts-expect-error Dispute status filters are flat, not response objects.
disputes.status = { type: "won" };
// @ts-expect-error Disputes do not invent a settlement lifecycle for search.
disputes.status = "settled";
// @ts-expect-error Monetary sorting is not part of dispute discovery.
disputes.sort_field = "money";

declare const dispute: PaymentDispute;
const paymentId: string = dispute.order_payment_id;
const captureId: string | null = dispute.order_payment_capture_id;
const effects: DisputeFinancialEffect[] = dispute.financial_effects;
void [paymentId, captureId, effects];
// @ts-expect-error The DTO uses its explicit financial owner, not a legacy Payment backlink.
dispute.payment_id;
