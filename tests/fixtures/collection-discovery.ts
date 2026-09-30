import { createAdmin, epochMilliseconds, type Collection, type CollectionStatus, type CreateCollectionParams,
  type GetCollectionsParams, type UpdateCollectionParams } from "../../dist/index.js";

const store_id = "7a3f9e21-5c84-4d06-b2e9-0f1d6c8a4b73";
const api = createAdmin({ baseUrl: "https://content.test", market: "market-contract" }).content.collection;
const filters: GetCollectionsParams = { store_id, query: "guides", key: "guides", ids: ["collection"],
  status: "archived", sort_field: "key", sort_direction: "asc", limit: 1, cursor: null,
  created_at_from: epochMilliseconds(0), created_at_to: epochMilliseconds(2) };
const page: Promise<{ items: Collection[]; cursor: string | null }> = api.find(filters);
const status: CollectionStatus = { type: "archived" };
const create: CreateCollectionParams = { store_id, key: "guides", schema: [], blocks: [] };
const update: UpdateCollectionParams = { store_id, id: "collection", status };
// @ts-expect-error Collection writes require tagged editorial status.
const plainStatus: UpdateCollectionParams = { store_id, id: "collection", status: "archived" };
// @ts-expect-error Collection search takes the plain status filter, not a lifecycle object.
const objectFilter: GetCollectionsParams = { store_id, status };
// @ts-expect-error Only the supported native ordering fields are accepted.
const invalidOrder: GetCollectionsParams = { store_id, sort_field: "blocks" };
// @ts-expect-error Collection creation requires its explicit schema and Blocks.
const missingContent: CreateCollectionParams = { store_id, key: "guides" };
// @ts-expect-error
const missingStore: CreateCollectionParams = { key: "guides", schema: [], blocks: [] };
void [page, create, update, plainStatus, objectFilter, invalidOrder, missingContent, missingStore];
