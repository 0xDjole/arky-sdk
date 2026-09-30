import { createAdmin, createStorefront, type CollectionEntry, type GetEntriesParams, type UpdateEntryParams,
  type CreateEntryParams } from "../../dist/index.js";

const store_id = "7a3f9e21-5c84-4d06-b2e9-0f1d6c8a4b73";
const api = createAdmin({ baseUrl: "https://entry.test", market: "market-contract" });
const discovery = { collection_id: "collection", query: "heading", status: "active",
  sort_field: "key", sort_direction: "asc", limit: 1, cursor: null,
  filters: [{ type: "text", key: "heading", values: ["Exact title"] }] } satisfies Omit<GetEntriesParams, "store_id">;
const query: GetEntriesParams = { store_id, ...discovery };
const page: Promise<{ items: CollectionEntry[]; cursor: string | null }> = api.content.entry.find(query);
const storefront = createStorefront(`arky_pk_${"s".repeat(43)}`, { apiUrl: "https://entry.test", market: "market-contract" });
const cursor: Promise<string | null> = storefront.content.entry.find(discovery).then(page => page.cursor);
const create: CreateEntryParams = { store_id, collection_id: "collection", key: "guide", slug: {}, blocks: [] };
const update: UpdateEntryParams = { store_id, id: "entry", status: { type: "archived" } };
// @ts-expect-error Tagged lifecycle is a write/record value, not a query filter.
const objectStatus: GetEntriesParams = { store_id, collection_id: "collection", status: { type: "active" } };
// @ts-expect-error Exact ID batches use findByIds, not paginated discovery.
const ids: GetEntriesParams = { store_id, collection_id: "collection", ids: ["entry"] };
// @ts-expect-error Arbitrary Block values are not native order fields.
const sort: GetEntriesParams = { store_id, collection_id: "collection", sort_field: "blocks" };
// @ts-expect-error Creation requires the explicit slug map and Blocks.
const missing: CreateEntryParams = { store_id, collection_id: "collection", key: "guide" };
// @ts-expect-error Status writes use the canonical tagged value.
const plainStatus: UpdateEntryParams = { store_id, id: "entry", status: "active" };
void [page, cursor, create, update, objectStatus, ids, sort, missing, plainStatus];
