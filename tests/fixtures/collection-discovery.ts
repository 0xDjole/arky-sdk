import { createAdmin, epochMilliseconds, type Collection, type CollectionStatus, type CreateCollectionParams,
  type GetCollectionsParams, type UpdateCollectionParams } from "../../dist/index.js";

const api = createAdmin({ baseUrl: "https://content.test", storeId: "store", market: "market-contract" }).content.collection;
const filters: GetCollectionsParams = { query: "guides", key: "guides", ids: ["collection"],
  status: "archived", sort_field: "key", sort_direction: "asc", limit: 1, cursor: null,
  created_at_from: epochMilliseconds(0), created_at_to: epochMilliseconds(2) };
const page: Promise<{ items: Collection[]; cursor: string | null }> = api.find(filters);
const status: CollectionStatus = { type: "archived" };
const create: CreateCollectionParams = { key: "guides", schema: [], blocks: [] };
const update: UpdateCollectionParams = { id: "collection", status };
// @ts-expect-error Collection writes require tagged editorial status.
const plainStatus: UpdateCollectionParams = { id: "collection", status: "archived" };
// @ts-expect-error Collection search takes the plain status filter, not a lifecycle object.
const objectFilter: GetCollectionsParams = { status };
// @ts-expect-error Only the supported native ordering fields are accepted.
const invalidOrder: GetCollectionsParams = { sort_field: "blocks" };
// @ts-expect-error Collection creation requires its explicit schema and Blocks.
const missingContent: CreateCollectionParams = { key: "guides" };
void [page, create, update, plainStatus, objectFilter, invalidOrder, missingContent];
