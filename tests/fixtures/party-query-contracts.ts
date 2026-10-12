import type { createAdmin } from "arky-sdk/admin";
import type { createStorefront, initialize } from "arky-sdk/storefront";
import type { CommercePartyQuery, CompanyPartyQuery, EpochMilliseconds } from "arky-sdk";
import type { CommercePartyQuery as PublicCommercePartyQuery, CompanyPartyQuery as PublicCompanyPartyQuery } from "arky-sdk/types";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Takes<T, V> = [V] extends [T] ? true : false;
type Refuses<T, V> = [V] extends [T] ? false : true;
type Admin = ReturnType<typeof createAdmin>["eshop"];
type Shop = ReturnType<typeof createStorefront>["eshop"];
type Facade = ReturnType<typeof initialize>["eshop"];
type BothParties = { company_id: string; company_location_id: string };
type LocationOnly = { company_location_id: string };
type CompanyOnly = { company_id: string };

export type PartyQueryContracts = [
  Assert<Equal<CompanyPartyQuery, PublicCompanyPartyQuery>>,
  Assert<Equal<CommercePartyQuery, PublicCommercePartyQuery>>,
  Assert<Equal<keyof CompanyPartyQuery, "company_id" | "company_location_id">>,
  Assert<Equal<keyof CommercePartyQuery, "customer_id" | "company_id" | "company_location_id">>,
  Assert<Refuses<CompanyPartyQuery, BothParties>>,
  Assert<Takes<CompanyPartyQuery, {}>>,
  Assert<Takes<CompanyPartyQuery, CompanyOnly>>,
  Assert<Takes<CompanyPartyQuery, LocationOnly>>,
  Assert<Refuses<CommercePartyQuery, { customer_id: string; company_id: string }>>,
  Assert<Refuses<CommercePartyQuery, { customer_id: string; company_location_id: string }>>,
  Assert<Refuses<CommercePartyQuery, BothParties>>,
  Assert<Takes<CommercePartyQuery, { customer_id: string }>>,

  Assert<Refuses<Parameters<Shop["catalog"]["find"]>[0], BothParties>>,
  Assert<Refuses<Parameters<Shop["product"]["get"]>[0], { id: string; company_id: string; company_location_id: string }>>,
  Assert<Refuses<Parameters<Shop["product"]["getByKey"]>[0], { key: string; company_id: string; company_location_id: string }>>,
  Assert<Refuses<Parameters<Shop["product"]["find"]>[0], BothParties>>,
  Assert<Refuses<Parameters<Shop["productVariant"]["get"]>[0], { product_id: string; id: string; company_id: string; company_location_id: string }>>,
  Assert<Refuses<Parameters<Shop["productVariant"]["find"]>[0], { product_id: string; company_id: string; company_location_id: string }>>,
  Assert<Refuses<Parameters<Shop["bookingService"]["get"]>[0], { id: string; company_id: string; company_location_id: string }>>,
  Assert<Refuses<Parameters<Shop["bookingService"]["getByKey"]>[0], { key: string; company_id: string; company_location_id: string }>>,
  Assert<Refuses<Parameters<Shop["bookingService"]["find"]>[0], BothParties>>,
  Assert<Refuses<Parameters<Shop["bookingService"]["getAvailability"]>[0], { booking_service_id: string; from: EpochMilliseconds; to: EpochMilliseconds; company_id: string; company_location_id: string }>>,
  Assert<Refuses<Parameters<Shop["bookingOffering"]["find"]>[0], BothParties>>,
  Assert<Refuses<Parameters<Shop["customerGroup"]["find"]>[0], BothParties>>,
  Assert<Refuses<Parameters<Shop["customerGroup"]["get"]>[0], { identifier: string; company_id: string; company_location_id: string }>>,
  Assert<Refuses<Parameters<Facade["product"]["list"]>[0], BothParties>>,
  Assert<Refuses<Parameters<Facade["bookingService"]["list"]>[0], BothParties>>,
  Assert<Refuses<Parameters<Facade["bookingService"]["select"]>[1], BothParties>>,
  Assert<Refuses<Parameters<Facade["bookingService"]["getAvailability"]>[0], { booking_service_id: string; from: EpochMilliseconds; to: EpochMilliseconds; company_id: string; company_location_id: string }>>,
  Assert<Takes<Parameters<Shop["productVariant"]["get"]>[0], { product_id: string; id: string; catalog_id: string; company_location_id: string; include_price: true }>>,
  Assert<Takes<Parameters<Shop["bookingService"]["getAvailability"]>[0], { booking_service_id: string; from: EpochMilliseconds; to: EpochMilliseconds; company_location_id: string }>>,
  Assert<Takes<Parameters<Facade["bookingService"]["select"]>[1], LocationOnly>>,
  Assert<Refuses<Parameters<Admin["catalog"]["findPurchasable"]>[0], { store_id: string; market_id: string; sales_channel_id: string; customer_id: string; company_id: string; company_location_id: string }>>,
  Assert<Takes<Parameters<Admin["catalog"]["findPurchasable"]>[0], { store_id: string; market_id: string; sales_channel_id: string; customer_id: string; company_location_id: string }>>,
  Assert<Takes<Parameters<Admin["catalog"]["findPurchasable"]>[0], { store_id: string; market_id: string; sales_channel_id: string; customer_id: string }>>,

  Assert<Refuses<Parameters<Shop["order"]["find"]>[0], BothParties>>,
  Assert<Takes<Parameters<Shop["order"]["find"]>[0], { company_location_id: string; limit: number }>>,

  Assert<Refuses<Parameters<Shop["library"]["find"]>[0], BothParties>>,
  Assert<Refuses<Parameters<Shop["library"]["getProduct"]>[0], { product_id: string; company_id: string; company_location_id: string }>>,
  Assert<Refuses<Parameters<Shop["library"]["findAssets"]>[0], { product_id: string; company_id: string; company_location_id: string }>>,
  Assert<Refuses<Parameters<Shop["library"]["download"]>[0], { product_id: string; asset_id: string; reference: string; company_id: string; company_location_id: string }>>,
  Assert<Takes<Parameters<Shop["library"]["find"]>[0], {}>>,
  Assert<Takes<Parameters<Shop["library"]["find"]>[0], CompanyOnly>>,
  Assert<Takes<Parameters<Shop["library"]["getProduct"]>[0], { product_id: string; company_location_id: string }>>,
  Assert<Takes<Parameters<Shop["library"]["findAssets"]>[0], { product_id: string; company_location_id: string }>>,
  Assert<Takes<Parameters<Shop["library"]["download"]>[0], { product_id: string; asset_id: string; reference: string; company_location_id: string }>>,
  Assert<Takes<Parameters<Shop["library"]["download"]>[0], { product_id: string; asset_id: string; reference: string; company_id: string }>>,

  Assert<Refuses<Parameters<Admin["customerGroupMember"]["find"]>[0], { store_id: string; customer_id: string; company_id: string }>>,
  Assert<Refuses<Parameters<Admin["customerGroupMember"]["find"]>[0], { store_id: string; customer_id: string; company_location_id: string }>>,
  Assert<Refuses<Parameters<Admin["customerGroupMember"]["find"]>[0], { store_id: string; company_id: string; company_location_id: string }>>,
  Assert<Takes<Parameters<Admin["customerGroupMember"]["find"]>[0], { store_id: string; customer_id: string; customer_group_id: string }>>,
  Assert<Takes<Parameters<Admin["customerGroupMember"]["find"]>[0], { store_id: string; company_location_id: string; status: "active" }>>,
  Assert<Takes<Parameters<Admin["customerGroupMember"]["find"]>[0], { store_id: string }>>,
  Assert<Refuses<Parameters<Shop["customerGroupMember"]["find"]>[0], BothParties>>,
  Assert<Takes<Parameters<Shop["customerGroupMember"]["find"]>[0], { company_location_id: string; status: "active" }>>,

  Assert<Refuses<Parameters<Admin["paymentMethod"]["find"]>[0], { store_id: string; customer_id: string; payment_option_id: string }>>,
  Assert<Refuses<Parameters<Admin["paymentMethod"]["find"]>[0], { store_id: string; company_location_id: string; payment_option_id: string }>>,
  Assert<Refuses<Parameters<Admin["paymentMethod"]["find"]>[0], { store_id: string; customer_id: string; company_id: string }>>,
  Assert<Refuses<Parameters<Admin["paymentMethod"]["find"]>[0], { store_id: string; company_id: string; company_location_id: string }>>,
  Assert<Takes<Parameters<Admin["paymentMethod"]["find"]>[0], { store_id: string; payment_option_id: string; limit: number }>>,
  Assert<Takes<Parameters<Admin["paymentMethod"]["find"]>[0], { store_id: string; company_location_id: string }>>,
  Assert<Takes<Parameters<Admin["paymentMethod"]["find"]>[0], { store_id: string }>>,
  Assert<Refuses<Parameters<Shop["paymentMethod"]["find"]>[0], { customer_id: string; company_id: string }>>,
  Assert<Refuses<Parameters<Shop["paymentMethod"]["find"]>[0], BothParties>>,
  Assert<Takes<Parameters<Shop["paymentMethod"]["find"]>[0], { company_id: string; limit: number }>>,

  Assert<Refuses<Parameters<Shop["cart"]["offers"]>[0], BothParties>>,
  Assert<Refuses<Parameters<Shop["cart"]["offers"]>[0], { limit: number }>>,
  Assert<Takes<Parameters<Shop["cart"]["offers"]>[0], { company_location_id: string; limit: number }>>,
  Assert<Refuses<Parameters<Shop["minimumProgress"]["get"]>[0], { customer_id: string; company_id: string }>>,
  Assert<Refuses<Parameters<Shop["minimumProgress"]["get"]>[0], BothParties>>,
  Assert<Refuses<Parameters<Admin["minimumProgress"]["get"]>[0], { store_id: string; company_id: string; company_location_id: string }>>,
  Assert<Takes<Parameters<Admin["minimumProgress"]["get"]>[0], { store_id: string; company_location_id: string }>>,
];
