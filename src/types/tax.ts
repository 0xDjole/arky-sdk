import type { EpochMilliseconds } from "./time";
import type { ZoneArea } from "./market";
import type { Money, Schedule, SortDirection, TaxRate } from "./common";

export type TaxCalculation =
  | { type: "percentage"; rate: TaxRate }
  | { type: "compound_percentage"; rate: TaxRate }
  | { type: "fixed_per_unit"; unit_amount: Money };

export interface TaxComponent {
  id: string;
  title: string;
  code: string | null;
  calculation: TaxCalculation;
}

export type TaxTreatment =
  | { type: "rates"; components: TaxComponent[] }
  | { type: "zero_rated"; reason: string }
  | { type: "exempt"; reason: string }
  | { type: "not_taxable"; reason: string }
  | { type: "not_collecting"; reason: string };

export interface TaxRule {
  id: string;
  areas: ZoneArea[];
  treatment: TaxTreatment;
  schedule: Schedule;
}

export interface TaxCategory {
  id: string;
  store_id: string;
  key: string;
  rules: TaxRule[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface FindTaxCategoriesParams {
  store_id: string;
  key?: string;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface CreateTaxCategoryParams {
  store_id: string;
  id: string;
  key: string;
  rules: TaxRule[];
}

export interface UpdateTaxCategoryParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key?: string;
  rules?: TaxRule[];
}

export interface DeleteTaxCategoryParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}
