import type { Block } from "./index";
import type { StorefrontPrice } from "./commerce";
import type { EpochMilliseconds } from "./time";
import type { CatalogReadOptions } from "./catalog";
import type { CatalogPriceFilter } from "./api";
import type { CustomerGroupPlanBenefitType } from "./customerGroupPlanBenefit";

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

export type CustomerGroupCommitmentEndAction =
  | { type: "renew" }
  | { type: "renew_once" }
  | { type: "continue_without_term" }
  | { type: "stop" };

export interface CustomerGroupCommitment {
  occurrences: number;
  end_action: CustomerGroupCommitmentEndAction;
}

export type CustomerGroupPlanTerm =
  | { type: "permanent" }
  | {
      type: "recurring";
      cadence: RecurringCadence;
      recovery_policy: RenewalRecoveryPolicy;
      commitment: CustomerGroupCommitment | null;
    };

export type CustomerGroupProductQuantity =
  | { type: "per_period"; quantity: number }
  | { type: "per_delivery"; quantity: number };

export type CustomerGroupDeliverySchedule =
  | { type: "none" }
  | { type: "once"; offset_days: number; window_days: number }
  | {
      type: "repeating";
      cadence: RecurringCadence;
      offset_days: number;
      window_days: number;
    };

export type CustomerGroupDigitalContent =
  | { type: "accepted_assets" }
  | { type: "current_bundle" };

export type CustomerGroupPlanStatus =
  | { type: "draft" }
  | { type: "active" }
  | { type: "closed" }
  | { type: "archived" };

export interface CustomerGroupPlan {
  id: string;
  store_id: string;
  customer_group_id: string;
  key: string;
  name_block_id: string;
  blocks: Block[];
  term: CustomerGroupPlanTerm;
  membership_allocation_weight: number;
  membership_tax_category_id: string | null;
  status: CustomerGroupPlanStatus;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CreateCustomerGroupPlanParams {
  store_id?: string;
  customer_group_id: string;
  key: string;
  name_block_id: string;
  blocks: Block[];
  term: CustomerGroupPlanTerm;
  membership_allocation_weight: number;
  membership_tax_category_id: string | null;
  status: CustomerGroupPlanStatus;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
}

export interface UpdateCustomerGroupPlanParams
  extends Omit<CreateCustomerGroupPlanParams, "customer_group_id" | "key"> {
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface GetCustomerGroupPlanParams {
  store_id?: string;
  id: string;
}

export interface FindCustomerGroupPlansParams {
  store_id?: string;
  customer_group_id?: string;
  limit?: number;
  cursor?: string;
  key?: string;
  status?: CustomerGroupPlanStatus;
  query?: string;
  sort_field?: "key" | "created_at" | "status";
  sort_direction?: "asc" | "desc";
  created_at_from?: EpochMilliseconds;
  created_at_to?: EpochMilliseconds;
}

export interface StorefrontCustomerGroupPlanBenefit {
  id: string;
  type: CustomerGroupPlanBenefitType;
}

export interface StorefrontCustomerGroupPlan {
  id: string;
  customer_group_id: string;
  key: string;
  name_block_id: string;
  blocks: Block[];
  term: CustomerGroupPlanTerm;
  benefits: StorefrontCustomerGroupPlanBenefit[];
  price: StorefrontPrice | null;
  purchase_allowed: boolean;
}

export interface FindStorefrontCustomerGroupPlansParams extends CatalogReadOptions {
  customer_group_id?: string;
  limit?: number;
  cursor?: string;
  query?: string;
  price_filter?: CatalogPriceFilter;
  sort_field?: "key" | "created_at" | "price";
  sort_direction?: "asc" | "desc";
  created_at_from?: EpochMilliseconds;
  created_at_to?: EpochMilliseconds;
}

export interface GetStorefrontCustomerGroupPlanParams extends CatalogReadOptions {
  identifier: string;
  customer_group_id?: string;
}
