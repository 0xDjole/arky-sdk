import type { EpochMilliseconds } from "./time";
import type { AccountActor, Currency, Money, PostalAddressInput, ProviderEffectError, ProviderOperationClaim, SortDirection, TaxMode } from "./common";
import type { PaymentRunsOn } from "./payment";
import type { CreateStoreAgreementInput, NetworkPlan } from "./network";
import type { StoreInvoicing } from "./invoice";

export type StoreType =
  | { type: "live"; account_id: string; network_id: string }
  | { type: "test"; live_store_id: string };

export type StoreStatus =
  | { type: "active" }
  | { type: "suspended"; reason: string; at: EpochMilliseconds }
  | { type: "wiping" }
  | { type: "wiping_suspended"; reason: string; at: EpochMilliseconds }
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
  invoicing: StoreInvoicing;
  default_location_id: string;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface StoreRead extends Store {
  owner_email?: string;
}

export type StoreCancellationAccess =
  | { type: "trial"; trial_ends_at: EpochMilliseconds }
  | { type: "paid"; paid_until: EpochMilliseconds };

export type StorePlanCard = {
  type: "stripe";
  network_provider_id: string;
  stripe_customer_id: string;
  stripe_payment_method_id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
};

export type StoreSubscriptionPlan =
  | { type: "granted"; plan_id: string }
  | { type: "trialing"; plan_id: string; trial_ends_at: EpochMilliseconds; card: StorePlanCard }
  | { type: "active"; plan_id: string; paid_until: EpochMilliseconds; anchor: EpochMilliseconds; card: StorePlanCard }
  | { type: "paid_lifetime"; plan_id: string; card: StorePlanCard }
  | { type: "past_due"; plan_id: string; paid_until: EpochMilliseconds; card: StorePlanCard }
  | { type: "trial_cancellation_scheduled"; plan_id: string; trial_ends_at: EpochMilliseconds; card: StorePlanCard }
  | {
      type: "paid_cancellation_scheduled";
      plan_id: string;
      paid_until: EpochMilliseconds;
      anchor: EpochMilliseconds;
      card: StorePlanCard;
    }
  | { type: "unpaid"; plan_id: string; card: StorePlanCard }
  | { type: "cancelled"; plan_id: string };

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
  | {
      type: "stripe";
      payment_intent_id: string;
      publishable_key: string;
      client_secret: string;
      payment_method_id: string;
      runs_on: PaymentRunsOn;
    }
  | { type: "report"; payment_intent_id: string };

export type StorePlanChargePurpose =
  | { type: "renewal"; plan_id: string; starts_at: EpochMilliseconds; anchor: EpochMilliseconds; months: number }
  | { type: "new_period"; plan_id: string; months: number }
  | { type: "lifetime"; plan_id: string }
  | { type: "switch"; plan_id: string; months: number }
  | { type: "switch_lifetime"; plan_id: string };

export type StorePlanStripeChargeStatus =
  | { type: "pending" }
  | { type: "creating"; claim: ProviderOperationClaim }
  | {
      type: "confirming";
      stripe_payment_intent_id: string;
      attempt: number;
      retry_until: EpochMilliseconds;
      claim: ProviderOperationClaim;
    }
  | { type: "declined"; stripe_payment_intent_id: string; attempts: number; error: ProviderEffectError }
  | { type: "requires_action"; stripe_payment_intent_id: string; attempts: number }
  | { type: "action_reported"; stripe_payment_intent_id: string; attempts: number }
  | { type: "pay_unknown"; stripe_payment_intent_id: string; error: ProviderEffectError }
  | { type: "paid"; stripe_payment_intent_id: string }
  | { type: "lost"; error: ProviderEffectError }
  | { type: "refused"; error: ProviderEffectError }
  | { type: "cancel_requested"; stripe_payment_intent_id: string }
  | {
      type: "cancelling";
      stripe_payment_intent_id: string;
      retry_until: EpochMilliseconds;
      claim: ProviderOperationClaim;
    }
  | { type: "cancelled"; stripe_payment_intent_id: string }
  | { type: "cancel_unknown"; stripe_payment_intent_id: string; error: ProviderEffectError }
  | {
      type: "refunding";
      stripe_payment_intent_id: string;
      retry_until: EpochMilliseconds;
      claim: ProviderOperationClaim;
    }
  | { type: "refund_pending"; stripe_payment_intent_id: string; stripe_refund_id: string }
  | { type: "refunded"; stripe_payment_intent_id: string; stripe_refund_id: string }
  | { type: "refund_refused"; stripe_payment_intent_id: string; error: ProviderEffectError }
  | { type: "refund_unknown"; stripe_payment_intent_id: string; error: ProviderEffectError }
  | {
      type: "refund_failed";
      stripe_payment_intent_id: string;
      stripe_refund_id: string;
      error: ProviderEffectError;
    }
  | { type: "confirmed_paid"; stripe_payment_intent_id: string; by: AccountActor }
  | { type: "confirmed_refunded"; stripe_payment_intent_id: string; stripe_refund_id: string; by: AccountActor }
  | { type: "confirmed_not_paid"; stripe_payment_intent_id: string; by: AccountActor };

export type StorePlanChargeType = {
  type: "stripe";
  network_provider_id: string;
  stripe_customer_id: string;
  stripe_payment_method_id: string;
  status: StorePlanStripeChargeStatus;
};

export interface StorePlanCharge {
  id: string;
  store_id: string;
  purpose: StorePlanChargePurpose;
  money: Money;
  type: StorePlanChargeType;
  waits_for_owner: boolean;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface ReportStorePlanPaymentParams {
  store_id: string;
  payment_intent_id: string;
}

export interface FindStorePlanChargesParams {
  store_id: string;
  limit?: number;
  cursor?: string | null;
}

export interface FindWaitingStorePlanChargesParams {
  network_id: string;
  network_provider_id: string;
  limit?: number;
  cursor?: string | null;
}

export type StorePlanChargeSettlement =
  | { type: "paid" }
  | { type: "not_paid" }
  | { type: "refunded"; stripe_refund_id: string };

export interface SettleStorePlanChargeParams {
  id: string;
  store_id: string;
  expected_updated_at: EpochMilliseconds;
  outcome: StorePlanChargeSettlement;
}

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
  | "templates"
  | "forms"
  | "webhooks"
  | "support_flows"
  | "broadcasts"
  | "test_stores"
  | "store_locations";

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
  | { type: "paid_lifetime" }
  | { type: "past_due"; paid_until: EpochMilliseconds }
  | { type: "cancellation_scheduled"; access: StoreCancellationAccess }
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

export type CreateStoreOwner =
  | { type: "caller" }
  | { type: "email"; email: string; language: string };

export type CreateStoreType =
  | { type: "live"; network_id: string; plan: CreateStorePlan; owner: CreateStoreOwner }
  | { type: "test"; live_store_id: string };

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

export interface NameStoreDefaultLocationParams {
  id: string;
  store_location_id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface GetStoreParams {
  id: string;
}

export type StoreSearchType = "live" | "test";

export type StoreSearchStatus = "active" | "suspended" | "wiping" | "wiping_suspended" | "deleting";

export interface FindStoresParams {
  query?: string;
  type?: StoreSearchType;
  status?: StoreSearchStatus;
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
export interface CreateStoreCardSetupParams { network_id: string; id: string; store_id: string }
export interface FindTestStoresParams { store_id: string; limit?: number; cursor?: string | null }
export interface FindTestStoresByLiveStoresParams { live_store_ids: string[]; limit?: number; cursor?: string | null }
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
