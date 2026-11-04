import type {
  Package,
  PackageAccessLevel,
  PackageContext,
  GetStorefrontBookingServiceByKeyParams,
  GetStorefrontProductByKeyParams,
  StorefrontBookingService,
  StorefrontProduct,
  FindPurchasablePackagesParams,
  FindStorefrontPackagesParams,
  PaginatedResponse,
  StorefrontPackageChoice,
} from "arky-sdk";
import type { createAdmin } from "arky-sdk/admin";
import type { createStorefront, initialize } from "arky-sdk/storefront";
import type { StorefrontPackageChoice as PublicStorefrontPackage } from "arky-sdk/types";

type AssertTrue<T extends true> = T;
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type AdminPackageApi = ReturnType<typeof createAdmin>["eshop"]["package"];
type StorefrontPackageApi = ReturnType<typeof createStorefront>["eshop"]["package"];
type FacadePackageApi = ReturnType<typeof initialize>["eshop"]["package"];
type StorefrontEshop = ReturnType<typeof createStorefront>["eshop"];
type FacadeEshop = ReturnType<typeof initialize>["eshop"];

const buyer = {
  store_id: "5e9b3d71-c826-4a04-b7f5-0d2a8e6c4f19",
  market_id: "9c1d5e83-4a27-4f60-b8e2-6d3a0f7c1b94",
  sales_channel_id: "e5a8c2d7-3b91-4f06-9d4e-1c7b6a0f3e28",
  customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58",
};
const customer: FindPurchasablePackagesParams = buyer;
const company: FindPurchasablePackagesParams = { ...buyer, company_id: "f581728f-8a86-4598-b27b-ef5ea7636277" };
const location: FindPurchasablePackagesParams = { ...buyer, company_location_id: "8c68fc2e-57b6-44fc-8f9c-6cbd1c76dbcf" };
const anyone: FindStorefrontPackagesParams = {};
const storefrontLocation: FindStorefrontPackagesParams = { company_location_id: location.company_location_id };

export const buyerPackageValues = [customer, company, location, anyone, storefrontLocation];

export type BuyerPackageContracts = [
  AssertTrue<Same<Parameters<AdminPackageApi["findPurchasable"]>[0], FindPurchasablePackagesParams>>,
  AssertTrue<Same<Awaited<ReturnType<AdminPackageApi["findPurchasable"]>>, PaginatedResponse<Package>>>,
  AssertTrue<Same<Awaited<ReturnType<StorefrontPackageApi["find"]>>, PaginatedResponse<StorefrontPackageChoice>>>,
  AssertTrue<Same<Awaited<ReturnType<FacadePackageApi["find"]>>, PaginatedResponse<StorefrontPackageChoice>>>,
  AssertTrue<Same<keyof StorefrontPackageApi, "find" | "get" | "getByKey" | "getProductChoices" | "joinFree">>,
  AssertTrue<Same<keyof StorefrontPackageChoice, "id" | "key" | "level">>,
  AssertTrue<Same<StorefrontPackageChoice["level"], PackageAccessLevel>>,
  AssertTrue<Same<PublicStorefrontPackage, StorefrontPackageChoice>>,
  AssertTrue<RequiredField<FindPurchasablePackagesParams, "sales_channel_id">>,
  AssertTrue<RequiredField<FindPurchasablePackagesParams, "market_id">>,
  AssertTrue<RequiredField<FindPurchasablePackagesParams, "customer_id">>,
  AssertTrue<Same<keyof FindStorefrontPackagesParams, "company_id" | "company_location_id">>,
  AssertTrue<Same<Parameters<StorefrontEshop["product"]["getByKey"]>[0], GetStorefrontProductByKeyParams>>,
  AssertTrue<Same<Awaited<ReturnType<StorefrontEshop["product"]["getByKey"]>>, StorefrontProduct>>,
  AssertTrue<Same<Parameters<StorefrontEshop["bookingService"]["getByKey"]>[0], GetStorefrontBookingServiceByKeyParams>>,
  AssertTrue<Same<Awaited<ReturnType<StorefrontEshop["bookingService"]["getByKey"]>>, StorefrontBookingService>>,
  AssertTrue<Same<keyof GetStorefrontProductByKeyParams, "key" | keyof PackageContext>>,
  AssertTrue<Same<keyof GetStorefrontBookingServiceByKeyParams, "key" | keyof PackageContext>>,
  AssertTrue<RequiredField<GetStorefrontProductByKeyParams, "key">>,
  AssertTrue<Same<FacadeEshop["product"]["getByKey"], StorefrontEshop["product"]["getByKey"]>>,
  AssertTrue<Same<FacadeEshop["bookingService"]["getByKey"], StorefrontEshop["bookingService"]["getByKey"]>>,
];
