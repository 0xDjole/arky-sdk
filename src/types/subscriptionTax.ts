import type { EpochMilliseconds } from "./time";
import type { AssessedTaxSnapshot, TaxLine } from "./orderMoney";
import type { UnitSpan } from "./orderContract";

export interface SubscriptionPlanTaxPolicy {
  id: string;
  market_zone_id: string;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
  type: SubscriptionPlanTaxPolicyType;
}

export type SubscriptionPlanTaxPolicyType =
  | { type: "per_entitlement" }
  | { type: "grouped"; groups: SubscriptionTaxGroup[] };

export interface SubscriptionTaxGroup {
  id: string;
  entitlement_ids: string[];
  tax_category_id: string;
  context_entitlement_id: string;
  quantity: SubscriptionTaxGroupQuantity;
}

export type SubscriptionTaxGroupQuantity =
  | { type: "package" }
  | { type: "entitlement"; entitlement_id: string };

export interface OrderSubscriptionTaxPolicy {
  id: string;
  order_subscription_line_item_id: string;
  tax_date: EpochMilliseconds;
  selection: SubscriptionPlanTaxPolicySelection;
}

export type SubscriptionPlanTaxPolicySelection =
  | { type: "default_per_entitlement"; market_zone_id: string }
  | { type: "configured"; source_plan_updated_at: EpochMilliseconds; policy: SubscriptionPlanTaxPolicy };

export interface OrderSubscriptionTaxGroup {
  id: string;
  order_subscription_tax_policy_id: string;
  source_group_id: string;
  members: OrderSubscriptionTaxGroupMember[];
  price_basis: number;
  tax_quantity: number;
  assessment: AssessedTaxSnapshot;
  tax_lines: TaxLine[];
}

export type OrderSubscriptionTaxGroupMember =
  | { type: "product"; line_item_id: string; units: UnitSpan[] }
  | { type: "digital_product"; line_item_id: string }
  | { type: "rental_use"; line_item_id: string }
  | { type: "purchase_access"; line_item_id: string };

export interface SubscriptionTaxPolicyQuote {
  id: string;
  tax_date: EpochMilliseconds;
  selection: SubscriptionPlanTaxPolicySelection;
}

export interface SubscriptionTaxGroupQuote {
  id: string;
  policy_id: string;
  source_group_id: string;
  entitlement_ids: string[];
  price_basis: number;
  tax_quantity: number;
  assessment: AssessedTaxSnapshot;
  tax_lines: TaxLine[];
}
