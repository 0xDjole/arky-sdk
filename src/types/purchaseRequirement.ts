import type { EpochMilliseconds } from "./time";
import type { Subscription, SubscriptionSelf } from "./subscription";

export type PurchaseRequirementUnit =
  | { type: "count" }
  | { type: "millilitres" };

export type PurchaseRequirementPeriod = {
  type: "calendar_month";
  timezone: string;
};

export interface PurchaseRequirementVariant {
  source_product_id: string;
  source_variant_id: string;
  contribution_per_unit: number;
  recipe_digest: string;
}

export interface PurchaseRequirement {
  unit: PurchaseRequirementUnit;
  minimum_quantity: number;
  period: PurchaseRequirementPeriod;
  qualifying_variants: PurchaseRequirementVariant[];
}

export type PurchaseRequirementVariantInput = Omit<PurchaseRequirementVariant, "recipe_digest">;

export interface PurchaseRequirementInput extends Omit<PurchaseRequirement, "qualifying_variants"> {
  qualifying_variants: PurchaseRequirementVariantInput[];
}

export interface GetSubscriptionPurchaseRequirementParams {
  store_id: string;
  id: string;
  at?: EpochMilliseconds;
}

export interface SubscriptionPurchaseRequirement {
  subscription: Subscription;
  company_id: string;
  company_location_id: string;
  starts_at: EpochMilliseconds;
  ends_at: EpochMilliseconds | null;
  evaluated_at: EpochMilliseconds;
  initial: PurchaseRequirement | null;
  current: PurchaseRequirement | null;
}

export interface PurchaseRequirementChangeRequest {
  request_id: string;
  subscription_id: string;
  expected_updated_at: EpochMilliseconds;
  effective_at: EpochMilliseconds;
  previous: PurchaseRequirement | null;
  current: PurchaseRequirementInput | null;
}

export interface ChangePurchaseRequirementsParams {
  store_id: string;
  company_id: string;
  changes: PurchaseRequirementChangeRequest[];
}

export interface PurchaseRequirementChange {
  request_id: string;
  accepted_at: EpochMilliseconds;
  effective_at: EpochMilliseconds;
  current: PurchaseRequirement | null;
  subscription: SubscriptionSelf;
}
