import type { Block } from "./index";
import type { ShippingDeliveryEstimate } from "./quote";
import type { EpochMilliseconds } from "./time";

export type ShippingMethodType =
  | { type: "delivery" }
  | { type: "pickup"; store_location_id: string };

export type ShippingMethodEditableStatus =
  | { type: "active" }
  | { type: "archived" };
export type ShippingMethodStatus =
  ShippingMethodEditableStatus | { type: "deleting" };

export interface ShippingMethod {
  id: string;
  store_id: string;
  key: string;
  blocks: Block[];
  type: ShippingMethodType;
  tax_category_id: string | null;
  status: ShippingMethodStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CreateShippingMethodParams {
  store_id?: string;
  key: string;
  blocks: Block[];
  type: ShippingMethodType;
  tax_category_id: string | null;
  status: ShippingMethodEditableStatus;
}

export interface UpdateShippingMethodParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  blocks: Block[];
  type: ShippingMethodType;
  tax_category_id: string | null;
  status: ShippingMethodEditableStatus;
}

export interface GetShippingMethodParams {
  store_id?: string;
  id: string;
}

export interface FindShippingMethodsParams {
  store_id?:string;
  key?:string;
  location_id?:string;
  tax_category_id?:string;
  status?: "active"|"archived"|"deleting";
  sort_field?: "created_at"|"updated_at";
  sort_direction?: "asc"|"desc";
  limit?:number;
  cursor?:string;
}

export interface GetShippingMethodByKeyParams {
  store_id?:string;
  key:string;
}

export interface DeleteShippingMethodParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export type ShippingRateCondition =
  | { type: "sales_channel"; ids: string[] }
  | { type: "customer_group"; ids: string[] }
  | { type: "company"; ids: string[] }
  | { type: "company_location"; ids: string[] }
  | { type: "minimum_subtotal"; amount: number }
  | { type: "maximum_subtotal"; amount: number }
  | { type: "minimum_weight_grams"; grams: number }
  | { type: "maximum_weight_grams"; grams: number };

export interface ShippingRateWeightTier {
  up_to_grams: number | null;
  amount: number;
}


export type ShippingRatePricing =
  | { type: "flat"; amount: number; free_above_subtotal: number | null }
  | {
      type: "weight_tiered";
      tiers: ShippingRateWeightTier[];
      free_above_subtotal: number | null;
    };

export type ShippingRateEditableStatus =
  | { type: "active" }
  | { type: "archived" };
export type ShippingRateStatus =
  ShippingRateEditableStatus | { type: "deleting" };

export interface ShippingRate {
  id: string;
  store_id: string;
  market_zone_id: string;
  shipping_method_id: string;
  shipping_profile_id: string;
  conditions: ShippingRateCondition[];
  pricing: ShippingRatePricing;
  delivery_estimate: ShippingDeliveryEstimate | null;
  status: ShippingRateStatus;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CreateShippingRateParams {
  store_id?: string;
  market_zone_id: string;
  shipping_method_id: string;
  shipping_profile_id: string;
  conditions: ShippingRateCondition[];
  pricing: ShippingRatePricing;
  delivery_estimate: ShippingDeliveryEstimate | null;
  status: ShippingRateEditableStatus;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
}

export interface UpdateShippingRateParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  conditions: ShippingRateCondition[];
  pricing: ShippingRatePricing;
  delivery_estimate: ShippingDeliveryEstimate | null;
  status: ShippingRateEditableStatus;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
}

export interface GetShippingRateParams {
  store_id?: string;
  id: string;
}

export interface FindShippingRatesParams {
  store_id?:string;
  market_zone_id?:string;
  shipping_method_id?:string;
  shipping_profile_id?:string;
  status?: "active"|"archived"|"deleting";
  sort_field?: "created_at"|"updated_at";
  sort_direction?: "asc"|"desc";
  limit?:number;
  cursor?:string;
}

export interface DeleteShippingRateParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}
