import type { AccountActor } from "./accountActor";
import type { Address, LineMoneySnapshot, Money, OrderItemStatus } from "./index";
import type { EpochMilliseconds } from "./time";

export interface DisplayTextSnapshot {
  text: string;
  locale: string | null;
}

export type PriceBilling =
  | { type: "one_time" }
  | { type: "recurring"; interval: "month" | "year"; interval_count: number };

export type AppliedPriceSource =
  | { type: "base"; price_id: string }
  | { type: "price_list"; price_id: string; price_list_id: string }
  | { type: "manual"; actor: AccountActor; reason: string };

export interface StorefrontPrice {
  unit_price: Money;
  compare_at: number | null;
  billing: PriceBilling;
  min_quantity: number;
  max_quantity: number | null;
  priced_at: EpochMilliseconds;
}

export interface AppliedPriceSnapshot {
  unit_price: Money;
  compare_at: number | null;
  billing: PriceBilling;
  min_quantity: number;
  max_quantity: number | null;
  source: AppliedPriceSource;
  priced_at: EpochMilliseconds;
}

export interface OrderAccessRevocation {
  command_id: string;
  actor: AccountActor;
  effective_at: EpochMilliseconds;
  reason: string;
}

/// Accepted plan terms are opaque to clients; the server owns their exact shape.
export interface CustomerGroupAcceptedTerms {
  plan: CustomerGroupPlanSnapshot;
  deliveries: CustomerGroupDeliveryTerms[];
  billing_address: Address | null;
}

export interface CustomerGroupPlanSnapshot {
  source_customer_group_id: string;
  source_customer_group_plan_id: string;
  key: string;
  name: DisplayTextSnapshot;
  price: AppliedPriceSnapshot;
}

export interface CustomerGroupDeliveryTerms {
  id: string;
  benefit_ids: string[];
  acceptance_digest: string;
}

export type OrderCustomerGroupTerms =
  | { type: "initial"; terms: CustomerGroupAcceptedTerms }
  | { type: "accepted_revision" };

export type CustomerGroupPurchaseOccurrence =
  | { type: "permanent"; starts_at: EpochMilliseconds }
  | { type: "period"; occurrence_index: number; period: BillingPeriod };

export interface BillingPeriod {
  from: EpochMilliseconds;
  to: EpochMilliseconds;
}

export interface OrderCustomerGroupPlanItem {
  id: string;
  customer_group_subscription_id: string;
  revision_id: string;
  terms: OrderCustomerGroupTerms;
  occurrence: CustomerGroupPurchaseOccurrence;
  revocation: OrderAccessRevocation | null;
  status: OrderItemStatus;
  money: LineMoneySnapshot;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}


export interface SubscriptionAudienceSnapshot {
  key: string;
  name: DisplayTextSnapshot;
}

export type PurchaseOrigin =
  | { type: "storefront"; customer_id: string; customer_session_id: string }
  | { type: "admin"; actor: AccountActor };

export interface PurchaseCustomerSnapshot {
  email: string | null;
  authentication:
    | { type: "visitor" }
    | { type: "email_authenticated"; authenticated_at: EpochMilliseconds }
    | null;
}

export interface CompanySnapshot {
  name: string;
  legal_name: string | null;
  registration_number: string | null;
  tax_number: string | null;
  contact_email: string | null;
}

export interface SalesChannelSnapshot {
  key: string;
  name: string;
}

export interface PurchaseQuoteContext {
  market_id: string;
  sales_channel_id: string;
  sales_channel_snapshot: SalesChannelSnapshot;
  customer_id: string | null;
  customer_snapshot: PurchaseCustomerSnapshot | null;
  company_id: string | null;
  company_location_id: string | null;
  company_snapshot: CompanySnapshot | null;
  origin: PurchaseOrigin;
}
