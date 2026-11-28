import type { EpochMilliseconds } from "./time";
import type { AccountActor, Currency, Money, PostalAddressInput, ProviderEffectError, ProviderOperationClaim, SortDirection, TaxMode } from "./common";
import type { PaymentRunsOn } from "./payment";
import type { CreateTenantAgreementInput, NetworkPlan } from "./network";
import type { TenantInvoicing } from "./invoice";

export type TenantType =
  | { type: "live"; account_id: string; network_id: string }
  | { type: "test"; live_tenant_id: string };

export type TenantStatus =
  | { type: "active" }
  | { type: "suspended"; reason: string; at: EpochMilliseconds }
  | { type: "wiping" }
  | { type: "wiping_suspended"; reason: string; at: EpochMilliseconds }
  | { type: "deleting" };

export type TenantEmailSending = { type: "allowed" } | { type: "paused"; reason: string };

export interface Tenant {
  id: string;
  name: string;
  timezone: string;
  languages: string[];
  type: TenantType;
  status: TenantStatus;
  email_sending: TenantEmailSending;
  invoicing: TenantInvoicing;
  default_location_id: string;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface TenantRead extends Tenant {
  owner_email?: string;
}

export type TenantCancellationAccess =
  | { type: "trial"; trial_ends_at: EpochMilliseconds }
  | { type: "paid"; paid_until: EpochMilliseconds };

export type TenantPlanCard = {
  type: "stripe";
  network_provider_id: string;
  stripe_customer_id: string;
  stripe_payment_method_id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
};

export type TenantSubscriptionPlan =
  | { type: "granted"; plan_id: string }
  | { type: "trialing"; plan_id: string; trial_ends_at: EpochMilliseconds; card: TenantPlanCard }
  | { type: "active"; plan_id: string; paid_until: EpochMilliseconds; anchor: EpochMilliseconds; card: TenantPlanCard }
  | { type: "paid_lifetime"; plan_id: string; card: TenantPlanCard }
  | { type: "past_due"; plan_id: string; paid_until: EpochMilliseconds; card: TenantPlanCard }
  | { type: "trial_cancellation_scheduled"; plan_id: string; trial_ends_at: EpochMilliseconds; card: TenantPlanCard }
  | {
      type: "paid_cancellation_scheduled";
      plan_id: string;
      paid_until: EpochMilliseconds;
      anchor: EpochMilliseconds;
      card: TenantPlanCard;
    }
  | { type: "unpaid"; plan_id: string; card: TenantPlanCard }
  | { type: "cancelled"; plan_id: string };

export interface TenantSubscription {
  id: string;
  tenant_id: string;
  plan: TenantSubscriptionPlan;
  trial_used: boolean;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type TenantSubscriptionPayment =
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

export type TenantPlanChargePurpose =
  | { type: "renewal"; plan_id: string; starts_at: EpochMilliseconds; anchor: EpochMilliseconds; months: number }
  | { type: "new_period"; plan_id: string; months: number }
  | { type: "lifetime"; plan_id: string }
  | { type: "switch"; plan_id: string; months: number }
  | { type: "switch_lifetime"; plan_id: string };

export type TenantPlanStripeChargeStatus =
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

export type TenantPlanChargeType = {
  type: "stripe";
  network_provider_id: string;
  stripe_customer_id: string;
  stripe_payment_method_id: string;
  status: TenantPlanStripeChargeStatus;
};

export interface TenantPlanCharge {
  id: string;
  tenant_id: string;
  purpose: TenantPlanChargePurpose;
  money: Money;
  type: TenantPlanChargeType;
  waits_for_owner: boolean;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface ReportTenantPlanPaymentParams {
  tenant_id: string;
  payment_intent_id: string;
}

export interface FindTenantPlanChargesParams {
  tenant_id: string;
  limit?: number;
  cursor?: string | null;
}

export interface FindWaitingTenantPlanChargesParams {
  network_id: string;
  network_provider_id: string;
  limit?: number;
  cursor?: string | null;
}

export type TenantPlanChargeSettlement =
  | { type: "paid" }
  | { type: "not_paid" }
  | { type: "refunded"; stripe_refund_id: string };

export interface SettleTenantPlanChargeParams {
  id: string;
  tenant_id: string;
  expected_updated_at: EpochMilliseconds;
  outcome: TenantPlanChargeSettlement;
}

export interface TenantCardSetup {
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
  | "test_tenants"
  | "tenant_locations";

export type TenantUsageAllowance =
  | { type: "limited"; limit: number }
  | { type: "unlimited" };

export interface TenantUsageItem {
  feature: FeatureType;
  count: number;
  allowance: TenantUsageAllowance;
}

export interface TenantUsageSummary {
  tenant_id: string;
  items: TenantUsageItem[];
}

export type TenantPlanStatus =
  | { type: "granted" }
  | { type: "trialing"; trial_ends_at: EpochMilliseconds }
  | { type: "active"; paid_until: EpochMilliseconds }
  | { type: "paid_lifetime" }
  | { type: "past_due"; paid_until: EpochMilliseconds }
  | { type: "cancellation_scheduled"; access: TenantCancellationAccess }
  | { type: "unpaid" }
  | { type: "cancelled" };

export interface TenantPlanSummary {
  tenant_id: string;
  plan: NetworkPlan;
  status: TenantPlanStatus;
}

export interface TenantCardSetupReference {
  network_provider_id: string;
  setup_intent_id: string;
}

export type CreateTenantPlan =
  | { type: "free"; plan_id: string }
  | { type: "card"; plan_id: string; network_provider_id: string; setup_intent_id: string }
  | { type: "grant"; plan_id: string };

export type CreateTenantOwner =
  | { type: "caller" }
  | { type: "email"; email: string; language: string };

export type CreateTenantType =
  | { type: "live"; network_id: string; plan: CreateTenantPlan; owner: CreateTenantOwner }
  | { type: "test"; live_tenant_id: string };

export interface CreateTenantMarketInput {
  key: string;
  currency: Currency;
  tax_mode: TaxMode;
}

export interface CreateTenantSalesChannelInput {
  key: string;
}

export interface CreateTenantParams {
  id: string;
  type: CreateTenantType;
  name: string;
  timezone: string;
  languages: string[];
  market: CreateTenantMarketInput;
  sales_channel: CreateTenantSalesChannelInput;
  location_address: PostalAddressInput;
  agreement?: CreateTenantAgreementInput;
}

export interface UpdateTenantParams {
  id: string;
  expected_updated_at: EpochMilliseconds;
  name?: string;
  timezone?: string;
  languages?: string[];
}

export interface NameTenantDefaultLocationParams {
  id: string;
  tenant_location_id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface GetTenantParams {
  id: string;
}

export type TenantSearchType = "live" | "test";

export type TenantSearchStatus = "active" | "suspended" | "wiping" | "wiping_suspended" | "deleting";

export interface FindTenantsParams {
  query?: string;
  type?: TenantSearchType;
  status?: TenantSearchStatus;
  sort_field?: "name";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface PauseTenantEmailSendingParams {
  tenant_id: string;
  expected_updated_at: EpochMilliseconds;
  reason: string;
}

export interface AllowTenantEmailSendingParams {
  tenant_id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface SuspendTenantParams {
  tenant_id: string;
  expected_updated_at: EpochMilliseconds;
  reason: string;
}

export interface ResumeTenantParams {
  tenant_id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface RequestTenantDeletionParams {
  id: string;
  expected_updated_at: EpochMilliseconds;
  confirmation: string;
}

export interface GetTenantSubscriptionParams {
  tenant_id: string;
}

export interface ChangeTenantPlanParams {
  tenant_id: string;
  plan_id: string;
  expected_updated_at: EpochMilliseconds;
  card?: TenantCardSetupReference | null;
}

export interface EndTenantGrantParams extends ChangeTenantPlanParams {}
export interface GrantTenantPlanParams {
  tenant_id: string;
  plan_id: string;
  expected_updated_at: EpochMilliseconds;
}
export interface SetTenantSubscriptionCardParams {
  tenant_id: string;
  network_provider_id: string;
  setup_intent_id: string;
  expected_updated_at: EpochMilliseconds;
}
export interface CancelTenantSubscriptionParams {
  tenant_id: string;
  expected_updated_at: EpochMilliseconds;
}
export interface CreateTenantCardSetupParams { network_id: string; id: string; tenant_id: string }
export interface FindTestTenantsParams { tenant_id: string; limit?: number; cursor?: string | null }
export interface FindTestTenantsByLiveTenantsParams { live_tenant_ids: string[]; limit?: number; cursor?: string | null }
export interface WipeTenantParams extends RequestTenantDeletionParams {}

export interface GetTenantUsageParams {
  tenant_id: string;
}

export interface GetTenantAgreementParams {
  tenant_id: string;
}

export interface GetTenantPlanParams {
  tenant_id: string;
}
