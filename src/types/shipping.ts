import type { BusinessDays, EpochMilliseconds } from "./time";
import type { Block } from "./block";
import type { Schedule, SortDirection } from "./common";
import type { DocumentItem } from "./invoice";

export interface ShippingProfile {
  id: string;
  tenant_id: string;
  key: string;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type ShippingMethodType =
  | { type: "delivery" }
  | { type: "pickup"; tenant_location_id: string };

export type ShippingRateCondition =
  | { type: "sales_channel"; sales_channel_ids: string[] }
  | { type: "package"; package_ids: string[] }
  | { type: "package_offering"; package_offering_ids: string[] }
  | { type: "company"; company_ids: string[] }
  | { type: "company_location"; company_location_ids: string[] }
  | { type: "minimum_subtotal"; amount: number }
  | { type: "maximum_subtotal"; amount: number }
  | { type: "minimum_weight_grams"; grams: number }
  | { type: "maximum_weight_grams"; grams: number };

export interface ShippingWeightTier {
  up_to_grams: number | null;
  amount: number;
}

export type ShippingFreeAbove = { type: "never" } | { type: "above"; amount: number };

export type ShippingRatePricing =
  | { type: "flat"; amount: number; free_above_subtotal: ShippingFreeAbove }
  | { type: "weight_tiered"; tiers: ShippingWeightTier[]; free_above_subtotal: ShippingFreeAbove };

export interface ShippingDeliveryEstimate {
  min: BusinessDays;
  max: BusinessDays;
}

export interface OrderDeliveryEstimate {
  min: BusinessDays;
  max: BusinessDays;
}

export interface ShippingRate {
  id: string;
  zone_id: string;
  shipping_profile_id: string;
  conditions: ShippingRateCondition[];
  pricing: ShippingRatePricing;
  delivery_estimate: ShippingDeliveryEstimate | null;
  schedule: Schedule;
}

export type ShippingTax = { type: "category"; tax_category_id: string } | { type: "follow_goods" };

export type ShippingMethodStatus = { type: "active" } | { type: "archived" };

export interface ShippingMethod {
  id: string;
  tenant_id: string;
  key: string;
  blocks: Block[];
  type: ShippingMethodType;
  tax: ShippingTax;
  document_item: DocumentItem;
  rates: ShippingRate[];
  status: ShippingMethodStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface FindShippingProfilesParams {
  tenant_id: string;
  key?: string;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface CreateShippingProfileParams {
  tenant_id: string;
  id: string;
  key: string;
}

export interface UpdateShippingProfileParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key: string;
}

export interface DeleteShippingProfileParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindShippingMethodsParams {
  tenant_id: string;
  key?: string;
  status?: ShippingMethodStatus["type"];
  type?: ShippingMethodType["type"];
  tenant_location_id?: string;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface CreateShippingMethodParams {
  tenant_id: string;
  id: string;
  key: string;
  blocks: Block[];
  type: ShippingMethodType;
  tax: ShippingTax;
  document_item: DocumentItem;
  rates: ShippingRate[];
  status: ShippingMethodStatus;
}

export interface UpdateShippingMethodParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key?: string;
  blocks?: Block[];
  tax?: ShippingTax;
  document_item?: DocumentItem;
  rates?: ShippingRate[];
  status?: ShippingMethodStatus;
}

export interface DeleteShippingMethodParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}
