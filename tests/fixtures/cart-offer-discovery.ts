import type { Cart, CartOffer, FindStorefrontCartOffersParams, PaginatedResponse, StorefrontClient } from "arky-sdk";
import type { FindStorefrontCartOffersParams as PublicParams } from "arky-sdk/types";
import type { FindStorefrontCartOffersParams as StorefrontParams } from "arky-sdk/storefront";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;

export type CartOfferContracts = [
  Assert<Equal<FindStorefrontCartOffersParams, PublicParams>>,
  Assert<Equal<FindStorefrontCartOffersParams, StorefrontParams>>,
  Assert<Equal<Parameters<StorefrontClient["eshop"]["cart"]["offers"]>[0], FindStorefrontCartOffersParams>>,
  Assert<Equal<Awaited<ReturnType<StorefrontClient["eshop"]["cart"]["offers"]>>, PaginatedResponse<Cart>>>,
  Assert<Equal<FindStorefrontCartOffersParams, ({ company_id: string; company_location_id?: never } | { company_id?: never; company_location_id: string }) & { limit?: number; cursor?: string | null }>>,
  Assert<Equal<keyof FindStorefrontCartOffersParams, "company_id" | "company_location_id" | "limit" | "cursor">>,
  Assert<RequiredField<Extract<FindStorefrontCartOffersParams, { company_id: string }>, "company_id">>,
  Assert<RequiredField<Extract<FindStorefrontCartOffersParams, { company_location_id: string }>, "company_location_id">>,
  Assert<Missing<Extract<FindStorefrontCartOffersParams, { company_id: string }>, "store_id" | "customer_id" | "market_id" | "sales_channel_id" | "token">>,
  Assert<Missing<Extract<FindStorefrontCartOffersParams, { company_location_id: string }>, "store_id" | "customer_id" | "market_id" | "sales_channel_id" | "token">>,
  Assert<Missing<StorefrontClient["eshop"]["cart"], "prepared">>,
  Assert<Equal<Cart["offer"], CartOffer | null>>,
  Assert<Equal<PaginatedResponse<Cart>["cursor"], string | null>>,
];
