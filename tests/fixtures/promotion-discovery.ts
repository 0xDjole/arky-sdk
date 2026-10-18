import type { createAdmin } from "arky-sdk/admin";
import type { createStorefront } from "arky-sdk/storefront";
import type {
  StorefrontPromotion,
  GetStorefrontPromotionParams,
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
  PromotionFixedScope,
  Money,
  Block,
  Schedule,
  PromotionCondition,
  PromotionStatus,
  PromotionTarget,
  ShippingRateCondition,
} from "arky-sdk/types";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Eshop = ReturnType<typeof createAdmin>["eshop"];
type StorefrontEshop = ReturnType<typeof createStorefront>["eshop"];

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
  Assert<RequiredField<CreatePromotionParams, "blocks">>,
  Assert<Equal<CreatePromotionParams["blocks"], Block[]>>,
  Assert<Missing<CreatePromotionParams, "activation">>,
  Assert<Equal<Extract<PromotionTarget, { type: "product_variants" }>, { type: "product_variants"; variant_ids: string[] }>>,
  Assert<Equal<Extract<PromotionCondition, { type: "minimum_subtotal" }>, { type: "minimum_subtotal"; amounts: Money[] }>>,
  Assert<Equal<Extract<PromotionEffect, { type: "item_fixed" }>["scope"], PromotionFixedScope>>,
  Assert<Equal<Extract<PromotionEffect, { type: "item_fixed" }>["amounts"], Money[]>>,
  Assert<Missing<Extract<PromotionEffect, { type: "item_fixed" }>, "money">>,
  Assert<RequiredField<CreatePromotionCodeParams, "id">>,
  Assert<Equal<CreatePromotionParams["status"], PromotionEditableStatus>>,
  Assert<Equal<Extract<PromotionStatus, { type: "deleting" }>, Exclude<PromotionStatus, PromotionEditableStatus>>>,
  Assert<Equal<CreatePromotionParams["schedule"], Schedule>>,
  Assert<Missing<CreatePromotionParams, "starts_at" | "ends_at">>,
  Assert<Equal<Schedule["type"], "always" | "scheduled">>,
  Assert<Equal<PromotionTarget["type"], "products" | "product_variants" | "booking_services" | "customer_group_offerings" | "customer_groups" | "catalogs" | "categories" | "all_eligible_items">>,
  Assert<Equal<Extract<PromotionTarget, { type: "customer_group_offerings" }>, { type: "customer_group_offerings"; customer_group_offering_ids: string[] }>>,
  Assert<Equal<Extract<PromotionTarget, { type: "customer_groups" }>, { type: "customer_groups"; customer_group_ids: string[] }>>,
  Assert<Equal<Extract<PromotionCondition, { type: "customer_group_offering" }>, { type: "customer_group_offering"; ids: string[] }>>,
  Assert<Equal<Extract<ShippingRateCondition, { type: "customer_group_offering" }>, { type: "customer_group_offering"; ids: string[] }>>,
  Assert<Equal<PromotionEffect["type"], "item_percentage" | "item_fixed" | "order_percentage" | "order_fixed" | "delivery_percentage" | "delivery_fixed" | "buy_x_get_y">>,
  Assert<Equal<StorefrontPromotion, { id: string; key: string; blocks: Block[] }>>,
  Assert<Equal<keyof StorefrontEshop["promotion"], "get">>,
  Assert<Equal<Parameters<StorefrontEshop["promotion"]["get"]>[0], GetStorefrontPromotionParams>>,
  Assert<Equal<keyof GetStorefrontPromotionParams, "id">>,
  Assert<Equal<Awaited<ReturnType<StorefrontEshop["promotion"]["get"]>>, StorefrontPromotion>>,
];
