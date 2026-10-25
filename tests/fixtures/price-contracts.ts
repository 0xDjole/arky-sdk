import type {
  CatalogItemPrice,
  CatalogItemPriceChange,
  CatalogItemPricePage,
  EpochMilliseconds,
  CreateCatalogItemPriceParams,
  UpdateCatalogItemPriceParams,
  FindCatalogItemPricesParams,
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
  DeleteCatalogItemPriceParams,
  SellableRef,
  Schedule,
  CatalogItemPriceBatchOperation,
  BatchCatalogItemPricesParams,
  CartBookingLineItemInput,
  CartCustomerGroupLineItemInput,
  CartProductLineItemInput,
} from "arky-sdk";
import type { createAdmin } from "arky-sdk/admin";
import type { CatalogItemPrice as PublicCatalogItemPrice } from "arky-sdk/types";

type True<T extends true> = T;
type False<T extends false> = T;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Eshop = ReturnType<typeof createAdmin>["eshop"];
type PriceApi = Eshop["catalogItemPrice"];

export type PriceContracts = [
  True<Same<PublicCatalogItemPrice, CatalogItemPrice>>,
  True<RequiredField<CatalogItemPrice, "catalog_item_id">>,
  True<RequiredField<CatalogItemPrice, "sellable">>,
  True<Same<CatalogItemPrice["sellable"], SellableRef>>,
  True<Same<CatalogItemPrice["schedule"], Schedule>>,
  False<"catalog_id" | "min_quantity" | "max_quantity" extends keyof CatalogItemPrice ? true : false>,
  False<"starts_at" | "ends_at" extends keyof CatalogItemPrice ? true : false>,
  False<
    | "priced"
    | "scope"
    | "currency"
    | "price_list_id"
    | "market"
    | "audience_id" extends keyof CatalogItemPrice
      ? true
      : false
  >,
  True<Same<CatalogItemPrice["status"]["type"], "active" | "archived">>,
  True<RequiredField<CreateCatalogItemPriceParams, "id">>,
  True<RequiredField<CreateCatalogItemPriceParams, "catalog_item_id">>,
  True<RequiredField<CreateCatalogItemPriceParams, "sellable">>,
  True<RequiredField<CreateCatalogItemPriceParams, "schedule">>,
  True<RequiredField<CreateCatalogItemPriceParams, "compare_at">>,
  False<"currency" | "catalog_id" | "min_quantity" | "max_quantity" extends keyof CreateCatalogItemPriceParams ? true : false>,
  False<
    | "sellable"
    | "catalog_item_id"
    | "catalog_id"
    | "currency"
    | "billing" extends keyof UpdateCatalogItemPriceParams
      ? true
      : false
  >,
  True<RequiredField<UpdateCatalogItemPriceParams, "schedule">>,
  True<RequiredField<UpdateCatalogItemPriceParams, "expected_updated_at">>,
  True<RequiredField<UpdateCatalogItemPriceParams, "compare_at">>,
  True<RequiredField<CreateCatalogItemPriceParams, "changes">>,
  True<RequiredField<UpdateCatalogItemPriceParams, "changes">>,
  True<RequiredField<CatalogItemPrice, "changes">>,
  True<Same<CatalogItemPrice["changes"], CatalogItemPriceChange[]>>,
  True<Same<CreateCatalogItemPriceParams["changes"], CatalogItemPriceChange[]>>,
  True<Same<UpdateCatalogItemPriceParams["changes"], CatalogItemPriceChange[]>>,
  True<Same<CatalogItemPriceChange, { starts_at: EpochMilliseconds; amount: number; compare_at: number | null }>>,
  True<RequiredField<CatalogItemPriceChange, "compare_at">>,
  True<RequiredField<Extract<CatalogItemPriceBatchOperation, { type: "create" }>, "changes">>,
  True<RequiredField<Extract<CatalogItemPriceBatchOperation, { type: "update" }>, "changes">>,
  False<"changes" extends keyof Extract<CatalogItemPriceBatchOperation, { type: "delete" }> ? true : false>,
  True<RequiredField<DeleteCatalogItemPriceParams, "expected_updated_at">>,
  True<Same<Awaited<ReturnType<PriceApi["delete"]>>, void>>,
  True<Same<CatalogItemPriceBatchOperation["type"], "create" | "update" | "delete">>,
  True<Same<Parameters<PriceApi["batch"]>[0], BatchCatalogItemPricesParams>>,
  True<Same<Awaited<ReturnType<PriceApi["batch"]>>, CatalogItemPrice[]>>,
  True<Same<Parameters<PriceApi["find"]>[0], FindCatalogItemPricesParams>>,
  True<Same<Awaited<ReturnType<PriceApi["find"]>>, CatalogItemPricePage>>,
  True<Same<NonNullable<FindCatalogItemPricesParams["sellable"]>, SellableRef>>,
  False<
    "base_only" | "currency" | "price_list_id" | "catalog_id" extends keyof FindCatalogItemPricesParams
      ? true
      : false
  >,
  False<"price" extends keyof Eshop ? true : false>,
  True<
    Same<
      OrderLinePrice["type"],
      | "catalog"
      | "purchase_access"
      | "offer"
      | "customer_group_allocation"
    >
  >,
  True<Same<Extract<OrderLinePrice, { type: "catalog" }>["catalog_item_price_id"], string>>,
  True<Same<Extract<OrderLinePrice, { type: "offer" }>["catalog_item_price_id"], string>>,
  True<Same<Extract<OrderLinePrice, { type: "purchase_access" }>["catalog_item_price_id"], string>>,
  True<
    Same<
      Extract<
        OrderLinePrice,
        { type: "purchase_access" }
      >["customer_group_member_id"],
      string | null
    >
  >,
  False<
    "subscription_id" extends keyof Extract<
      OrderLinePrice,
      { type: "purchase_access" }
    >
      ? true
      : false
  >,
  False<"prices" extends keyof ProductVariant ? true : false>,
  False<"prices" extends keyof BookingOffering ? true : false>,
  False<"prices" extends keyof CreateProductVariantParams ? true : false>,
  False<"prices" extends keyof CreateBookingOfferingParams ? true : false>,
  False<"status" extends keyof StorefrontProduct ? true : false>,
  False<"price" extends keyof StorefrontProduct ? true : false>,
  False<"price" extends keyof StorefrontBookingService ? true : false>,
  True<Same<StorefrontProduct["catalog_item_id"], string>>,
  True<Same<StorefrontBookingService["catalog_item_id"], string>>,
  True<Same<StorefrontProductVariant["catalog_item_id"], string>>,
  True<Same<StorefrontBookingOffering["catalog_item_id"], string>>,
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
  True<RequiredField<StorefrontPrice, "catalog_item_price_id">>,
  True<Same<OrderProductSnapshot["price"], OrderLinePrice>>,
  True<Same<OrderBookingSnapshot["price"], OrderLinePrice>>,
  False<"price_override" extends keyof CartProductLineItemInput ? true : false>,
  False<"price_override" extends keyof CartBookingLineItemInput ? true : false>,
  False<"price_override" extends keyof CartCustomerGroupLineItemInput ? true : false>,
  True<RequiredField<CartBookingLineItemInput, "catalog_item_price_id">>,
  True<RequiredField<CartCustomerGroupLineItemInput, "catalog_item_price_id">>,
];
