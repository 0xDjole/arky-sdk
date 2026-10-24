import type { createAdmin } from "arky-sdk/admin";
import type { createStorefront } from "arky-sdk/storefront";
import type {
  FindMarketsParams,
  FindPaymentOptionsParams,
  FindStoreLocationsParams,
  FindStorefrontLocationsParams,
  FindStorefrontMarketsParams,
  CreateStoreLocationParams,
  UpdateStoreLocationParams,
  UpdateMarketParams,
  PostalAddressInput,
  Market,
  MarketStatus,
  PaginatedResponse,
  PaymentOption,
  StoreLocation,
  StoreLocationStatus,
  StoreRecordParams,
  StorefrontCountry,
  StorefrontGetCountryParams,
  StorefrontGetLocationParams,
  StorefrontGetMarketByKeyParams,
  StorefrontGetMarketParams,
  StorefrontPaymentOption,
  StorefrontSetup,
} from "arky-sdk";

type Admin = ReturnType<typeof createAdmin>;
type Front = ReturnType<typeof createStorefront>;
type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;

export type ConfigurationPages = [
  Assert<Equal<Awaited<ReturnType<Admin["store"]["market"]["find"]>>, PaginatedResponse<Market>>>,
  Assert<Equal<Awaited<ReturnType<Admin["store"]["location"]["find"]>>, PaginatedResponse<StoreLocation>>>,
  Assert<Equal<Awaited<ReturnType<Admin["store"]["paymentOption"]["find"]>>, PaginatedResponse<PaymentOption>>>,
  Assert<Equal<Parameters<Admin["store"]["market"]["get"]>[0], StoreRecordParams>>,
  Assert<Equal<Parameters<Admin["store"]["location"]["get"]>[0], StoreRecordParams>>,
  Assert<Equal<NonNullable<FindMarketsParams["status"]>, MarketStatus["type"]>>,
  Assert<Equal<NonNullable<FindStoreLocationsParams["status"]>, StoreLocationStatus["type"]>>,
  Assert<Equal<NonNullable<Parameters<Front["store"]["market"]["find"]>[0]>, FindStorefrontMarketsParams>>,
  Assert<Equal<NonNullable<Parameters<Front["store"]["location"]["find"]>[0]>, FindStorefrontLocationsParams>>,
  Assert<Missing<FindStorefrontMarketsParams, "store_id" | "status">>,
  Assert<Missing<FindStorefrontLocationsParams, "store_id" | "status" | "query" | "pickup_point">>,
  Assert<Equal<keyof FindStorefrontLocationsParams, "key" | "sort_field" | "sort_direction" | "limit" | "cursor">>,
  Assert<Equal<Parameters<Front["store"]["market"]["getByKey"]>[0], StorefrontGetMarketByKeyParams>>,
  Assert<Equal<keyof StorefrontGetMarketByKeyParams, "key">>,
  Assert<Equal<Parameters<Front["store"]["market"]["get"]>[0], StorefrontGetMarketParams>>,
  Assert<Equal<Parameters<Front["store"]["location"]["get"]>[0], StorefrontGetLocationParams>>,
  Assert<Equal<Parameters<Front["store"]["country"]["get"]>[0], StorefrontGetCountryParams>>,
  Assert<Equal<Awaited<ReturnType<Front["store"]["country"]["find"]>>, PaginatedResponse<StorefrontCountry>>>,
  Assert<Missing<Front["store"]["location"], "getCountries" | "getCountry" | "list">>,
  Assert<Missing<FindStoreLocationsParams, "query">>,
  Assert<Equal<FindStoreLocationsParams["key"], string | undefined>>,
  Assert<Equal<NonNullable<FindStoreLocationsParams["sort_field"]>, "created_at" | "updated_at">>,
  Assert<Equal<NonNullable<FindMarketsParams["sort_field"]>, "created_at" | "updated_at">>,
  Assert<Equal<NonNullable<FindPaymentOptionsParams["sort_field"]>, "created_at" | "updated_at">>,
  Assert<RequiredField<CreateStoreLocationParams, "address">>,
  Assert<Equal<CreateStoreLocationParams["address"], PostalAddressInput>>,
  Assert<Equal<RequiredField<UpdateStoreLocationParams, "address">, false>>,
  Assert<Missing<UpdateMarketParams, "tax_mode">>,
];

export type PublicSetup = [
  Assert<Equal<Awaited<ReturnType<Front["getSetup"]>>, StorefrontSetup>>,
  Assert<Equal<keyof StorefrontSetup, "name" | "timezone" | "languages" | "payment_options" | "bot_check">>,
  Assert<Equal<StorefrontSetup["languages"], string[]>>,
  Assert<Equal<StorefrontSetup["payment_options"], StorefrontPaymentOption[]>>,
  Assert<Missing<StorefrontPaymentOption, "configuration" | "status" | "store_id">>,
];

export const market: FindMarketsParams = { store_id: "5c9e1a37-8d24-4f60-b3a5-0e7f2c4d6b18", currency: "eur", status: "active", limit: 1, cursor: "opaque" };
export const location: FindStoreLocationsParams = { store_id: market.store_id, key: "warehouse", status: "archived", sort_field: "updated_at" };
export const provider: FindPaymentOptionsParams = { store_id: market.store_id, type_name: "stripe", status: "disabled", cursor: "opaque" };
