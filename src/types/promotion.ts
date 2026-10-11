import type { EpochMilliseconds } from "./time";
import type { Money, SortDirection } from "./common";

export interface PromotionProductVariantRef {
  product_id: string;
  variant_id: string;
}

export type PromotionTarget =
  | { type: "products"; product_ids: string[] }
  | { type: "product_variants"; variants: PromotionProductVariantRef[] }
  | { type: "booking_services"; booking_service_ids: string[] }
  | { type: "customer_group_offerings"; customer_group_offering_ids: string[] }
  | { type: "customer_groups"; customer_group_ids: string[] }
  | { type: "catalogs"; catalog_ids: string[] }
  | { type: "categories"; category_ids: string[] }
  | { type: "all_eligible_items" };

export interface PromotionBuyRequirement {
  target: PromotionTarget;
  quantity: number;
}

export interface PromotionGetDiscount {
  target: PromotionTarget;
  quantity: number;
  basis_points: number;
}

export type PromotionEffect =
  | { type: "item_percentage"; id: string; target: PromotionTarget; basis_points: number }
  | { type: "item_fixed"; id: string; target: PromotionTarget; money: Money }
  | { type: "order_percentage"; id: string; basis_points: number }
  | { type: "order_fixed"; id: string; money: Money }
  | { type: "delivery_percentage"; id: string; basis_points: number }
  | { type: "delivery_fixed"; id: string; money: Money }
  | { type: "buy_x_get_y"; id: string; buy: PromotionBuyRequirement; get: PromotionGetDiscount };

export type PromotionCondition =
  | { type: "customer"; ids: string[] }
  | { type: "customer_group"; ids: string[] }
  | { type: "customer_group_offering"; ids: string[] }
  | { type: "company"; ids: string[] }
  | { type: "company_location"; ids: string[] }
  | { type: "market"; ids: string[] }
  | { type: "sales_channel"; ids: string[] }
  | { type: "minimum_order_amount"; money: Money };

export type PromotionSchedule =
  | { type: "always" }
  | { type: "scheduled"; starts_at: EpochMilliseconds; ends_at: EpochMilliseconds | null };

export type PromotionActivation = { type: "automatic" } | { type: "code" };

export type PromotionStacking = { type: "combinable" } | { type: "exclusive" };

export type PromotionStatus =
  | { type: "draft" }
  | { type: "active" }
  | { type: "archived" }
  | { type: "deleting" };

export type PromotionEditableStatus = Exclude<PromotionStatus, { type: "deleting" }>;

export interface Promotion {
  id: string;
  store_id: string;
  key: string;
  activation: PromotionActivation;
  conditions: PromotionCondition[];
  effects: PromotionEffect[];
  stacking: PromotionStacking;
  priority: number;
  max_uses: number | null;
  uses: number;
  max_uses_per_customer: number | null;
  schedule: PromotionSchedule;
  status: PromotionStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type PromotionCodeStatus =
  | { type: "active" }
  | { type: "archived" }
  | { type: "deleting" };

export type PromotionCodeEditableStatus = Exclude<PromotionCodeStatus, { type: "deleting" }>;

export interface PromotionCode {
  id: string;
  store_id: string;
  promotion_id: string;
  code: string;
  max_uses: number | null;
  uses: number;
  status: PromotionCodeStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CreatePromotionParams {
  store_id: string;
  id: string;
  key: string;
  activation: PromotionActivation;
  conditions: PromotionCondition[];
  effects: PromotionEffect[];
  stacking: PromotionStacking;
  priority: number;
  max_uses: number | null;
  max_uses_per_customer: number | null;
  schedule: PromotionSchedule;
  status: PromotionEditableStatus;
}

export interface UpdatePromotionParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key: string;
  activation: PromotionActivation;
  conditions: PromotionCondition[];
  effects: PromotionEffect[];
  stacking: PromotionStacking;
  priority: number;
  max_uses: number | null;
  max_uses_per_customer: number | null;
  schedule: PromotionSchedule;
  status: PromotionEditableStatus;
}

export interface GetPromotionParams {
  store_id: string;
  id: string;
}

export interface GetPromotionByKeyParams {
  store_id: string;
  key: string;
}

export interface FindPromotionsParams {
  store_id: string;
  key?: string;
  status?: PromotionStatus["type"];
  limit?: number;
  cursor?: string | null;
}

export interface DeletePromotionParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface CreatePromotionCodeParams {
  store_id: string;
  id: string;
  promotion_id: string;
  code: string;
  max_uses: number | null;
  status: PromotionCodeEditableStatus;
}

export interface UpdatePromotionCodeParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  code: string;
  max_uses: number | null;
  status: PromotionCodeEditableStatus;
}

export interface GetPromotionCodeParams {
  store_id: string;
  id: string;
}

export interface GetPromotionCodeByCodeParams {
  store_id: string;
  code: string;
}

export interface FindPromotionCodesParams {
  store_id: string;
  promotion_id?: string;
  code?: string;
  status?: PromotionCodeStatus["type"];
  limit?: number;
  cursor?: string | null;
}

export interface DeletePromotionCodeParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}
