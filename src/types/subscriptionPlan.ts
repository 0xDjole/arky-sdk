import type { Block } from "./index";
import type { StorefrontPrice } from "./commerce";
import type { EpochMilliseconds } from "./time";
import type { CatalogReadOptions } from "./catalog";
import type { CatalogPriceFilter } from "./api";
import type { SubscriptionPlanEntitlementType } from "./subscriptionPlanEntitlement";

export type BillingInterval = "day" | "week" | "month" | "year";

export interface RecurringCadence {
  interval: BillingInterval;
  interval_count: number;
}

export type RenewalExhaustionAction = { type: "pause" } | { type: "cancel" };

export type UnpaidRenewalDisposition =
  | { type: "retain_debt" }
  | { type: "cancel_unfulfilled" };

export interface RenewalRecoveryPolicy {
  retry_offsets_seconds: number[];
  recovery_window_seconds: number;
  on_exhaustion: RenewalExhaustionAction;
  unpaid_order: UnpaidRenewalDisposition;
}

export type SubscriptionCommitmentEndAction =
  | { type: "renew" }
  | { type: "renew_once" }
  | { type: "continue_without_term" }
  | { type: "stop" };

export interface SubscriptionCommitment {
  occurrences: number;
  end_action: SubscriptionCommitmentEndAction;
}

export type SubscriptionPlanTerm =
  | { type: "permanent" }
  | {
      type: "recurring";
      cadence: RecurringCadence;
      recovery_policy: RenewalRecoveryPolicy;
      commitment: SubscriptionCommitment | null;
    };

export type SubscriptionProductQuantity =
  | { type: "per_period"; quantity: number }
  | { type: "per_delivery"; quantity: number };

export type SubscriptionDeliverySchedule =
  | { type: "none" }
  | { type: "once"; offset_days: number; window_days: number }
  | {
      type: "repeating";
      cadence: RecurringCadence;
      offset_days: number;
      window_days: number;
    };

export type SubscriptionDigitalContent =
  | { type: "accepted_assets" }
  | { type: "current_bundle" };

export type SubscriptionPlanStatus =
  | { type: "draft" }
  | { type: "active" }
  | { type: "closed" }
  | { type: "archived" };

export interface SubscriptionPlan {
  id: string;
  store_id: string;
  subscription_offering_id: string;
  key: string;
  blocks: Block[];
  term: SubscriptionPlanTerm;
  status: SubscriptionPlanStatus;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CreateSubscriptionPlanParams {
  store_id?: string;
  subscription_offering_id: string;
  key: string;
  blocks: Block[];
  term: SubscriptionPlanTerm;
  status: SubscriptionPlanStatus;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
}

export interface UpdateSubscriptionPlanParams
  extends Omit<CreateSubscriptionPlanParams, "subscription_offering_id" | "key"> {
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface GetSubscriptionPlanParams {
  store_id?: string;
  id: string;
}

export interface FindSubscriptionPlansParams {
  store_id?: string;
  subscription_offering_id?: string;
  limit?: number;
  cursor?: string;
  key?: string;
  status?: SubscriptionPlanStatus;
  query?: string;
  sort_field?: "key" | "created_at" | "status";
  sort_direction?: "asc" | "desc";
  created_at_from?: EpochMilliseconds;
  created_at_to?: EpochMilliseconds;
}

export interface StorefrontSubscriptionPlanEntitlement {
  id: string;
  type: SubscriptionPlanEntitlementType;
}

export interface StorefrontSubscriptionPlan {
  id: string;
  subscription_offering_id: string;
  key: string;
  blocks: Block[];
  term: SubscriptionPlanTerm;
  entitlements: StorefrontSubscriptionPlanEntitlement[];
  price: StorefrontPrice | null;
  purchase_allowed: boolean;
}

export interface FindStorefrontSubscriptionPlansParams extends CatalogReadOptions {
  subscription_offering_id?: string;
  limit?: number;
  cursor?: string;
  query?: string;
  price_filter?: CatalogPriceFilter;
  sort_field?: "key" | "created_at" | "price";
  sort_direction?: "asc" | "desc";
  created_at_from?: EpochMilliseconds;
  created_at_to?: EpochMilliseconds;
}

export interface GetStorefrontSubscriptionPlanParams extends CatalogReadOptions {
  identifier: string;
  subscription_offering_id?: string;
}
