import type { BillingPeriod, OrderAccessRevocation } from "./commerce";
import type { EpochMilliseconds } from "./time";
import type { OrderItemStatus } from "./index";
import type { OrderLineItemOrigin } from "./orderLineItem";
import type { LineMoneySnapshot } from "./orderMoney";
import type { UnitSpan } from "./orderContract";

export type SubscriptionPurchaseLimitPeriodPolicy =
  | { type: "subscription_period" }
  | { type: "calendar_month"; timezone: string };

export type PurchaseLimitRestoration =
  | { type: "cancellation_only" }
  | { type: "cancellation_and_accepted_return" };

export interface PurchaseLimitDefinition {
  id: string;
  variant_ids: string[];
  period: SubscriptionPurchaseLimitPeriodPolicy;
  max_quantity: number;
  restoration: PurchaseLimitRestoration;
}

export interface PurchaseAccessVariantSnapshot {
  source_product_id: string;
  source_variant_id: string;
}

export interface PurchaseAccessCatalog {
  market_id: string;
  catalog_id: string;
}

export interface PurchaseAccessTerms {
  variants: PurchaseAccessVariantSnapshot[];
  catalogs: PurchaseAccessCatalog[];
  limits: PurchaseLimitDefinition[];
  tax_category_id: string | null;
}

export interface OrderSubscriptionEntitlementOrigin {
  order_subscription_line_item_id: string;
  entitlement_id: string;
}

export interface OrderPurchaseAccessItem {
  id: string;
  origin: OrderSubscriptionEntitlementOrigin;
  revocation: OrderAccessRevocation | null;
  status: OrderItemStatus;
  money: LineMoneySnapshot;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface PurchaseAccessGrantRef {
  order_id: string;
  order_purchase_access_line_item_id: string;
}

export type CartProductPurchase =
  | { type: "catalog" }
  | { type: "existing_purchase_access"; grant: PurchaseAccessGrantRef }
  | { type: "same_cart_purchase_access"; cart_subscription_line_item_id: string; entitlement_id: string };

export interface PreviewCartAccessProductParams {
  store_id: string;
  id: string;
  line_item_id: string;
  variant_id: string;
  quantity: number;
  purchase: Exclude<CartProductPurchase, { type: "catalog" }>;
  locale?: string;
}

export interface CartAccessProductPreview {
  cart_id: string;
  store_id: string;
  customer_id: string;
  market_id: string;
  sales_channel_id: string;
  company: import("./cart").CartCompanyContext | null;
  line_item_id: string;
  quantity: number;
  pricing_quantity: number;
  purchase: Exclude<CartProductPurchase, { type: "catalog" }>;
  product: import("./storefront").StorefrontProduct;
  variant: import("./storefront").StorefrontProductVariant;
  price: import("./commerce").AppliedPriceSnapshot;
}

export interface PurchaseAccessGoodsQuote {
  subscription_id: string | null;
  source_entitlement_id: string;
  starts_at: EpochMilliseconds;
  ends_at: EpochMilliseconds | null;
  catalog_id: string;
  limits: PurchaseAccessLimitQuote[];
}

export interface PurchaseAccessLimitQuote {
  limit_id: string;
  period: BillingPeriod;
  period_policy: SubscriptionPurchaseLimitPeriodPolicy;
  restoration: PurchaseLimitRestoration;
  max_quantity: number;
  effective_max_quantity: number;
  counted_quantity: number;
  order_quantity: number;
  remaining_quantity: number;
  remaining_after_order: number;
  fits: boolean;
}

export type OrderProductLineItemOrigin = OrderLineItemOrigin
  | { type: "purchase_access"; grant: PurchaseAccessGrantRef; limits: OrderPurchaseLimitUsage[] };

export interface OrderPurchaseLimitUsage {
  limit_id: string;
  subscription_purchase_limit_period_id: string;
  return_restorations: PurchaseLimitReturnRestoration[];
}

export interface PurchaseLimitReturnRestoration {
  return_id: string;
  return_line_item_id: string;
  request_id: string;
  units: UnitSpan[];
}

export interface SubscriptionPurchaseLimitPeriod {
  id: string;
  store_id: string;
  subscription_id: string;
  source_entitlement_id: string;
  limit_id: string;
  period: BillingPeriod;
  counted_quantity: number;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface FindSubscriptionPurchaseAccessParams {
  store_id: string;
  id: string;
  market_id: string;
  sales_channel_id: string;
  company_id?: string;
  company_location_id?: string;
  variant_ids?: string[];
  limit?: number;
  cursor?: string;
}

export interface SubscriptionPurchaseAccessPage {
  subscription_id: string;
  market_id: string;
  sales_channel_id: string;
  as_of: EpochMilliseconds;
  grants: SubscriptionPurchaseAccessGrant[];
  cursor: string | null;
}

export interface SubscriptionPurchaseAccessGrant {
  grant: PurchaseAccessGrantRef;
  source_entitlement_id: string;
  starts_at: EpochMilliseconds;
  ends_at: EpochMilliseconds | null;
  variants: PurchaseAccessVariantSnapshot[];
  catalog_id: string;
  limits: PurchaseAccessLimitAvailability[];
}

export interface PurchaseAccessLimitAvailability {
  rule: PurchaseLimitDefinition;
  period: BillingPeriod;
  subscription_purchase_limit_period_id: string | null;
  counted_quantity: number;
  remaining_quantity: number;
}

export interface FindPurchaseLimitUsageParams {
  store_id: string;
  id: string;
  counter_id: string;
  limit?: number;
  cursor?: string;
}

export interface PurchaseLimitUsagePage {
  counter: SubscriptionPurchaseLimitPeriod;
  as_of: EpochMilliseconds;
  contributions: PurchaseLimitOrderContribution[];
  cursor: string | null;
}

export interface PurchaseLimitOrderContribution {
  order_id: string;
  order_number: string;
  order_product_line_item_id: string;
  grant: PurchaseAccessGrantRef;
  accepted_at: EpochMilliseconds;
  original_quantity: number;
  cancelled_units: UnitSpan[];
  return_restorations: PurchaseLimitReturnRestoration[];
  counted_quantity: number;
}
