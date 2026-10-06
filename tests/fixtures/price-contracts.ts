import type {
  Price,
  CreatePriceParams,
  UpdatePriceParams,
  FindPricesParams,
  ManualPriceInput,
  ManualPrice,
  ProductVariant,
  DigitalProduct,
  BookingOffering,
  StorefrontProduct,
  StorefrontProductVariant,
  StorefrontDigitalProduct,
  StorefrontBookingOffering,
  StorefrontPrice,
  CreateProductVariantParams,
  CreateDigitalProductParams,
  CreateBookingOfferingParams,
  OrderProductSnapshot,
  OrderBookingSnapshot,
  OrderDigitalSnapshot,
  AppliedPriceSnapshot,
  AppliedPriceSource,
  OrderLinePrice,
  CheckoutProductSnapshot,
  CheckoutDigitalSnapshot,
  DeletePriceParams,
  SellableRef,
  EpochMilliseconds,
  PriceBatchOperation,
  BatchPricesParams,
} from "arky-sdk";
import type { createAdmin } from "arky-sdk/admin";
import type { Price as PublicPrice } from "arky-sdk/types";

type True<T extends true> = T;
type False<T extends false> = T;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

export type PriceContracts = [
  True<PublicPrice extends Price ? true : false>,
  True<RequiredField<Price, "catalog_id">>,
  True<RequiredField<Price, "sellable">>,
  True<Same<Price["sellable"], SellableRef>>,
  False<"priced" extends keyof Price ? true : false>,
  True<Same<Price["starts_at"], EpochMilliseconds | null>>,
  True<Same<Price["ends_at"], EpochMilliseconds | null>>,
  False<"scope" extends keyof Price ? true : false>,
  False<"currency" extends keyof Price ? true : false>,
  False<"price_list_id" extends keyof Price ? true : false>,
  False<"market" extends keyof Price ? true : false>,
  False<"audience_id" extends keyof Price ? true : false>,
  False<"draft" extends Price["status"]["type"] ? true : false>,
  True<"deleting" extends Price["status"]["type"] ? true : false>,
  False<"deleting" extends CreatePriceParams["status"]["type"] ? true : false>,
  True<RequiredField<CreatePriceParams, "catalog_id">>,
  True<RequiredField<CreatePriceParams, "sellable">>,
  True<RequiredField<CreatePriceParams, "starts_at">>,
  True<Same<CreatePriceParams["ends_at"], EpochMilliseconds | null>>,
  True<RequiredField<CreatePriceParams, "compare_at">>,
  True<RequiredField<CreatePriceParams, "max_quantity">>,
  False<"currency" extends keyof CreatePriceParams ? true : false>,
  False<"sellable" extends keyof UpdatePriceParams ? true : false>,
  True<RequiredField<UpdatePriceParams, "starts_at">>,
  True<Same<PriceBatchOperation["type"], "create" | "update" | "delete">>,
  True<Same<Parameters<ReturnType<typeof createAdmin>["eshop"]["price"]["batch"]>[0], BatchPricesParams>>,
  True<Same<Awaited<ReturnType<ReturnType<typeof createAdmin>["eshop"]["price"]["batch"]>>, Price[]>>,
  True<Same<NonNullable<FindPricesParams["sellable"]>, SellableRef>>,
  False<"catalog_id" extends keyof UpdatePriceParams ? true : false>,
  False<"currency" extends keyof UpdatePriceParams ? true : false>,
  False<"billing" extends keyof UpdatePriceParams ? true : false>,
  True<RequiredField<UpdatePriceParams, "compare_at">>,
  True<RequiredField<UpdatePriceParams, "max_quantity">>,
  True<RequiredField<DeletePriceParams, "expected_updated_at">>,
  False<"base_only" | "currency" | "price_list_id" extends keyof FindPricesParams ? true : false>,
  True<Same<AppliedPriceSource["type"], "catalog" | "purchase_access" | "manual">>,
  True<RequiredField<Extract<AppliedPriceSource, { type: "manual" }>, "allow_promotions">>,
  True<Same<Extract<AppliedPriceSource, { type: "manual" }>["catalog_id"], string>>,
  True<Same<Extract<AppliedPriceSource, { type: "purchase_access" }>["subscription_id"], string | null>>,
  False<"prices" extends keyof ProductVariant ? true : false>,
  False<"prices" extends keyof DigitalProduct ? true : false>,
  False<"prices" extends keyof BookingOffering ? true : false>,
  False<"prices" extends keyof CreateProductVariantParams ? true : false>,
  False<"prices" extends keyof CreateDigitalProductParams ? true : false>,
  False<"prices" extends keyof CreateBookingOfferingParams ? true : false>,
  False<"status" extends keyof StorefrontProduct ? true : false>,
  True<
    StorefrontProductVariant["price"] extends StorefrontPrice | null
      ? true
      : false
  >,
  True<
    StorefrontDigitalProduct["price"] extends StorefrontPrice | null
      ? true
      : false
  >,
  True<
    StorefrontBookingOffering["price"] extends StorefrontPrice | null
      ? true
      : false
  >,
  False<"purchase_allowed" extends keyof StorefrontProductVariant ? true : false>,
  False<"purchase_allowed" extends keyof StorefrontProduct ? true : false>,
  False<"purchase_allowed" extends keyof StorefrontDigitalProduct ? true : false>,
  False<"purchase_allowed" extends keyof StorefrontBookingOffering ? true : false>,
  False<"source" extends keyof StorefrontPrice ? true : false>,
  True<
    OrderProductSnapshot["price"] extends OrderLinePrice ? true : false
  >,
  True<
    OrderBookingSnapshot["price"] extends AppliedPriceSnapshot ? true : false
  >,
  True<
    OrderDigitalSnapshot["price"] extends OrderLinePrice ? true : false
  >,
  True<CheckoutProductSnapshot["price"] extends AppliedPriceSnapshot ? true : false>,
  True<CheckoutDigitalSnapshot["price"] extends AppliedPriceSnapshot ? true : false>,
  True<RequiredField<ManualPriceInput, "reason">>,
  False<"authorized_by" extends keyof ManualPriceInput ? true : false>,
  True<RequiredField<ManualPrice, "authorized_by">>,
];
