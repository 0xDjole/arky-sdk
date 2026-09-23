import { createAdmin, createStorefront, type Classification, type ClassificationStatus, type GetClassificationsParams, type UpdateClassificationParams } from "../../dist/index.js";
const admin = createAdmin({ baseUrl: "https://classification.test", storeId: "store", market: "market-contract" });
const storefront = createStorefront(`arky_pk_${"s".repeat(43)}`, { apiUrl: "https://classification.test", market: "market-contract" });
const filters: GetClassificationsParams = { status: "active", sort_field: "key", cursor: null };
const list: Promise<{ items: Classification[]; cursor: string | null }> = admin.classification.find(filters);
const children: Promise<{ items: Classification[]; cursor: string | null }> = admin.classification.getChildren({ id: "parent", limit: 20, cursor: null });
const publicChildren: Promise<{ items: Omit<Classification, "store_id">[]; cursor: string | null }> = storefront.classification.getChildren({ id: "parent", cursor: null });
const status: ClassificationStatus = { type: "draft" };
const write: UpdateClassificationParams = { id: "classification", status };
// @ts-expect-error Mutations require the tagged existing backend status.
const plainWrite: UpdateClassificationParams = { id: "classification", status: "draft" };
// @ts-expect-error Discovery filters remain plain strings.
const taggedFilter: GetClassificationsParams = { status };
// @ts-expect-error Only supported native sort fields are accepted.
const wrongSort: GetClassificationsParams = { sort_field: "schema" };
void [list, children, publicChildren, write, plainWrite, taggedFilter, wrongSort];
