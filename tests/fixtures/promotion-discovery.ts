import type { createAdmin } from "arky-sdk/admin";
import type {
  CreatePromotionCodeParams,
  CreatePromotionParams,
  FindPromotionCodesParams,
  FindPromotionsParams,
  GetPromotionByKeyParams,
  GetPromotionCodeByCodeParams,
  PaginatedResponse,
  Promotion,
  PromotionCode,
  PromotionEditableStatus,
  PromotionEffect,
  PromotionSchedule,
  PromotionStatus,
  PromotionTarget,
} from "arky-sdk/types";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Eshop = ReturnType<typeof createAdmin>["eshop"];

export type PromotionContracts = [
  Assert<Equal<Parameters<Eshop["promotion"]["getByKey"]>[0], GetPromotionByKeyParams>>,
  Assert<Equal<Parameters<Eshop["promotionCode"]["getByCode"]>[0], GetPromotionCodeByCodeParams>>,
  Assert<Equal<Awaited<ReturnType<Eshop["promotion"]["find"]>>, PaginatedResponse<Promotion>>>,
  Assert<Equal<Awaited<ReturnType<Eshop["promotionCode"]["find"]>>, PaginatedResponse<PromotionCode>>>,
  Assert<Equal<Awaited<ReturnType<Eshop["promotion"]["delete"]>>, Promotion | undefined>>,
  Assert<Equal<Awaited<ReturnType<Eshop["promotionCode"]["delete"]>>, PromotionCode | undefined>>,
  Assert<Equal<NonNullable<FindPromotionsParams["status"]>, PromotionStatus["type"]>>,
  Assert<Equal<keyof FindPromotionCodesParams, "store_id" | "promotion_id" | "code" | "status" | "limit" | "cursor">>,
  Assert<RequiredField<CreatePromotionParams, "id">>,
  Assert<RequiredField<CreatePromotionCodeParams, "id">>,
  Assert<Equal<CreatePromotionParams["status"], PromotionEditableStatus>>,
  Assert<Equal<Extract<PromotionStatus, { type: "deleting" }>, Exclude<PromotionStatus, PromotionEditableStatus>>>,
  Assert<Equal<CreatePromotionParams["schedule"], PromotionSchedule>>,
  Assert<Missing<CreatePromotionParams, "starts_at" | "ends_at">>,
  Assert<Equal<PromotionSchedule["type"], "always" | "scheduled">>,
  Assert<Equal<PromotionTarget["type"], "products" | "product_variants" | "booking_services" | "subscription_offerings" | "subscription_plans" | "catalogs" | "categories" | "all_eligible_items">>,
  Assert<Equal<PromotionEffect["type"], "item_percentage" | "item_fixed" | "order_percentage" | "order_fixed" | "delivery_percentage" | "delivery_fixed" | "buy_x_get_y">>,
];
