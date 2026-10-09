import type {
  Catalog,
  CatalogAccessLevel,
  CatalogReadOptions,
  GetStorefrontBookingServiceByKeyParams,
  GetStorefrontProductByKeyParams,
  StorefrontBookingService,
  StorefrontProduct,
  FindPurchasableCatalogsParams,
  FindStorefrontCatalogsParams,
  StorefrontCatalog,
} from "arky-sdk";
import type { createAdmin } from "arky-sdk/admin";
import type { createStorefront, initialize } from "arky-sdk/storefront";
import type { StorefrontCatalog as PublicStorefrontCatalog } from "arky-sdk/types";

type AssertTrue<T extends true> = T;
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type AdminCatalogApi = ReturnType<typeof createAdmin>["eshop"]["catalog"];
type StorefrontCatalogApi = ReturnType<typeof createStorefront>["eshop"]["catalog"];
type FacadeCatalogApi = ReturnType<typeof initialize>["eshop"]["catalog"];
type StorefrontEshop = ReturnType<typeof createStorefront>["eshop"];
type FacadeEshop = ReturnType<typeof initialize>["eshop"];

const personal: FindPurchasableCatalogsParams = {
  store_id: "5e9b3d71-c826-4a04-b7f5-0d2a8e6c4f19",
  market_id: "9c1d5e83-4a27-4f60-b8e2-6d3a0f7c1b94",
  sales_channel_id: "e5a8c2d7-3b91-4f06-9d4e-1c7b6a0f3e28",
  customer_id: "6c1f4e2a-9b37-4d85-a0c6-2e7b9d1f3a58",
};
const company: FindPurchasableCatalogsParams = {
  ...personal,
  company_id: "f581728f-8a86-4598-b27b-ef5ea7636277",
  company_location_id: "8c68fc2e-57b6-44fc-8f9c-6cbd1c76dbcf",
};
const anyone: FindStorefrontCatalogsParams = {};
const branch: FindStorefrontCatalogsParams = { company_id: company.company_id, company_location_id: company.company_location_id };

export const buyerCatalogValues = [personal, company, anyone, branch];

export type BuyerCatalogContracts = [
  AssertTrue<Same<Parameters<AdminCatalogApi["findPurchasable"]>[0], FindPurchasableCatalogsParams>>,
  AssertTrue<Same<Awaited<ReturnType<AdminCatalogApi["findPurchasable"]>>, Catalog[]>>,
  AssertTrue<Same<Awaited<ReturnType<StorefrontCatalogApi["find"]>>, StorefrontCatalog[]>>,
  AssertTrue<Same<Awaited<ReturnType<FacadeCatalogApi["find"]>>, StorefrontCatalog[]>>,
  AssertTrue<Same<keyof StorefrontCatalogApi, "find">>,
  AssertTrue<Same<keyof StorefrontCatalog, "id" | "key" | "level">>,
  AssertTrue<Same<StorefrontCatalog["level"], CatalogAccessLevel>>,
  AssertTrue<Same<PublicStorefrontCatalog, StorefrontCatalog>>,
  AssertTrue<RequiredField<FindPurchasableCatalogsParams, "sales_channel_id">>,
  AssertTrue<RequiredField<FindPurchasableCatalogsParams, "market_id">>,
  AssertTrue<RequiredField<FindPurchasableCatalogsParams, "customer_id">>,
  AssertTrue<Same<keyof FindStorefrontCatalogsParams, "company_id" | "company_location_id">>,
  AssertTrue<Same<Parameters<StorefrontEshop["product"]["getByKey"]>[0], GetStorefrontProductByKeyParams>>,
  AssertTrue<Same<Awaited<ReturnType<StorefrontEshop["product"]["getByKey"]>>, StorefrontProduct>>,
  AssertTrue<Same<Parameters<StorefrontEshop["bookingService"]["getByKey"]>[0], GetStorefrontBookingServiceByKeyParams>>,
  AssertTrue<Same<Awaited<ReturnType<StorefrontEshop["bookingService"]["getByKey"]>>, StorefrontBookingService>>,
  AssertTrue<Same<keyof GetStorefrontProductByKeyParams, "key" | keyof CatalogReadOptions>>,
  AssertTrue<RequiredField<GetStorefrontProductByKeyParams, "key">>,
  AssertTrue<Same<FacadeEshop["product"]["getByKey"], StorefrontEshop["product"]["getByKey"]>>,
  AssertTrue<Same<FacadeEshop["bookingService"]["getByKey"], StorefrontEshop["bookingService"]["getByKey"]>>,
];
