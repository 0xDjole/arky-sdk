import type {
  Catalog,
  CatalogAccessLevel,
  FindPurchasableCatalogsParams,
  FindStorefrontCatalogsParams,
  StorefrontCatalog,
} from "arky-sdk";
import type { createAdmin } from "arky-sdk/admin";
import type { createStorefront, initialize } from "arky-sdk/storefront";
import type { StorefrontCatalog as PublicStorefrontCatalog } from "arky-sdk/types";

type AssertTrue<T extends true> = T;
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type AdminCatalogApi = ReturnType<typeof createAdmin>["eshop"]["catalog"];
type StorefrontCatalogApi = ReturnType<typeof createStorefront>["eshop"]["catalog"];
type FacadeCatalogApi = ReturnType<typeof initialize>["eshop"]["catalog"];

type PurchasableParams = AssertTrue<
  Same<Parameters<AdminCatalogApi["findPurchasable"]>[0], FindPurchasableCatalogsParams>
>;
type PurchasableAnswer = AssertTrue<
  Same<Awaited<ReturnType<AdminCatalogApi["findPurchasable"]>>, Catalog[]>
>;
type StorefrontAnswer = AssertTrue<
  Same<Awaited<ReturnType<StorefrontCatalogApi["find"]>>, StorefrontCatalog[]>
>;
type FacadeAnswer = AssertTrue<Same<Awaited<ReturnType<FacadeCatalogApi["find"]>>, StorefrontCatalog[]>>;
type StorefrontCatalogIsReadOnly = AssertTrue<Same<keyof StorefrontCatalogApi, "find">>;
type StorefrontCatalogShape = AssertTrue<Same<keyof StorefrontCatalog, "id" | "key" | "level">>;
type StorefrontCatalogLevel = AssertTrue<Same<StorefrontCatalog["level"], CatalogAccessLevel>>;
type PublicEntryParity = AssertTrue<Same<PublicStorefrontCatalog, StorefrontCatalog>>;

const personal: FindPurchasableCatalogsParams = {
  store_id: "store",
  market_id: "market",
  sales_channel_id: "channel",
  customer_id: "customer",
};
const company: FindPurchasableCatalogsParams = {
  ...personal,
  company_id: "company",
  company_location_id: "branch",
};
// @ts-expect-error A company buyer names its branch as well.
const companyWithoutBranch: FindPurchasableCatalogsParams = { ...personal, company_id: "company" };
// @ts-expect-error Purchasable catalogs are read for one sales channel.
const withoutChannel: FindPurchasableCatalogsParams = { store_id: "store", market_id: "market", customer_id: "customer" };
const anyone: FindStorefrontCatalogsParams = {};
const branch: FindStorefrontCatalogsParams = { company_id: "company", company_location_id: "branch" };
// @ts-expect-error A storefront company context names its branch as well.
const storefrontWithoutBranch: FindStorefrontCatalogsParams = { company_id: "company" };

export const buyerCatalogValues = [
  personal,
  company,
  companyWithoutBranch,
  withoutChannel,
  anyone,
  branch,
  storefrontWithoutBranch,
];

export type BuyerCatalogContracts = [
  PurchasableParams,
  PurchasableAnswer,
  StorefrontAnswer,
  FacadeAnswer,
  StorefrontCatalogIsReadOnly,
  StorefrontCatalogShape,
  StorefrontCatalogLevel,
  PublicEntryParity,
];
