import type { EpochMilliseconds } from "./time";
import type {
  AccountActor,
  Actor,
  Currency,
  PostalAddress,
  SortDirection,
  TaxMode,
  TaxRate,
  UnitSpan,
} from "./common";
import type { PaymentTerms } from "./company";
import type { InventoryTracking } from "./inventory";
import type { BackorderPolicy } from "./product";
import type { ShippingDeliveryEstimate } from "./shipping";
import type { SubscriptionPurchaseOccurrence } from "./subscription";

export type RenewalRecoveryStatus = "recovering" | "exhausted" | "resolved";

export interface RenewalRecovery {
  first_failure_at: EpochMilliseconds;
  retries_started: number;
  status: RenewalRecoveryStatus;
}

export type OrderSource =
  | { type: "cart"; cart_id: string; placed_by: Actor }
  | {
      type: "renewal";
      order_subscription_line_item_id: string;
      recovery: RenewalRecovery | null;
    };

export interface OrderContact {
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
}

export interface OrderTaxRegistration {
  country: string;
  region: string | null;
  identifier: string;
}

export type OrderBuyer =
  | { type: "personal" }
  | {
      type: "company";
      company_id: string;
      company_location_id: string;
      purchase_order_number: string | null;
      tax_registrations: OrderTaxRegistration[];
    };

export type OnAccountApproval =
  | { type: "branch_terms" }
  | { type: "account"; actor: AccountActor; reason: string };

export type OrderCollection =
  | { type: "free" }
  | { type: "payment_option"; payment_option_id: string }
  | { type: "subscription" }
  | {
      type: "on_account";
      payment_option_id: string;
      terms: PaymentTerms;
      due_at: EpochMilliseconds;
      approval: OnAccountApproval;
    };

export type OrderCancellationReason =
  | "rejected"
  | "contact_cancelled"
  | "payment_failed"
  | "expired"
  | "refunded"
  | "other";

export type OrderLineItemStatus =
  | { type: "pending"; expires_at: EpochMilliseconds }
  | { type: "confirmed" }
  | { type: "cancelled"; reason: OrderCancellationReason };

export type OrderLineItemOrigin =
  | { type: "direct" }
  | { type: "subscription"; order_subscription_line_item_id: string; entitlement_id: string };

export interface OrderAccessRevocation {
  actor: AccountActor;
  effective_at: EpochMilliseconds;
  reason: string;
}

export interface OrderVariantOption {
  key: string;
  value: string;
}

export interface OrderInventoryRequirementSnapshot {
  inventory_item_id: string;
  inventory_item_key: string;
  quantity: number;
  weight_grams: number | null;
  tracking: InventoryTracking;
  sku: string | null;
}

export type OrderDigitalContent =
  | { type: "accepted_assets"; asset_ids: string[] }
  | { type: "current_bundle" };

export type OrderProductFulfillmentSnapshot =
  | { type: "none" }
  | {
      type: "physical";
      inventory_requirements: OrderInventoryRequirementSnapshot[];
      backorder: BackorderPolicy;
    }
  | {
      type: "digital";
      content: OrderDigitalContent;
      revocation: OrderAccessRevocation | null;
    };

export type OrderLinePrice =
  | { type: "catalog"; price_id: string; catalog_id: string }
  | {
      type: "purchase_access";
      price_id: string;
      catalog_id: string;
      subscription_id: string | null;
    }
  | { type: "manual"; catalog_id: string; actor: AccountActor; reason: string }
  | { type: "offer" }
  | { type: "subscription_allocation" };

export interface OrderProductSnapshot {
  product_key: string;
  variant_sku: string | null;
  options: OrderVariantOption[];
  price: OrderLinePrice;
  fulfillment: OrderProductFulfillmentSnapshot;
}

export interface LineDiscount {
  promotion_id: string;
  effect_id: string;
  amount: number;
}

export type TaxLineCalculation =
  | { type: "percentage"; rate: TaxRate; compound: boolean }
  | { type: "fixed_per_unit"; unit_amount: number }
  | { type: "fixed_per_assessment"; amount: number };

export interface TaxLine {
  component_id: string;
  title: string;
  calculation: TaxLineCalculation;
  amount: number;
}

export type LineTaxTreatment =
  | { type: "rates"; lines: TaxLine[] }
  | { type: "not_collecting"; reason: string }
  | { type: "not_taxable"; reason: string }
  | { type: "zero_rated"; reason: string }
  | { type: "exempt"; reason: string };

export type LineTax =
  | { type: "own"; tax_category_id: string; rule_id: string; treatment: LineTaxTreatment }
  | { type: "group_share"; tax_group_id: string; treatment: LineTaxTreatment };

export interface LineMoney {
  unit_price: number;
  discounts: LineDiscount[];
  tax: LineTax;
}

export type TaxPlace =
  | { type: "delivery"; delivery_group_id: string }
  | { type: "billing" };

