import type { EpochMilliseconds } from "./time";
import type { Block } from "./block";
import type { Money, Schedule, SortDirection } from "./common";
import type { PackageScheduleInput } from "./package";

export type PromotionTarget =
  | { type: "products"; product_ids: string[] }
  | { type: "product_variants"; variant_ids: string[] }
  | { type: "booking_services"; booking_service_ids: string[] }
  | { type: "package_offerings"; package_offering_ids: string[] }
  | { type: "packages"; package_ids: string[] }
  | { type: "listed_in_packages"; package_ids: string[] }
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
  | { type: "item_fixed"; id: string; target: PromotionTarget; amounts: Money[]; scope: PromotionFixedScope }
  | { type: "order_percentage"; id: string; basis_points: number }
  | { type: "order_fixed"; id: string; amounts: Money[] }
  | { type: "delivery_percentage"; id: string; basis_points: number }
  | { type: "delivery_fixed"; id: string; amounts: Money[] }
  | { type: "buy_x_get_y"; id: string; buy: PromotionBuyRequirement; get: PromotionGetDiscount };

export type PromotionCondition =
  | { type: "signed_in" }
  | { type: "user"; user_ids: string[] }
  | { type: "package"; package_ids: string[] }
  | { type: "package_offering"; package_offering_ids: string[] }
  | { type: "company"; company_ids: string[] }
  | { type: "company_location"; company_location_ids: string[] }
  | { type: "market"; market_ids: string[] }
  | { type: "sales_channel"; sales_channel_ids: string[] }
  | { type: "minimum_subtotal"; amounts: Money[] }
  | { type: "item_quantity"; target: PromotionTarget; min_quantity: number; max_quantity: number | null };

export type PromotionFixedScope = { type: "per_unit" } | { type: "once_per_order" };

export type PromotionActivation = { type: "codes" } | { type: "automatic" };

export type PromotionLimit = { type: "unlimited" } | { type: "limited"; max_uses: number };

export type PromotionStacking = { type: "continue" } | { type: "stop_after" };

export type PromotionStatus =
  | { type: "draft" }
  | { type: "active" }
  | { type: "archived" }
  | { type: "deleting" };

export type PromotionEditableStatus = Exclude<PromotionStatus, { type: "deleting" }>;

export interface Promotion {
  id: string;
  tenant_id: string;
  key: string;
  blocks: Block[];
  activation: PromotionActivation;
  conditions: PromotionCondition[];
  effects: PromotionEffect[];
  stacking: PromotionStacking;
  priority: number;
  limit: PromotionLimit;
  uses: number;
  user_limit: PromotionLimit;
  schedule: Schedule;
  status: PromotionStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type PromotionWebhookPayload = Omit<Promotion, "uses">;

export interface StorefrontPromotion {
  id: string;
  key: string;
  blocks: Block[];
}

export interface GetStorefrontPromotionParams {
  id: string;
}

export type PromotionCodeStatus =
  | { type: "active" }
  | { type: "archived" }
  | { type: "deleting" };

export type PromotionCodeEditableStatus = Exclude<PromotionCodeStatus, { type: "deleting" }>;

export interface PromotionCode {
  id: string;
  tenant_id: string;
  promotion_id: string;
  code: string;
  limit: PromotionLimit;
  uses: number;
  status: PromotionCodeStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type PromotionCodeWebhookPayload = Omit<PromotionCode, "uses">;

export interface CreatePromotionParams {
  tenant_id: string;
  id: string;
  key: string;
  blocks: Block[];
  activation: PromotionActivation;
  conditions: PromotionCondition[];
  effects: PromotionEffect[];
  stacking: PromotionStacking;
  priority: number;
  limit: PromotionLimit;
  user_limit: PromotionLimit;
  schedule: PackageScheduleInput;
  status: PromotionEditableStatus;
}

export interface UpdatePromotionParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key: string;
  blocks: Block[];
  conditions: PromotionCondition[];
  effects: PromotionEffect[];
  stacking: PromotionStacking;
  priority: number;
  limit: PromotionLimit;
  user_limit: PromotionLimit;
  schedule: PackageScheduleInput;
  status: PromotionEditableStatus;
}

export interface GetPromotionParams {
  tenant_id: string;
  id: string;
}

export interface GetPromotionByKeyParams {
  tenant_id: string;
  key: string;
}

export interface FindPromotionsBySearchParams {
  tenant_id: string;
  ids?: never;
  key?: string;
  status?: PromotionStatus["type"];
  limit?: number;
  cursor?: string | null;
}

export interface FindPromotionsByIdsParams {
  tenant_id: string;
  ids: string[];
  key?: never;
  status?: never;
  limit?: never;
  cursor?: never;
}

export type FindPromotionsParams = FindPromotionsBySearchParams | FindPromotionsByIdsParams;

export interface DeletePromotionParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface CreatePromotionCodeParams {
  tenant_id: string;
  id: string;
  promotion_id: string;
  code: string;
  limit: PromotionLimit;
  status: PromotionCodeEditableStatus;
}

export interface UpdatePromotionCodeParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  code: string;
  limit: PromotionLimit;
  status: PromotionCodeEditableStatus;
}

export interface GetPromotionCodeParams {
  tenant_id: string;
  id: string;
}

export interface GetPromotionCodeByCodeParams {
  tenant_id: string;
  code: string;
}

export interface FindPromotionCodesBySearchParams {
  tenant_id: string;
  ids?: never;
  promotion_id?: string;
  code?: string;
  status?: PromotionCodeStatus["type"];
  limit?: number;
  cursor?: string | null;
}

export interface FindPromotionCodesByIdsParams {
  tenant_id: string;
  ids: string[];
  promotion_id?: never;
  code?: never;
  status?: never;
  limit?: never;
  cursor?: never;
}

export type FindPromotionCodesParams = FindPromotionCodesBySearchParams | FindPromotionCodesByIdsParams;

export interface DeletePromotionCodeParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}
