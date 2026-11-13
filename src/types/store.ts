import type { EpochMilliseconds } from "./time";
import type { Currency, PostalAddressInput, SortDirection, TaxMode } from "./common";
import type { CardDetails, PaymentRunsOn } from "./payment";
import type { CreateStoreAgreementInput, NetworkPlan } from "./network";

export type StoreType =
  | { type: "live"; account_id: string; network_id: string }
  | { type: "test"; store_id: string };

export type StoreStatus =
  | { type: "active" }
  | { type: "suspended"; reason: string; at: EpochMilliseconds }
  | { type: "wiping" }
  | { type: "deleting" };

export type StoreEmailSending = { type: "allowed" } | { type: "paused"; reason: string };

export interface Store {
  id: string;
  name: string;
  timezone: string;
  languages: string[];
  type: StoreType;
  status: StoreStatus;
  email_sending: StoreEmailSending;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type StoreSubscriptionPlanCleanup = { type: "done" } | { type: "pending"; network_provider_id: string };

export type StoreSubscriptionPlan =
  | { type: "granted"; plan_id: string; cleanup: StoreSubscriptionPlanCleanup }
  | {
      type: "trialing";
      plan_id: string;
      trial_ends_at: EpochMilliseconds;
      network_provider_id: string;
      stripe_customer_id: string;
      stripe_payment_method_id: string;
      card: CardDetails;
    }
  | {
      type: "active";
      plan_id: string;
      paid_until: EpochMilliseconds;
      network_provider_id: string;
      stripe_customer_id: string;
      stripe_payment_method_id: string;
      card: CardDetails;
    }
  | {
      type: "past_due";
      plan_id: string;
      paid_until: EpochMilliseconds;
      network_provider_id: string;
      stripe_customer_id: string;
      stripe_payment_method_id: string;
      card: CardDetails;
    }
  | {
      type: "cancellation_scheduled";
      plan_id: string;
      paid_until: EpochMilliseconds;
      network_provider_id: string;
      stripe_customer_id: string;
      stripe_payment_method_id: string;
      card: CardDetails;
    }
  | {
      type: "unpaid";
      plan_id: string;
      network_provider_id: string;
      stripe_customer_id: string;
      stripe_payment_method_id: string;
      card: CardDetails;
    }
  | { type: "cancelled"; plan_id: string; cleanup: StoreSubscriptionPlanCleanup };

export interface StoreSubscription {
  id: string;
  store_id: string;
  plan: StoreSubscriptionPlan;
  trial_used: boolean;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type StoreSubscriptionPayment =
  | { type: "none" }
  | { type: "stripe"; payment_intent_id: string; publishable_key: string; client_secret: string; runs_on: PaymentRunsOn };

export interface StoreCardSetup {
  network_provider_id: string;
  setup_intent_id: string;
  publishable_key: string;
  client_secret: string;
  runs_on: PaymentRunsOn;
}

export type FeatureType =
  | "collections"
  | "entries"
  | "booking_services"
  | "products"
  | "booking_resources"
  | "packages"
  | "media"
  | "members"
  | "categories"
  | "email_templates"
  | "forms"
  | "webhooks"
  | "support_flows"
  | "broadcasts"
  | "test_stores"
  | "store_locations"
  | "staff_calendars";

export type StoreUsageAllowance =
  | { type: "limited"; limit: number }
  | { type: "unlimited" };

export interface StoreUsageItem {
  feature: FeatureType;
  count: number;
  allowance: StoreUsageAllowance;
}

export interface StoreUsageSummary {
  store_id: string;
  items: StoreUsageItem[];
}

export type StorePlanStatus =
  | { type: "granted" }
  | { type: "trialing"; trial_ends_at: EpochMilliseconds }
  | { type: "active"; paid_until: EpochMilliseconds }
  | { type: "past_due"; paid_until: EpochMilliseconds }
  | { type: "cancellation_scheduled"; paid_until: EpochMilliseconds }
  | { type: "unpaid" }
  | { type: "cancelled" };

export interface StorePlanSummary {
  store_id: string;
  plan: NetworkPlan;
  status: StorePlanStatus;
}

export interface StoreCardSetupReference {
  network_provider_id: string;
  setup_intent_id: string;
}

export type CreateStorePlan =
  | { type: "free"; plan_id: string }
  | { type: "card"; plan_id: string; network_provider_id: string; setup_intent_id: string }
  | { type: "grant"; plan_id: string };

export type CreateStoreType =
  | { type: "live"; network_id: string; plan: CreateStorePlan }
  | { type: "test"; store_id: string };

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
  type: CreateStoreType;
  name: string;
  timezone: string;
  languages: string[];
  market: CreateStoreMarketInput;
  sales_channel: CreateStoreSalesChannelInput;
  location_address: PostalAddressInput;
  agreement?: CreateStoreAgreementInput;
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

export interface PauseStoreEmailSendingParams {
  store_id: string;
  expected_updated_at: EpochMilliseconds;
  reason: string;
}

export interface AllowStoreEmailSendingParams {
  store_id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface SuspendStoreParams {
  store_id: string;
  expected_updated_at: EpochMilliseconds;
  reason: string;
}

export interface ResumeStoreParams {
  store_id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface RequestStoreDeletionParams {
  id: string;
  expected_updated_at: EpochMilliseconds;
  confirmation: string;
}

export interface GetStoreSubscriptionParams {
  store_id: string;
}

export interface ChangeStorePlanParams {
  store_id: string;
  plan_id: string;
  expected_updated_at: EpochMilliseconds;
  card?: StoreCardSetupReference | null;
}

export interface EndStoreGrantParams extends ChangeStorePlanParams {}
export interface GrantStorePlanParams {
  store_id: string;
  plan_id: string;
  expected_updated_at: EpochMilliseconds;
}
export interface SetStoreSubscriptionCardParams {
  store_id: string;
  network_provider_id: string;
  setup_intent_id: string;
  expected_updated_at: EpochMilliseconds;
}
export interface CancelStoreSubscriptionParams {
  store_id: string;
  expected_updated_at: EpochMilliseconds;
}
export interface CreateStoreCardSetupParams { network_id: string; id: string }
export interface FindTestStoresParams { store_id: string; limit?: number; cursor?: string | null }
export interface WipeStoreParams extends RequestStoreDeletionParams {}

export interface GetStoreUsageParams {
  store_id: string;
}

export interface GetStoreAgreementParams {
  store_id: string;
}

export interface GetStorePlanParams {
  store_id: string;
}
