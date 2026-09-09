import type { AccountActor } from "./accountActor";
import type { LineMoneySnapshot, Money, OrderItemStatus } from "./index";
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

export interface OrderAudienceItem {
  id: string;
  audience_id: string | null;
  membership_id: string | null;
  snapshot: {
    audience_key: string;
    audience_name: DisplayTextSnapshot;
    price: AppliedPriceSnapshot;
  };
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
