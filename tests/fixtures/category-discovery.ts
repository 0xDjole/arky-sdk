import { createAdmin, createStorefront, epochMilliseconds, type Category, type CategoryEntry, type CategoryField, type CategoryFieldQuery, type CategoryStatus, type FindCategoriesParams, type UpdateCategoryParams, type CreateCategoryParams, type StorefrontGetCategoryParams, type StorefrontGetCategoryByKeyParams } from "../../dist/index.js";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type Field<T extends CategoryField["type"]> = Extract<CategoryField, { type: T }>;

const store_id = "4b6e2a91-0c5d-4f37-8a2e-1d9c7b3f5e08";
const admin = createAdmin({ baseUrl: "https://category.test" });
const storefront = createStorefront(`arky_pk_${"s".repeat(43)}`, { apiUrl: "https://category.test", market: "market-contract" });
const filters: FindCategoriesParams = { store_id, status: "active", sort_field: "key", cursor: null };
const list: Promise<{ items: Category[]; cursor: string | null }> = admin.category.find(filters);
const children: Promise<{ items: Category[]; cursor: string | null }> = admin.category.getChildren({ store_id, id: "parent", limit: 20, cursor: null });
const publicChildren: Promise<{ items: Category[]; cursor: string | null }> = storefront.category.getChildren({ id: "parent", cursor: null });
const bySlug: Promise<Category> = storefront.category.get({ slug: "topics" });
const byKey: Promise<Category> = storefront.category.getByKey({ key: "topics" });
const status: CategoryStatus = { type: "draft" };
const write: UpdateCategoryParams = { store_id, id: "category", expected_updated_at: epochMilliseconds(1), status: { type: "draft" } };
void [list, children, publicChildren, bySlug, byKey, status, write];

export type CategoryDiscoveryContracts = [
  Assert<Equal<UpdateCategoryParams["status"], { type: "active" } | { type: "draft" } | { type: "archived" } | undefined>>,
  Assert<Equal<FindCategoriesParams["status"], "active" | "draft" | "archived" | "deleting" | undefined>>,
  Assert<Equal<FindCategoriesParams["sort_field"], "key" | "status" | "created_at" | "updated_at" | undefined>>,
  Assert<RequiredField<FindCategoriesParams, "store_id">>,
  Assert<RequiredField<CreateCategoryParams, "id">>,
  Assert<RequiredField<UpdateCategoryParams, "expected_updated_at">>,
  Assert<Equal<Category["slugs"], Record<string, string>>>,
  Assert<Equal<Parameters<typeof storefront.category.get>[0], StorefrontGetCategoryParams>>,
  Assert<Equal<StorefrontGetCategoryParams, { id: string } | { slug: string }>>,
  Assert<Equal<keyof StorefrontGetCategoryByKeyParams, "key">>,
  Assert<Equal<Parameters<typeof storefront.category.getByKey>[0], StorefrontGetCategoryByKeyParams>>,
  Assert<Equal<CategoryEntry["fields"], CategoryField[]>>,
  Assert<Equal<CategoryField["type"], "select_one" | "select_many" | "number" | "boolean" | "geo_location">>,
  Assert<Equal<keyof Field<"select_one">, "type" | "field_id" | "option_key">>,
  Assert<Equal<keyof Field<"select_many">, "type" | "field_id" | "option_keys">>,
  Assert<Equal<keyof Field<"number">, "type" | "field_id" | "value">>,
  Assert<Missing<Field<"boolean">, "key">>,
  Assert<Missing<Field<"geo_location">, "key">>,
  Assert<Equal<Extract<CategoryFieldQuery, { type: "select" }>["key"], string>>,
];
