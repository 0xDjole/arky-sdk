import type {
  PackageItemPrice,
  PackageItemPriceChange,
  PackagePriceComparison,
  PackagePriceRef,
  PackageItemPricePage,
  EpochMilliseconds,
  CreatePackageItemPriceParams,
  UpdatePackageItemPriceParams,
  FindPackageItemPricesParams,
  ProductVariant,
  BookingOffering,
  StorefrontProduct,
  StorefrontProductVariant,
  StorefrontBookingOffering,
  StorefrontBookingService,
  StorefrontPrice,
  CreateProductVariantParams,
  CreateBookingOfferingParams,
  OrderProductSnapshot,
  OrderBookingSnapshot,
  OrderLinePrice,
  DeletePackageItemPriceParams,
  SellableRef,
  Schedule,
  PackageItemPriceBatchOperation,
  BatchPackageItemPricesParams,
  CartBookingLineItemInput,
  CartPackageLineItemInput,
  CartProductLineItemInput,
} from "arky-sdk";
import type { createAdmin } from "arky-sdk/admin";
import type { PackageItemPrice as PublicPackageItemPrice } from "arky-sdk/types";

type True<T extends true> = T;
type False<T extends false> = T;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Eshop = ReturnType<typeof createAdmin>["eshop"];
type PriceApi = Eshop["packageItemPrice"];

