import type { EpochMilliseconds } from "./time";
import type { Currency, SortDirection, TaxMode } from "./common";

export type StoreStatus = { type: "active" } | { type: "deleting" };

export interface Store {
  id: string;
  name: string;
  owner_account_id: string;
  timezone: string;
  languages: string[];
  status: StoreStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type StoreBillingStatus =
  | { type: "trialing" }
  | { type: "active" }
  | { type: "past_due" }
  | { type: "unpaid" }
  | { type: "cancellation_scheduled" }
  | { type: "cancelled" };

export type BillingProvider = {
  type: "stripe";
  customer_id: string;
  subscription_id: string;
};

export type StoreSubscriptionPlan =
  | { type: "none" }
  | { type: "granted"; plan_id: string }
  | {
      type: "billed";
      plan_id: string;
      status: StoreBillingStatus;
      paid_until: EpochMilliseconds;
      provider: BillingProvider;
    };

export interface StoreSubscription {
  id: string;
  store_id: string;
  plan: StoreSubscriptionPlan;
  trial_used: boolean;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type StoreSubscriptionPaymentAction =
  | { type: "none" }
  | {
      type: "stripe_embedded_checkout";
      publishable_key: string;
      client_secret: string;
      expires_at: EpochMilliseconds;
    };

export interface StoreSubscriptionSelection extends StoreSubscription {
  payment_action: StoreSubscriptionPaymentAction;
}

export type FeatureType =
  | "collections"
  | "entries"
  | "booking_services"
  | "products"
  | "booking_resources"
  | "customer_groups"
  | "media"
  | "members"
  | "categories"
  | "email_templates"
  | "forms"
  | "webhooks"
  | "support_flows"
  | "broadcasts";

export interface StoreUsage {
  id: string;
  store_id: string;
  feature: FeatureType;
  count: number;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type StoreUsageAllowance =
  | { type: "limited"; limit: number }
  | { type: "unlimited" }
  | { type: "no_plan" };

export interface StoreUsageItem {
  feature: FeatureType;
  count: number;
  allowance: StoreUsageAllowance;
}

export interface StoreUsageSummary {
  store_id: string;
  items: StoreUsageItem[];
}

export interface StorePlanFeature {
  limit: number | null;
}

export type StorePlanInterval = "lifetime" | "month" | "year";

export interface StorePlan {
  id: string;
  provider_price_id: string | null;
  name: string;
  tier: number;
  amount: number;
  currency: Currency;
  interval: StorePlanInterval;
  interval_count: number;
  trial_days: number | null;
  features: Partial<Record<FeatureType, StorePlanFeature>>;
}

export interface CreateStoreMarketInput {
  key: string;
  currency: Currency;
  tax_mode: TaxMode;
}

export interface CreateStoreSalesChannelInput {
  key: string;
}

export interface CreateStoreParams {
  id: string;
  name: string;
  timezone: string;
  languages: string[];
  market: CreateStoreMarketInput;
  sales_channel: CreateStoreSalesChannelInput;
}

export interface UpdateStoreParams {
  id: string;
  expected_updated_at: EpochMilliseconds;
  name?: string;
  timezone?: string;
  languages?: string[];
}

export interface GetStoreParams {
  id: string;
}

export interface FindStoresParams {
  query?: string;
  sort_field?: "name";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface RequestStoreDeletionParams {
  id: string;
  expected_updated_at: EpochMilliseconds;
  confirmation: string;
}

export interface GetStoreSubscriptionParams {
  store_id: string;
}

export interface SelectStorePlanParams {
  store_id: string;
  plan_id: string;
  return_url: string;
}

export interface CreateStorePortalSessionParams {
  store_id: string;
  return_url: string;
}

export interface EndStoreGrantParams {
  store_id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindStoreUsageParams {
  store_id: string;
}

export interface StorePortalSession {
  portal_url: string;
}
