import { createAdmin, createStorefront, type Entry, type FindEntriesParams, type UpdateEntryParams,
  type CreateEntryParams, type FindEntryBySlugParams, type StorefrontFindEntriesParams, type StorefrontFindEntryBySlugParams } from "../../dist/index.js";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;

const store_id = "7a3f9e21-5c84-4d06-b2e9-0f1d6c8a4b73";
const api = createAdmin({ baseUrl: "https://entry.test" });
const discovery = { collection_id: "collection", query: "heading",
  sort_field: "key", sort_direction: "asc", limit: 1, cursor: null,
  filters: [{ type: "text", key: "heading", values: ["Exact title"] }] } satisfies StorefrontFindEntriesParams;
const query: FindEntriesParams = { store_id, status: "active", ...discovery };
const page: Promise<{ items: Entry[]; cursor: string | null }> = api.content.entry.find(query);
const storefront = createStorefront(`arky_pk_${"s".repeat(43)}`, { apiUrl: "https://entry.test", market: "market-contract" });
const cursor: Promise<string | null> = storefront.content.entry.find(discovery).then((result) => result.cursor);
const bySlug: Promise<Entry | null> = storefront.content.entry.findBySlug({ collection_id: "collection", slug: "guide" });
void [page, cursor, bySlug];

export type EntryDiscoveryContracts = [
  Assert<RequiredField<FindEntriesParams, "collection_id">>,
  Assert<RequiredField<StorefrontFindEntriesParams, "collection_id">>,
  Assert<Missing<StorefrontFindEntriesParams, "language">>,
  Assert<Missing<StorefrontFindEntriesParams, "status">>,
  Assert<Missing<FindEntriesParams, "ids">>,
  Assert<Missing<FindEntriesParams, "slug">>,
  Assert<Equal<keyof StorefrontFindEntryBySlugParams, "collection_id" | "slug">>,
  Assert<Equal<keyof FindEntryBySlugParams, "store_id" | "collection_id" | "slug" | "language">>,
  Assert<RequiredField<FindEntryBySlugParams, "language">>,
  Assert<Equal<FindEntriesParams["sort_field"], "key" | "status" | "created_at" | "updated_at" | undefined>>,
  Assert<RequiredField<CreateEntryParams, "id">>,
  Assert<RequiredField<CreateEntryParams, "slugs">>,
  Assert<RequiredField<CreateEntryParams, "blocks">>,
  Assert<Equal<UpdateEntryParams["status"], { type: "active" } | { type: "draft" } | { type: "archived" } | undefined>>,
  Assert<RequiredField<UpdateEntryParams, "expected_updated_at">>,
];