export type PriceContracts = [
  True<Same<PublicPackageItemPrice, PackageItemPrice>>,
  True<RequiredField<PackageItemPrice, "package_item_id">>,
  True<RequiredField<PackageItemPrice, "sellable">>,
  True<Same<PackageItemPrice["sellable"], SellableRef>>,
  True<Same<PackageItemPrice["schedule"], Schedule>>,
  False<"package_id" | "min_quantity" | "max_quantity" extends keyof PackageItemPrice ? true : false>,
  False<"starts_at" | "ends_at" extends keyof PackageItemPrice ? true : false>,
  False<
    | "priced"
    | "scope"
    | "currency"
    | "price_list_id"
    | "market"
    | "audience_id" extends keyof PackageItemPrice
      ? true
      : false
  >,
  True<Same<PackageItemPrice["status"]["type"], "active" | "archived">>,
  True<RequiredField<CreatePackageItemPriceParams, "id">>,
  True<RequiredField<CreatePackageItemPriceParams, "package_item_id">>,
  True<RequiredField<CreatePackageItemPriceParams, "sellable">>,
  True<RequiredField<CreatePackageItemPriceParams, "schedule">>,
  True<RequiredField<CreatePackageItemPriceParams, "compare_at">>,
  False<"currency" | "package_id" | "min_quantity" | "max_quantity" extends keyof CreatePackageItemPriceParams ? true : false>,
  False<
    | "sellable"
    | "package_item_id"
    | "package_id"
    | "currency"
    | "billing" extends keyof UpdatePackageItemPriceParams
      ? true
      : false
  >,
  True<RequiredField<UpdatePackageItemPriceParams, "schedule">>,
  True<RequiredField<UpdatePackageItemPriceParams, "expected_updated_at">>,
  True<RequiredField<UpdatePackageItemPriceParams, "compare_at">>,
  True<RequiredField<CreatePackageItemPriceParams, "changes">>,
  True<RequiredField<UpdatePackageItemPriceParams, "changes">>,
  True<RequiredField<PackageItemPrice, "changes">>,
  True<Same<PackageItemPrice["changes"], PackageItemPriceChange[]>>,
  True<Same<CreatePackageItemPriceParams["changes"], PackageItemPriceChange[]>>,
  True<Same<UpdatePackageItemPriceParams["changes"], PackageItemPriceChange[]>>,
  True<Same<PackageItemPriceChange, { starts_at: EpochMilliseconds; amount: number; compare_at: PackagePriceComparison }>>,
  True<RequiredField<PackageItemPriceChange, "compare_at">>,
  True<RequiredField<Extract<PackageItemPriceBatchOperation, { type: "create" }>, "changes">>,
  True<RequiredField<Extract<PackageItemPriceBatchOperation, { type: "update" }>, "changes">>,
  False<"changes" extends keyof Extract<PackageItemPriceBatchOperation, { type: "delete" }> ? true : false>,
  True<RequiredField<DeletePackageItemPriceParams, "expected_updated_at">>,
  True<Same<Awaited<ReturnType<PriceApi["delete"]>>, void>>,
  True<Same<PackageItemPriceBatchOperation["type"], "create" | "update" | "delete">>,
  True<Same<Parameters<PriceApi["batch"]>[0], BatchPackageItemPricesParams>>,
  True<Same<Awaited<ReturnType<PriceApi["batch"]>>, PackageItemPrice[]>>,
  True<Same<Parameters<PriceApi["find"]>[0], FindPackageItemPricesParams>>,
  True<Same<Awaited<ReturnType<PriceApi["find"]>>, PackageItemPricePage>>,
  True<Same<NonNullable<FindPackageItemPricesParams["sellable"]>, SellableRef>>,
  False<
    "base_only" | "currency" | "price_list_id" | "package_id" extends keyof FindPackageItemPricesParams
      ? true
      : false
  >,
  False<"price" extends keyof Eshop ? true : false>,
  True<
    Same<
      OrderLinePrice["type"],
      | "listed"
      | "offer"
      | "package_allocation"
    >
  >,
  True<Same<Extract<OrderLinePrice, { type: "listed" }>["price_id"], string>>,
  True<Same<Extract<OrderLinePrice, { type: "offer" }>["price_id"], string>>,
  True<Same<Extract<OrderLinePrice, { type: "listed" }>, { type: "listed" } & PackagePriceRef>>,
  False<"prices" extends keyof ProductVariant ? true : false>,
  False<"prices" extends keyof BookingOffering ? true : false>,
  False<"prices" extends keyof CreateProductVariantParams ? true : false>,
  False<"prices" extends keyof CreateBookingOfferingParams ? true : false>,
  False<"status" extends keyof StorefrontProduct ? true : false>,
  False<"price" extends keyof StorefrontProduct ? true : false>,
  False<"price" extends keyof StorefrontBookingService ? true : false>,
  True<Same<StorefrontProduct["package_item_id"], string>>,
  True<Same<StorefrontBookingService["package_item_id"], string>>,
  True<Same<StorefrontProductVariant["package_item_id"], string>>,
  True<Same<StorefrontBookingOffering["package_item_id"], string>>,
  True<
    StorefrontProductVariant["price"] extends StorefrontPrice | null
      ? true
      : false
  >,
  True<
    StorefrontBookingOffering["price"] extends StorefrontPrice | null
      ? true
      : false
  >,
  False<
    "purchase_allowed" extends keyof StorefrontProductVariant ? true : false
  >,
  False<"purchase_allowed" extends keyof StorefrontProduct ? true : false>,
  False<
    "purchase_allowed" extends keyof StorefrontBookingOffering ? true : false
  >,
  False<"source" extends keyof StorefrontPrice ? true : false>,
  True<RequiredField<StorefrontPrice, "price_id">>,
  True<Same<OrderProductSnapshot["price"], OrderLinePrice>>,
  True<Same<OrderBookingSnapshot["price"], OrderLinePrice>>,
  False<"price_override" extends keyof CartProductLineItemInput ? true : false>,
  False<"price_override" extends keyof CartBookingLineItemInput ? true : false>,
  False<"price_override" extends keyof CartPackageLineItemInput ? true : false>,
  True<Same<CartBookingLineItemInput["price"], PackagePriceRef>>,
  True<Same<CartPackageLineItemInput["price"], PackagePriceRef>>,
  True<Same<CartProductLineItemInput["price"], PackagePriceRef>>,
  True<Same<keyof CartProductLineItemInput, "id" | "variant_id" | "quantity" | "form_submission_id" | "price">>,
];
