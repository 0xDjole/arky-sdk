import type {
  CompanySnapshot,
  OrderSubscriptionPlanItem,
  PurchaseCustomerSnapshot,
  PurchaseOrigin,
  SalesChannelSnapshot,
} from "./commerce";
import type {
  Address,
  Currency,
  OrderBookingItem,
  OrderDigitalItem,
  OrderItemStatus,
  OrderMoney,
  OrderProductItem,
} from "./index";
import type { EpochMilliseconds } from "./time";
import type { CheckoutCartVersion, ConvertedCartLine } from "./checkout";
import type { OrderLineItemOrigin } from "./orderLineItem";
import type { LineMoneySnapshot } from "./orderMoney";
import type { OrderProductSnapshot } from "./orderSnapshot";
import type {
  CheckoutPaymentAuthorization,
  CollectionPolicySnapshot,
  CompanyLocationSnapshot,
  MarketSnapshot,
  OrderDeliveryGroup,
  OrderInvoicePolicy,
  PaymentTermsSnapshot,
  PromotionRedemption,
  PurchaseOriginSnapshot,
  ReconciliationState,
  RenewalRecovery,
  SellerSnapshot,
} from "./orderContract";

export type OrderSource =
  | {
      type: "cart_acceptance";
      command_id: string;
      cart: CheckoutCartVersion;
      converted_lines: ConvertedCartLine[];
    }
  | { type: "direct"; request_id: string }
  | { type: "subscription"; order_subscription_line_item_id: string };

export type OrderSourceFilter = OrderSource["type"];

export interface OrderRentalUseItem {
  id: string;
  origin: OrderLineItemOrigin;
  snapshot: OrderProductSnapshot;
  quantity: number;
  status: OrderItemStatus;
  money: LineMoneySnapshot;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface OrderCompanyContext {
  company_id: string | null;
  company_location_id: string | null;
  company_snapshot: CompanySnapshot;
  company_location_snapshot: CompanyLocationSnapshot;
}

export type OrderLineItem =
  | { type: "product" } & OrderProductItem
  | { type: "booking" } & OrderBookingItem
  | { type: "digital_product" } & OrderDigitalItem
  | { type: "subscription_plan" } & OrderSubscriptionPlanItem
  | { type: "rental_use" } & OrderRentalUseItem;

export type OrderStatus = {
  type: "pending" | "confirmed" | "partially_cancelled" | "cancelled";
};

export interface Order {
  id: string;
  number: string;
  store_id: string;
  source: OrderSource;
  customer_id: string;
  customer_snapshot: PurchaseCustomerSnapshot;
  company: OrderCompanyContext | null;
  payment_terms: PaymentTermsSnapshot | null;
  purchase_order_number: string | null;
  market_id: string | null;
  market_snapshot: MarketSnapshot;
  sales_channel_id: string | null;
  sales_channel_snapshot: SalesChannelSnapshot;
  origin: PurchaseOriginSnapshot;
  status: OrderStatus;
  line_items: OrderLineItem[];
  money: OrderMoney;
  delivery_groups: OrderDeliveryGroup[];
  billing_address: Address | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
  accepted_at: EpochMilliseconds;
  seller: SellerSnapshot;
  invoice_policy: OrderInvoicePolicy;
  renewal_recovery: RenewalRecovery | null;
  reconciliation: ReconciliationState;
  collection_policy: CollectionPolicySnapshot;
  promotion_redemptions: PromotionRedemption[];
  payment_authorization: CheckoutPaymentAuthorization;
}


export function orderProductItems(order: Pick<Order, "line_items"> | null): OrderProductItem[] {
  return (order?.line_items ?? [])
    .filter((item): item is OrderLineItem & { type: "product" } => item.type === "product")
    .map(({ type: _type, ...item }) => item);
}

export function orderBookingItems(order: Pick<Order, "line_items"> | null): OrderBookingItem[] {
  return (order?.line_items ?? [])
    .filter((item): item is OrderLineItem & { type: "booking" } => item.type === "booking")
    .map(({ type: _type, ...item }) => item);
}

export function orderDigitalItems(order: Pick<Order, "line_items"> | null): OrderDigitalItem[] {
  return (order?.line_items ?? [])
    .filter(
      (item): item is OrderLineItem & { type: "digital_product" } =>
        item.type === "digital_product",
    )
    .map(({ type: _type, ...item }) => item);
}

export function orderSubscriptionPlanItems(
  order: Pick<Order, "line_items"> | null,
): OrderSubscriptionPlanItem[] {
  return (order?.line_items ?? [])
    .filter(
      (item): item is OrderLineItem & { type: "subscription_plan" } =>
        item.type === "subscription_plan",
    )
    .map(({ type: _type, ...item }) => item);
}

export function orderRentalUseItems(
  order: Pick<Order, "line_items"> | null,
): OrderRentalUseItem[] {
  return (order?.line_items ?? [])
    .filter((item): item is OrderLineItem & { type: "rental_use" } => item.type === "rental_use")
    .map(({ type: _type, ...item }) => item);
}

export type OrderFinancialConcern =
  | { type: "unapplied_monri_evidence"; receipt_id: string }
  | { type: "monri_review"; receipt_id: string }
  | { type: "order_hold" }
  | { type: "payment_hold"; payment_id: string }
  | { type: "payment_evidence"; payment_id: string }
  | { type: "payment_projection"; payment_id: string }
  | { type: "invoice_payment_review"; receipt_id: string }
  | { type: "unattributed_invoice_payment_evidence"; receipt_id: string }
  | { type: "unapplied_invoice_payment_evidence"; receipt_id: string }
  | { type: "unapplied_capture_evidence"; receipt_id: string }
  | { type: "capture_review"; receipt_id: string }
  | { type: "dispute_review"; dispute_id: string }
  | { type: "unapplied_dispute_evidence"; dispute_id: string }
  | { type: "refund_review"; refund_id: string }
  | { type: "unapplied_refund_evidence"; receipt_id: string }
  | { type: "unattributed_refund_evidence"; receipt_id: string }
  | { type: "credit_refund_allocation"; order_credit_id: string; allocation_id: string }
  | { type: "principal_capacity_conflict" }
  | { type: "refund_reservations_exceed_excess" }
  | { type: "provider_refund_created_debt" }
  | { type: "invoice_reconciliation_required" };

export interface OrderFinancialSummary {
  currency: Currency;
  accepted: number;
  active_credit: number;
  obligation: number;
  captured: number;
  refunded: number;
  finalized_lost_principal: number;
  net_collections: number;
  outstanding: number;
  excess: number;
  capture_pending: number;
  refund_pending: number;
  dispute_encumbered: number;
  concerns: OrderFinancialConcern[];
}

export interface GetOrderFinancialSummaryParams {
  store_id?: string;
  id: string;
}
