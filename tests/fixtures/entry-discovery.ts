import { createAdmin, createStorefront, type CollectionEntry, type GetEntriesParams, type UpdateEntryParams,
  type CreateEntryParams } from "../../dist/index.js";

const api = createAdmin({ baseUrl: "https://entry.test", storeId: "store", market: "market-contract" });
const query: GetEntriesParams = { collection_id: "collection", query: "heading", status: "active",
  sort_field: "key", sort_direction: "asc", limit: 1, cursor: null,
  filters: [{ type: "text", key: "heading", values: ["Exact title"] }] };
const page: Promise<{ items: CollectionEntry[]; cursor: string | null }> = api.content.entry.find(query);
const storefront = createStorefront(`arky_pk_${"s".repeat(43)}`, { apiUrl: "https://entry.test", market: "market-contract" });
const cursor: Promise<string | null> = storefront.content.entry.find(query).then(page => page.cursor);
const create: CreateEntryParams = { collection_id: "collection", key: "guide", slug: {}, blocks: [] };
const update: UpdateEntryParams = { id: "entry", status: { type: "archived" } };
// @ts-expect-error Tagged lifecycle is a write/record value, not a query filter.
const objectStatus: GetEntriesParams = { collection_id: "collection", status: { type: "active" } };
// @ts-expect-error Exact ID batches use findByIds, not paginated discovery.
const ids: GetEntriesParams = { collection_id: "collection", ids: ["entry"] };
// @ts-expect-error Arbitrary Block values are not native order fields.
const sort: GetEntriesParams = { collection_id: "collection", sort_field: "blocks" };
// @ts-expect-error Creation requires the explicit slug map and Blocks.
const missing: CreateEntryParams = { collection_id: "collection", key: "guide" };
// @ts-expect-error Status writes use the canonical tagged value.
const plainStatus: UpdateEntryParams = { id: "entry", status: "active" };
void [page, cursor, create, update, objectStatus, ids, sort, missing, plainStatus];
