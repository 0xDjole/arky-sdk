import type { Money } from "./index";
import type { EpochMilliseconds } from "./time";

export type TaxCategoryEditableStatus =
  | { type: "active" }
  | { type: "archived" };
export type TaxCategoryStatus =
  TaxCategoryEditableStatus | { type: "deleting" };

export interface TaxCategory {
  id: string;
  store_id: string;
  key: string;
  name: string;
  status: TaxCategoryStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CreateTaxCategoryParams {
  store_id?: string;
  key: string;
  name: string;
  status: TaxCategoryEditableStatus;
}

export interface UpdateTaxCategoryParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  name: string;
  status: TaxCategoryEditableStatus;
}

export interface GetTaxCategoryParams {
  store_id?: string;
  id: string;
}

export interface FindTaxCategoriesParams {
  store_id?: string;
  key?: string;
  status?: TaxCategoryStatus["type"];
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
  limit?: number;
  cursor?: string;
}

export interface GetTaxCategoryByKeyParams {
  store_id?: string;
  key: string;
}

export interface DeleteTaxCategoryParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface TaxRate {
  numerator: number;
  denominator: number;
}

export type TaxCalculation =
  | { type: "percentage"; rate: TaxRate; compound: boolean }
  | { type: "fixed_per_unit"; unit_amount: Money }
  | { type: "fixed_per_assessment"; amount: Money };

export interface TaxComponent {
  id: string;
  title: string;
  code: string | null;
  calculation: TaxCalculation;
}

export type TaxTreatment =
  | { type: "not_collecting"; reason_code: string }
  | { type: "not_taxable"; reason_code: string }
  | { type: "rates"; components: TaxComponent[] }
  | { type: "zero_rated"; reason_code: string | null }
  | { type: "exempt"; reason_code: string | null };

export type TaxRuleEditableStatus = { type: "active" } | { type: "archived" };
export type TaxRuleStatus = TaxRuleEditableStatus | { type: "deleting" };

export interface TaxRule {
  id: string;
  store_id: string;
  market_zone_id: string;
  tax_category_id: string | null;
  treatment: TaxTreatment;
  status: TaxRuleStatus;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CreateTaxRuleParams {
  store_id?: string;
  market_zone_id: string;
  tax_category_id: string | null;
  treatment: TaxTreatment;
  status: TaxRuleEditableStatus;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
}

export interface UpdateTaxRuleParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  treatment: TaxTreatment;
  status: TaxRuleEditableStatus;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
}

export interface GetTaxRuleParams {
  store_id?: string;
  id: string;
}

export interface FindTaxRulesParams {
  store_id?:string;
  market_zone_id?:string;
  tax_category_id?:string;
  default_only?:boolean;
  status?: "active"|"archived"|"deleting";
  sort_field?: "created_at"|"updated_at";
  sort_direction?: "asc"|"desc";
  limit?:number;
  cursor?:string;
}

export interface DeleteTaxRuleParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}
