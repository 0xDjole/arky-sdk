import { createAdmin, createStorefront, type Category, type CategoryStatus, type GetCategoriesParams, type UpdateCategoryParams } from "../../dist/index.js";
const admin = createAdmin({ baseUrl: "https://category.test", storeId: "store", market: "market-contract" });
const storefront = createStorefront(`arky_pk_${"s".repeat(43)}`, { apiUrl: "https://category.test", market: "market-contract" });
const filters: GetCategoriesParams = { status: "active", sort_field: "key", cursor: null };
const list: Promise<{ items: Category[]; cursor: string | null }> = admin.category.find(filters);
const children: Promise<{ items: Category[]; cursor: string | null }> = admin.category.getChildren({ id: "parent", limit: 20, cursor: null });
const publicChildren: Promise<{ items: Omit<Category, "store_id">[]; cursor: string | null }> = storefront.category.getChildren({ id: "parent", cursor: null });
const status: CategoryStatus = { type: "draft" };
const write: UpdateCategoryParams = { id: "category", status };
// @ts-expect-error Mutations require the tagged existing backend status.
const plainWrite: UpdateCategoryParams = { id: "category", status: "draft" };
// @ts-expect-error Discovery filters remain plain strings.
const taggedFilter: GetCategoriesParams = { status };
// @ts-expect-error Only supported native sort fields are accepted.
const wrongSort: GetCategoriesParams = { sort_field: "schema" };
void [list, children, publicChildren, write, plainWrite, taggedFilter, wrongSort];
