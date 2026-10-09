import type {
  CatalogReadOptions,
  FindStorefrontProductVariantsParams,
  GetStorefrontProductParams,
  GetStorefrontProductVariantParams,
  StorefrontPrice,
  StorefrontProduct,
  StorefrontProductVariant,
} from "arky-sdk";
import type { FindStorefrontProductVariantsParams as PublicFind, GetStorefrontProductVariantParams as PublicGet } from "arky-sdk/types";
import type { createStorefront } from "arky-sdk/storefront";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type Client = ReturnType<typeof createStorefront>;

export type StorefrontVariantContracts = [
  Assert<Equal<FindStorefrontProductVariantsParams, PublicFind>>,
  Assert<Equal<GetStorefrontProductVariantParams, PublicGet>>,
  Assert<Equal<StorefrontProduct["price"], StorefrontPrice | null>>,
  Assert<Equal<StorefrontProductVariant["price"], StorefrontPrice | null>>,
  Assert<Missing<StorefrontProduct, "purchase_allowed" | "variants">>,
  Assert<Missing<FindStorefrontProductVariantsParams, "store_id">>,
  Assert<Equal<Parameters<Client["eshop"]["productVariant"]["find"]>[0], FindStorefrontProductVariantsParams>>,
  Assert<Equal<Awaited<ReturnType<Client["eshop"]["productVariant"]["get"]>>, StorefrontProductVariant>>,
  Assert<Equal<Parameters<Client["eshop"]["product"]["get"]>[0], GetStorefrontProductParams>>,
  Assert<Equal<Exclude<keyof GetStorefrontProductParams, keyof CatalogReadOptions>, "id" | "slug">>,
  Assert<Missing<Client["eshop"]["product"], "getInventory">>,
  Assert<Missing<Client["eshop"], "digital" | "digitalProduct">>,
];
