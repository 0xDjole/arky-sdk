import type { createAdmin } from "arky-sdk/admin";
import type {
  CreateShippingMethodParams,
  CreateTaxCategoryParams,
  CreateZoneParams,
  DeletedResponse,
  EpochMilliseconds,
  FindShippingMethodsParams,
  FindShippingProfilesParams,
  FindTaxCategoriesParams,
  FindZonesParams,
  ShippingMethod,
  ShippingMethodType,
  ShippingRate,
  ShippingRatePricing,
  StoreRecordByKeyParams,
  TaxCategory,
  TaxRule,
  TaxTreatment,
  UpdateShippingMethodParams,
  UpdateTaxCategoryParams,
  Zone,
  ZoneArea,
} from "arky-sdk";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Api = ReturnType<typeof createAdmin>["store"];

export type ShippingTaxContract = [
  Assert<Missing<Api, "taxRule" | "shippingRate" | "marketZone" | "marketSalesChannel">>,
  Assert<Equal<TaxCategory["rules"], TaxRule[]>>,
  Assert<Equal<keyof TaxRule, "id" | "zone_id" | "treatment" | "starts_at" | "ends_at">>,
  Assert<Equal<TaxRule["starts_at"], EpochMilliseconds | null>>,
  Assert<Equal<TaxTreatment["type"], "rates" | "zero_rated" | "exempt" | "not_taxable" | "not_collecting">>,
  Assert<Equal<CreateTaxCategoryParams["rules"], TaxRule[]>>,
  Assert<RequiredField<CreateTaxCategoryParams, "id">>,
  Assert<RequiredField<UpdateTaxCategoryParams, "expected_updated_at">>,
  Assert<Equal<ShippingMethod["rates"], ShippingRate[]>>,
  Assert<Equal<keyof ShippingRate, "id" | "zone_id" | "shipping_profile_id" | "conditions" | "pricing" | "delivery_estimate" | "starts_at" | "ends_at">>,
  Assert<Equal<ShippingRatePricing["type"], "flat" | "weight_tiered">>,
  Assert<Equal<ShippingMethodType, { type: "delivery" } | { type: "pickup"; store_location_id: string }>>,
  Assert<Equal<CreateShippingMethodParams["rates"], ShippingRate[]>>,
  Assert<Missing<UpdateShippingMethodParams, "type">>,
  Assert<Equal<keyof Zone, "id" | "store_id" | "market_id" | "key" | "areas" | "created_at" | "updated_at">>,
  Assert<Equal<CreateZoneParams["areas"], ZoneArea[]>>,
  Assert<Equal<ZoneArea["type"], "country" | "state" | "postal_code" | "postal_code_prefix">>,
  Assert<Equal<Parameters<Api["zone"]["find"]>[0], FindZonesParams>>,
  Assert<Equal<Parameters<Api["shippingMethod"]["find"]>[0], FindShippingMethodsParams>>,
  Assert<Equal<Parameters<Api["shippingProfile"]["find"]>[0], FindShippingProfilesParams>>,
  Assert<Equal<Parameters<Api["taxCategory"]["find"]>[0], FindTaxCategoriesParams>>,
  Assert<Equal<Parameters<Api["shippingMethod"]["getByKey"]>[0], StoreRecordByKeyParams>>,
  Assert<Equal<Awaited<ReturnType<Api["zone"]["delete"]>>, DeletedResponse>>,
  Assert<Equal<Awaited<ReturnType<Api["shippingMethod"]["delete"]>>, DeletedResponse>>,
  Assert<Equal<Awaited<ReturnType<Api["taxCategory"]["delete"]>>, DeletedResponse>>,
];
