import { createAdmin, createStorefront, type Category, type CategoryStatus, type GetCategoriesParams, type UpdateCategoryParams } from "../../dist/index.js";
const store_id = "4b6e2a91-0c5d-4f37-8a2e-1d9c7b3f5e08";
const admin = createAdmin({ baseUrl: "https://category.test", market: "market-contract" });
const storefront = createStorefront(`arky_pk_${"s".repeat(43)}`, { apiUrl: "https://category.test", market: "market-contract" });
const filters: GetCategoriesParams = { store_id, status: "active", sort_field: "key", cursor: null };
const list: Promise<{ items: Category[]; cursor: string | null }> = admin.category.find(filters);
const children: Promise<{ items: Category[]; cursor: string | null }> = admin.category.getChildren({ store_id, id: "parent", limit: 20, cursor: null });
const publicChildren: Promise<{ items: Omit<Category, "store_id">[]; cursor: string | null }> = storefront.category.getChildren({ id: "parent", cursor: null });
const status: CategoryStatus = { type: "draft" };
const write: UpdateCategoryParams = { store_id, id: "category", status };
// @ts-expect-error Mutations require the tagged existing backend status.
const plainWrite: UpdateCategoryParams = { store_id, id: "category", status: "draft" };
// @ts-expect-error Discovery filters remain plain strings.
const taggedFilter: GetCategoriesParams = { store_id, status };
// @ts-expect-error Only supported native sort fields are accepted.
const wrongSort: GetCategoriesParams = { store_id, sort_field: "schema" };
// @ts-expect-error
const implicitStore: GetCategoriesParams = { status: "active" };
void [list, children, publicChildren, write, plainWrite, taggedFilter, wrongSort, implicitStore];
