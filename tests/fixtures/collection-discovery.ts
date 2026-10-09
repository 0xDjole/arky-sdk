import { createAdmin, epochMilliseconds, type Collection, type CollectionStatus, type CreateCollectionParams,
  type FindCollectionsParams, type UpdateCollectionParams } from "../../dist/index.js";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;

const store_id = "7a3f9e21-5c84-4d06-b2e9-0f1d6c8a4b73";
const api = createAdmin({ baseUrl: "https://content.test" }).content.collection;
const filters: FindCollectionsParams = { store_id, query: "guides", key: "guides", ids: ["collection"],
  status: "archived", sort_field: "key", sort_direction: "asc", limit: 1, cursor: null,
  created_at_from: epochMilliseconds(0), created_at_to: epochMilliseconds(2) };
const page: Promise<{ items: Collection[]; cursor: string | null }> = api.find(filters);
const status: CollectionStatus = { type: "archived" };
const create: CreateCollectionParams = { store_id, id: "2c4e6a8b-0d1f-4a3c-9e5b-7d9f1b3d5e6a", key: "guides", schema: [], blocks: [] };
const update: UpdateCollectionParams = { store_id, id: "collection", expected_updated_at: epochMilliseconds(1), status: { type: "archived" } };
void [page, status, create, update];

export type CollectionDiscoveryContracts = [
  Assert<Equal<UpdateCollectionParams["status"], { type: "active" } | { type: "draft" } | { type: "archived" } | undefined>>,
  Assert<Equal<FindCollectionsParams["status"], "active" | "draft" | "archived" | "deleting" | undefined>>,
  Assert<Equal<FindCollectionsParams["sort_field"], "key" | "status" | "created_at" | "updated_at" | undefined>>,
  Assert<RequiredField<CreateCollectionParams, "id">>,
  Assert<RequiredField<CreateCollectionParams, "schema">>,
  Assert<RequiredField<CreateCollectionParams, "blocks">>,
  Assert<RequiredField<CreateCollectionParams, "store_id">>,
  Assert<RequiredField<UpdateCollectionParams, "expected_updated_at">>,
];
