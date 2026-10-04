import type {
  Cart, FindStorefrontPreparedCartsParams, PaginatedResponse, StorefrontClient,
} from "arky-sdk";
import type { FindStorefrontPreparedCartsParams as PublicParams } from "arky-sdk/types";
import type { FindStorefrontPreparedCartsParams as StorefrontParams } from "arky-sdk/storefront";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type Required<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;

export type PreparedCartContracts = [
  Assert<Equal<FindStorefrontPreparedCartsParams, PublicParams>>,
  Assert<Equal<FindStorefrontPreparedCartsParams, StorefrontParams>>,
  Assert<Equal<Parameters<StorefrontClient["eshop"]["cart"]["prepared"]>[0], FindStorefrontPreparedCartsParams>>,
  Assert<Equal<Awaited<ReturnType<StorefrontClient["eshop"]["cart"]["prepared"]>>, PaginatedResponse<Cart>>>,
  Assert<Equal<keyof FindStorefrontPreparedCartsParams, "company_id" | "company_location_id" | "limit" | "cursor">>,
  Assert<Required<FindStorefrontPreparedCartsParams, "company_id">>,
  Assert<Required<FindStorefrontPreparedCartsParams, "company_location_id">>,
  Assert<Equal<FindStorefrontPreparedCartsParams["limit"], number | undefined>>,
  Assert<Equal<FindStorefrontPreparedCartsParams["cursor"], string | undefined>>,
  Assert<Missing<FindStorefrontPreparedCartsParams, "store_id">>,
  Assert<Missing<FindStorefrontPreparedCartsParams, "customer_id">>,
  Assert<Missing<FindStorefrontPreparedCartsParams, "market_id">>,
  Assert<Missing<FindStorefrontPreparedCartsParams, "sales_channel_id">>,
  Assert<Missing<FindStorefrontPreparedCartsParams, "token">>,
  Assert<Required<PaginatedResponse<Cart>, "cursor">>,
  Assert<Equal<PaginatedResponse<Cart>["cursor"], string | null>>,
];
