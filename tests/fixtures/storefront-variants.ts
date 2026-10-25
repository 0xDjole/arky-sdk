import type {
  CatalogContext,
  CatalogReadOptions,
  GetStorefrontProductParams,
  GetStorefrontProductVariantParams,
  StorefrontPrice,
  StorefrontProduct,
  StorefrontProductVariant,
  Product,
  ProductVariant,
  CreateProductParams,
  CreateProductVariantParams,
  UpdateProductParams,
  UpdateProductVariantParams,
  FindProductsParams,
} from "arky-sdk";
import type { GetStorefrontProductVariantParams as PublicGet } from "arky-sdk/types";
import type { createStorefront } from "arky-sdk/storefront";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type Client = ReturnType<typeof createStorefront>;

export type StorefrontVariantContracts = [
  Assert<Missing<Product, "options">>,
  Assert<Missing<CreateProductParams, "options">>,
  Assert<Missing<UpdateProductParams, "options">>,
  Assert<Missing<CreateProductVariantParams, "options">>,
  Assert<Missing<UpdateProductVariantParams, "options">>,
  Assert<Missing<ProductVariant, "options" | "options_valid">>,
  Assert<Missing<StorefrontProductVariant, "options">>,
  Assert<Missing<StorefrontProduct, "options" | "price">>,
  Assert<Missing<FindProductsParams, "price_filter">>,
  Assert<Equal<FindProductsParams["sort_field"], "key" | "created_at" | "updated_at" | "status" | undefined>>,
  Assert<Missing<ProductVariant, "attributes">>,
  Assert<Equal<CatalogReadOptions["catalog_id"], string>>,
  Assert<Equal<GetStorefrontProductVariantParams, PublicGet>>,
  Assert<Equal<StorefrontProduct["catalog_item_id"], string>>,
  Assert<Equal<StorefrontProductVariant["catalog_item_id"], string>>,
  Assert<Equal<StorefrontProductVariant["price"], StorefrontPrice | null>>,
  Assert<Missing<StorefrontProduct, "purchase_allowed" | "variants">>,
  Assert<Missing<Client["eshop"]["productVariant"], "find">>,
  Assert<Missing<Client["eshop"]["product"], "find">>,
  Assert<Equal<Awaited<ReturnType<Client["eshop"]["productVariant"]["get"]>>, StorefrontProductVariant>>,
  Assert<Equal<Parameters<Client["eshop"]["product"]["get"]>[0], GetStorefrontProductParams>>,
  Assert<Equal<Exclude<keyof Extract<GetStorefrontProductParams, { id: string }>, keyof CatalogContext>, "id">>,
  Assert<Equal<Exclude<keyof Extract<GetStorefrontProductParams, { slug: string }>, keyof CatalogContext>, "slug">>,
  Assert<Missing<Extract<GetStorefrontProductParams, { id: string }>, "include_price">>,
  Assert<Missing<Client["eshop"]["product"], "getInventory">>,
  Assert<Missing<Client["eshop"], "digital" | "digitalProduct">>,
];
