import type { createAdmin } from "arky-sdk/admin";
import type { createStorefront } from "arky-sdk/storefront";
import type {
  FindMarketsParams,
  FindPaymentOptionsParams,
  FindTenantLocationsParams,
  FindStorefrontLocationsParams,
  FindStorefrontMarketsParams,
  CreateTenantLocationParams,
  UpdateTenantLocationParams,
  UpdateMarketParams,
  PostalAddressInput,
  Market,
  MarketStatus,
  PaginatedResponse,
  PaymentOption,
  TenantLocation,
  TenantLocationStatus,
  TenantRecordParams,
  LocationCountry,
  GetCountryParams,
  StorefrontGetLocationParams,
  StorefrontGetMarketByKeyParams,
  StorefrontGetMarketParams,
  StorefrontPaymentOption,
  StorefrontSetup,
  FiscalJurisdiction,
  CroatiaOnlineFiscalDevice,
  RepublikaSrpskaOnlineFiscalDevice,
  SetTenantLocationFiscalParams,
  TenantLocationFiscal,
  StorefrontUserSignIn,
  StorefrontSeller,
  PostalAddress,
} from "arky-sdk";

type Admin = ReturnType<typeof createAdmin>;
type Front = ReturnType<typeof createStorefront>;
type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;

export type ConfigurationPages = [
  Assert<Equal<Awaited<ReturnType<Admin["tenant"]["market"]["find"]>>, PaginatedResponse<Market>>>,
  Assert<Equal<Awaited<ReturnType<Admin["tenant"]["location"]["find"]>>, PaginatedResponse<TenantLocation>>>,
  Assert<Equal<Awaited<ReturnType<Admin["tenant"]["paymentOption"]["find"]>>, PaginatedResponse<PaymentOption>>>,
  Assert<Equal<Parameters<Admin["tenant"]["market"]["get"]>[0], TenantRecordParams>>,
  Assert<Equal<Parameters<Admin["tenant"]["location"]["get"]>[0], TenantRecordParams>>,
  Assert<Equal<NonNullable<FindMarketsParams["status"]>, MarketStatus["type"]>>,
  Assert<Equal<NonNullable<FindTenantLocationsParams["status"]>, TenantLocationStatus["type"]>>,
  Assert<Equal<NonNullable<Parameters<Front["tenant"]["market"]["find"]>[0]>, FindStorefrontMarketsParams>>,
  Assert<Equal<NonNullable<Parameters<Front["tenant"]["location"]["find"]>[0]>, FindStorefrontLocationsParams>>,
  Assert<Missing<FindStorefrontMarketsParams, "tenant_id" | "status">>,
  Assert<Missing<FindStorefrontLocationsParams, "tenant_id" | "status" | "query" | "pickup_point">>,
  Assert<Equal<keyof FindStorefrontLocationsParams, "key" | "sort_field" | "sort_direction" | "limit" | "cursor">>,
  Assert<Equal<Parameters<Front["tenant"]["market"]["getByKey"]>[0], StorefrontGetMarketByKeyParams>>,
  Assert<Equal<keyof StorefrontGetMarketByKeyParams, "key">>,
  Assert<Equal<Parameters<Front["tenant"]["market"]["get"]>[0], StorefrontGetMarketParams>>,
  Assert<Equal<Parameters<Front["tenant"]["location"]["get"]>[0], StorefrontGetLocationParams>>,
  Assert<Equal<Parameters<Front["tenant"]["country"]["get"]>[0], GetCountryParams>>,
  Assert<Equal<Awaited<ReturnType<Front["tenant"]["country"]["find"]>>, PaginatedResponse<LocationCountry>>>,
  Assert<Missing<Front["tenant"]["location"], "getCountries" | "getCountry" | "list">>,
  Assert<Missing<FindTenantLocationsParams, "query">>,
  Assert<Equal<FindTenantLocationsParams["key"], string | undefined>>,
  Assert<Equal<NonNullable<FindTenantLocationsParams["sort_field"]>, "created_at" | "updated_at">>,
  Assert<Equal<NonNullable<FindMarketsParams["sort_field"]>, "created_at" | "updated_at">>,
  Assert<Equal<NonNullable<FindPaymentOptionsParams["sort_field"]>, "created_at" | "updated_at">>,
  Assert<RequiredField<CreateTenantLocationParams, "address">>,
  Assert<Equal<CreateTenantLocationParams["address"], PostalAddressInput>>,
  Assert<Equal<RequiredField<UpdateTenantLocationParams, "address">, false>>,
  Assert<Missing<UpdateMarketParams, "tax_mode">>,
  Assert<Equal<TenantLocation["fiscal"], TenantLocationFiscal>>,
  Assert<Equal<TenantLocationFiscal, { type: "not_fiscal" } | { type: "croatia"; online_fiscal_device: CroatiaOnlineFiscalDevice } | { type: "republika_srpska"; online_fiscal_device: RepublikaSrpskaOnlineFiscalDevice } | { type: "serbia" } | { type: "fbih2009" } | { type: "fbih2026" } | { type: "brcko" }>>,
  Assert<Equal<FiscalJurisdiction, "croatia" | "fbih2009" | "fbih2026" | "republika_srpska" | "brcko" | "serbia">>,
  Assert<Equal<CroatiaOnlineFiscalDevice, { type: "none" } | { type: "device"; fiscal_device_id: string }>>,
  Assert<Equal<RepublikaSrpskaOnlineFiscalDevice, { type: "none" } | { type: "device"; fiscal_device_id: string }>>,
  Assert<Equal<Parameters<Admin["tenant"]["location"]["setFiscal"]>[0], SetTenantLocationFiscalParams>>,
  Assert<Equal<keyof SetTenantLocationFiscalParams, "tenant_id" | "id" | "expected_updated_at" | "fiscal">>,
  Assert<Equal<Awaited<ReturnType<Admin["tenant"]["location"]["setFiscal"]>>, TenantLocation>>,
  Assert<Missing<CreateTenantLocationParams, "fiscal">>,
  Assert<Missing<UpdateTenantLocationParams, "fiscal">>,
];

