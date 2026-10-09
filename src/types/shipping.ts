import type { EpochMilliseconds } from "./time";
import type { Block } from "./block";
import type { SortDirection } from "./common";

export interface ShippingProfile {
  id: string;
  store_id: string;
  key: string;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type ShippingMethodType =
  | { type: "delivery" }
  | { type: "pickup"; store_location_id: string };

export type ShippingRateCondition =
  | { type: "sales_channel"; ids: string[] }
  | { type: "customer_group"; ids: string[] }
  | { type: "company"; ids: string[] }
  | { type: "company_location"; ids: string[] }
  | { type: "minimum_subtotal"; amount: number }
  | { type: "maximum_subtotal"; amount: number }
  | { type: "minimum_weight_grams"; grams: number }
  | { type: "maximum_weight_grams"; grams: number };

export interface ShippingWeightTier {
  up_to_grams: number | null;
  amount: number;
}

export type ShippingRatePricing =
  | { type: "flat"; amount: number; free_above_subtotal: number | null }
  | { type: "weight_tiered"; tiers: ShippingWeightTier[]; free_above_subtotal: number | null };

export interface ShippingDeliveryEstimate {
  min_business_days: number;
  max_business_days: number;
}

export interface ShippingRate {
  id: string;
  zone_id: string;
  shipping_profile_id: string;
  conditions: ShippingRateCondition[];
  pricing: ShippingRatePricing;
  delivery_estimate: ShippingDeliveryEstimate | null;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
}

export type ShippingMethodStatus = { type: "active" } | { type: "archived" };

export interface ShippingMethod {
  id: string;
  store_id: string;
  key: string;
  blocks: Block[];
  type: ShippingMethodType;
  tax_category_id: string;
  rates: ShippingRate[];
  status: ShippingMethodStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface FindShippingProfilesParams {
  store_id: string;
  key?: string;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface CreateShippingProfileParams {
  store_id: string;
  id: string;
  key: string;
}

export interface UpdateShippingProfileParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key: string;
}

export interface DeleteShippingProfileParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindShippingMethodsParams {
  store_id: string;
  key?: string;
  status?: ShippingMethodStatus["type"];
  type?: ShippingMethodType["type"];
  store_location_id?: string;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface CreateShippingMethodParams {
  store_id: string;
  id: string;
  key: string;
  blocks: Block[];
  type: ShippingMethodType;
  tax_category_id: string;
  rates: ShippingRate[];
  status: ShippingMethodStatus;
}

export interface UpdateShippingMethodParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key?: string;
  blocks?: Block[];
  tax_category_id?: string;
  rates?: ShippingRate[];
  status?: ShippingMethodStatus;
}

export interface DeleteShippingMethodParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}