export interface ProductMoneyRun {
  span: UnitSpan;
  taxed_at: TaxPlace;
  money: LineMoney;
}

export interface OrderProductLineItem {
  id: string;
  origin: OrderLineItemOrigin;
  product_id: string;
  variant_id: string;
  quantity: number;
  cancelled_units: UnitSpan[];
  form_submission_id: string | null;
  snapshot: OrderProductSnapshot;
  status: OrderLineItemStatus;
  money_runs: ProductMoneyRun[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface OrderTimeRange {
  from: EpochMilliseconds;
  to: EpochMilliseconds;
}

export interface OrderBookingSnapshot {
  service_key: string;
  resource_key: string;
  timezone: string;
  price: OrderLinePrice;
}

export type OrderBookingAttendance = "upcoming" | "attended" | "no_show";

export interface OrderBookingLineItem {
  id: string;
  booking_offering_id: string;
  booking_service_id: string;
  booking_resource_id: string;
  interval: OrderTimeRange;
  capacity_intervals: OrderTimeRange[];
  capacity_units: number;
  form_submission_id: string | null;
  snapshot: OrderBookingSnapshot;
  status: OrderLineItemStatus;
  attendance: OrderBookingAttendance;
  money: LineMoney;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface OrderTaxGroup {
  id: string;
  tax_category_id: string;
  rule_id: string;
  quantity: number;
}

export interface OrderSubscriptionLineItem {
  id: string;
  subscription_id: string;
  revision_id: string;
  occurrence: SubscriptionPurchaseOccurrence;
  revocation: OrderAccessRevocation | null;
  status: OrderLineItemStatus;
  tax_groups: OrderTaxGroup[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface OrderRentalUseLineItem {
  id: string;
  rental_id: string;
  origin: OrderLineItemOrigin;
  snapshot: OrderProductSnapshot;
  quantity: number;
  status: OrderLineItemStatus;
  money: LineMoney;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface OrderPurchaseAccessLineItem {
  id: string;
  order_subscription_line_item_id: string;
  entitlement_id: string;
  revocation: OrderAccessRevocation | null;
  status: OrderLineItemStatus;
  money: LineMoney;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type OrderLineItem =
  | ({ type: "product" } & OrderProductLineItem)
  | ({ type: "booking" } & OrderBookingLineItem)
  | ({ type: "subscription_plan" } & OrderSubscriptionLineItem)
  | ({ type: "rental_use" } & OrderRentalUseLineItem)
  | ({ type: "purchase_access" } & OrderPurchaseAccessLineItem);

export type OrderLineItemType = OrderLineItem["type"];

export type OrderDeliveryDestination =
  | { type: "delivery"; address: PostalAddress }
  | { type: "pickup"; store_location_id: string; address: PostalAddress };

export type DeliveryPricing =
  | { type: "rate"; rate_id: string }
  | { type: "plan_terms"; delivery_terms_id: string };

export type FulfillmentTiming =
  | { type: "asap" }
  | { type: "window"; from: EpochMilliseconds; to: EpochMilliseconds };

export interface OrderDeliveryGroup {
  id: string;
  destination: OrderDeliveryDestination;
  shipping_method_id: string;
  shipping_profile_id: string;
  pricing: DeliveryPricing;
  timing: FulfillmentTiming;
  delivery_estimate: ShippingDeliveryEstimate | null;
  rental_ids: string[];
  money: LineMoney;
}

export interface OrderPromotionCode {
  promotion_code_id: string;
  code: string;
}

export interface OrderPromotion {
  promotion_id: string;
  promotion_key: string;
  code: OrderPromotionCode | null;
}

export type OrderStatus = "pending" | "confirmed" | "partially_cancelled" | "cancelled";

export interface MoneyTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

export interface OrderLineTotals extends MoneyTotals {
  line_item_id: string;
}

export interface OrderDeliveryTotals extends MoneyTotals {
  delivery_group_id: string;
}

export interface OrderTotals {
  subtotal: number;
  delivery: number;
  discount: number;
  tax: number;
  total: number;
  line_items: OrderLineTotals[];
  delivery_groups: OrderDeliveryTotals[];
}

export interface Order {
  id: string;
  number: string;
  store_id: string;
  source: OrderSource;
  customer_id: string;
  contact: OrderContact;
  buyer: OrderBuyer;
  market_id: string;
  sales_channel_id: string;
  tax_mode: TaxMode;
  collection: OrderCollection;
  line_items: OrderLineItem[];
  delivery_groups: OrderDeliveryGroup[];
  currency: Currency;
  promotions: OrderPromotion[];
  billing_address: PostalAddress | null;
  language: string;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
  status: OrderStatus;
  totals: OrderTotals;
}

export interface OrderBookingItem {
  store_id: string;
  order_id: string;
  order_number: string;
  customer_id: string;
  contact: OrderContact;
  line: OrderBookingLineItem;
}

export type OrderSourceFilter = "cart" | "renewal";

export type OrderItemStatusFilter = "pending" | "confirmed" | "cancelled";

export type OrderBookingStatusFilter = "pending" | "confirmed" | "completed" | "no_show" | "cancelled";

export interface FindOrdersParams {
  store_id: string;
  customer_id?: string;
  company_id?: string;
  company_location_id?: string;
  subscription_id?: string;
  statuses?: OrderStatus[];
  sources?: OrderSourceFilter[];
  product_statuses?: OrderItemStatusFilter[];
  booking_statuses?: OrderBookingStatusFilter[];
  product_ids?: string[];
  booking_service_ids?: string[];
  booking_resource_ids?: string[];
  from?: EpochMilliseconds;
  to?: EpochMilliseconds;
  query?: string;
  sort_field?: "number" | "created_at" | "updated_at" | "status" | "price";
  sort_direction?: SortDirection;
  created_at_from?: EpochMilliseconds;
  created_at_to?: EpochMilliseconds;
  updated_at_from?: EpochMilliseconds;
  limit?: number;
  cursor?: string | null;
}

export interface GetOrderParams {
  store_id: string;
  id: string;
}

export interface FindOrderBookingItemsParams {
  store_id: string;
  customer_id?: string;
  booking_service_ids?: string[];
  booking_resource_ids?: string[];
  statuses?: OrderBookingStatusFilter[];
  from?: EpochMilliseconds;
  to?: EpochMilliseconds;
  query?: string;
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface RevokeOrderAccessParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  line_item_id: string;
  effective_at: EpochMilliseconds;
  reason: string;
}

export interface CancelOrderBookingItemParams {
  store_id: string;
  order_id: string;
  line_item_id: string;
  credit_id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface CancelOrderProductItemParams {
  store_id: string;
  order_id: string;
  line_item_id: string;
  credit_id: string;
  expected_updated_at: EpochMilliseconds;
  units: UnitSpan[];
}

export interface CancelOrderParams {
  store_id: string;
  order_id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface MarkOrderBookingItemParams {
  store_id: string;
  order_id: string;
  line_item_id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface ResendOrderReceiptParams {
  store_id: string;
  order_id: string;
  id: string;
}

export interface GetOrderFinancialSummaryParams {
  store_id: string;
  id: string;
}

export type OrderFinancialConcern =
  | { type: "payment_hold"; payment_id: string }
  | { type: "payment_unknown"; payment_id: string }
  | { type: "refund_unknown"; payment_id: string; refund_id: string }
  | { type: "open_dispute"; payment_id: string; dispute_id: string }
  | { type: "excess_collection" };

export interface OrderFinancialSummary {
  currency: Currency;
  total: number;
  active_credit: number;
  due: number;
  paid: number;
  refunded: number;
  refund_pending: number;
  disputed: number;
  net_paid: number;
  outstanding: number;
  excess: number;
  concerns: OrderFinancialConcern[];
}

export interface GetOrderPaymentParams {
  store_id: string;
  order_id: string;
  payment_id: string;
}

export interface FindOrderPaymentsParams {
  store_id: string;
  order_id: string;
}

export type StorefrontFindOrdersParams = Omit<FindOrdersParams, "store_id" | "customer_id">;

export interface StorefrontGetOrderParams {
  id: string;
}

export interface StorefrontCancelOrderBookingItemParams {
  order_id: string;
  line_item_id: string;
  credit_id: string;
  expected_updated_at: EpochMilliseconds;
}

export type StorefrontCancelOrderProductItemParams = Omit<CancelOrderProductItemParams, "store_id">;

export interface StorefrontOrderPaymentParams {
  order_id: string;
  payment_id: string;
}

export interface StorefrontFindOrderPaymentsParams {
  order_id: string;
}

export function orderLineItemsOfType<T extends OrderLineItemType>(
  order: Pick<Order, "line_items"> | null,
  type: T,
): Extract<OrderLineItem, { type: T }>[] {
  return (order?.line_items ?? []).filter(
    (item): item is Extract<OrderLineItem, { type: T }> => item.type === type,
  );
}

export function orderProductItems(order: Pick<Order, "line_items"> | null) {
  return orderLineItemsOfType(order, "product");
}

export function orderBookingItems(order: Pick<Order, "line_items"> | null) {
  return orderLineItemsOfType(order, "booking");
}

export function orderSubscriptionPlanItems(order: Pick<Order, "line_items"> | null) {
  return orderLineItemsOfType(order, "subscription_plan");
}

export function orderRentalUseItems(order: Pick<Order, "line_items"> | null) {
  return orderLineItemsOfType(order, "rental_use");
}

export function orderPurchaseAccessItems(order: Pick<Order, "line_items"> | null) {
  return orderLineItemsOfType(order, "purchase_access");
}