export type PublicSetup = [
  Assert<Equal<Awaited<ReturnType<Front["getSetup"]>>, StorefrontSetup>>,
  Assert<Equal<keyof StorefrontSetup, "name" | "timezone" | "languages" | "payment_options" | "user_sign_in" | "seller">>,
  Assert<Equal<StorefrontSetup["user_sign_in"], StorefrontUserSignIn>>,
  Assert<Equal<StorefrontSetup["seller"], StorefrontSeller>>,
  Assert<Equal<StorefrontSeller, { type: "none" } | { type: "seller"; name: string; address: PostalAddress }>>,
  Assert<Equal<Extract<StorefrontSeller, { type: "seller" }>["address"]["country"], string>>,
  Assert<Equal<StorefrontUserSignIn, { type: "tenant" } | { type: "network"; network_id: string }>>,
  Assert<Equal<StorefrontSetup["languages"], string[]>>,
  Assert<Equal<StorefrontSetup["payment_options"], StorefrontPaymentOption[]>>,
  Assert<Missing<StorefrontPaymentOption, "configuration" | "status" | "tenant_id">>,
];

export const market: FindMarketsParams = { tenant_id: "5c9e1a37-8d24-4f60-b3a5-0e7f2c4d6b18", currency: "eur", status: "active", limit: 1, cursor: "opaque" };
export const location: FindTenantLocationsParams = { tenant_id: market.tenant_id, key: "warehouse", status: "archived", sort_field: "updated_at" };
export const provider: FindPaymentOptionsParams = { tenant_id: market.tenant_id, type_name: "stripe", status: "disabled", cursor: "opaque" };
