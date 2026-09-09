import type {
  Price,
  PriceList,
  PriceListUsage,
  CreatePriceParams,
  CreatePriceListParams,
  UpdatePriceParams,
  UpdatePriceListParams,
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
  CreateProductVariantInput,
  CreateDigitalProductParams,
  CreateBookingOfferingParams,
  OrderProductSnapshot,
  OrderBookingSnapshot,
  OrderDigitalSnapshot,
  AppliedPriceSnapshot,
  DeletePriceParams,
  DeletePriceListParams,
} from "arky-sdk";
import type {
  Price as PublicPrice,
  PriceList as PublicPriceList,
} from "arky-sdk/types";

type True<T extends true> = T;
type False<T extends false> = T;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;

export type PriceContracts = [
  False<"rule_ids" extends keyof PriceListUsage ? true : false>,
  True<RequiredField<PriceListUsage, "catalog_ids">>,
  True<RequiredField<PriceListUsage, "price_ids">>,
  True<PublicPrice extends Price ? true : false>,
  True<PublicPriceList extends PriceList ? true : false>,
  True<RequiredField<Price, "sellable">>,
  True<RequiredField<Price, "price_list_id">>,
  True<null extends Price["price_list_id"] ? true : false>,
  False<"market" extends keyof Price ? true : false>,
  False<"audience_id" extends keyof Price ? true : false>,
  False<"draft" extends Price["status"]["type"] ? true : false>,
  True<"deleting" extends Price["status"]["type"] ? true : false>,
  False<"deleting" extends CreatePriceParams["status"]["type"] ? true : false>,
  False<"sellable" extends keyof UpdatePriceParams ? true : false>,
  False<"currency" extends keyof UpdatePriceParams ? true : false>,
  False<"billing" extends keyof UpdatePriceParams ? true : false>,
  False<"price_list_id" extends keyof UpdatePriceParams ? true : false>,
  True<RequiredField<UpdatePriceParams, "compare_at">>,
  True<RequiredField<UpdatePriceParams, "max_quantity">>,
  True<RequiredField<DeletePriceParams, "expected_updated_at">>,
  True<RequiredField<DeletePriceListParams, "expected_updated_at">>,
  True<RequiredField<CreatePriceListParams, "priority">>,
  True<RequiredField<UpdatePriceListParams, "priority">>,
  True<RequiredField<UpdatePriceListParams, "ends_at">>,
  False<"conditions" extends keyof PriceList ? true : false>,
  False<"prices" extends keyof ProductVariant ? true : false>,
  False<"prices" extends keyof DigitalProduct ? true : false>,
  False<"prices" extends keyof BookingOffering ? true : false>,
  False<"prices" extends keyof CreateProductVariantInput ? true : false>,
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
  True<RequiredField<StorefrontProductVariant, "purchase_allowed">>,
  False<"source" extends keyof StorefrontPrice ? true : false>,
  True<
    OrderProductSnapshot["price"] extends AppliedPriceSnapshot ? true : false
  >,
  True<
    OrderBookingSnapshot["price"] extends AppliedPriceSnapshot ? true : false
  >,
  True<
    OrderDigitalSnapshot["price"] extends AppliedPriceSnapshot ? true : false
  >,
  True<RequiredField<ManualPriceInput, "reason">>,
  False<"authorized_by" extends keyof ManualPriceInput ? true : false>,
  True<RequiredField<ManualPrice, "authorized_by">>,
];
