import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { DeletedResponse, PaginatedResponse } from "../types/common";
import type {
  Collection,
  CollectionCleanup,
  CreateCollectionParams,
  CreateEntryParams,
  DeleteCollectionParams,
  DeleteEntryParams,
  Entry,
  FindCollectionsParams,
  FindEntriesParams,
  GetCollectionByKeyParams,
  GetCollectionCleanupParams,
  GetCollectionParams,
  GetEntryParams,
  UpdateCollectionParams,
  UpdateEntryParams,
} from "../types/content";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";

export const createCollectionApi = (apiConfig: ApiConfig) => ({
  find(params: FindCollectionsParams, options?: RequestOptions): Promise<PaginatedResponse<Collection>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<Collection>>(storePath(store_id, "collections"), {
      ...options,
      params: query,
    });
  },

  get(params: GetCollectionParams, options?: RequestOptions): Promise<Collection> {
    return apiConfig.httpClient.get<Collection>(storeRecordPath(params.store_id, "collections", params.id), options);
  },

  getByKey(params: GetCollectionByKeyParams, options?: RequestOptions): Promise<Collection> {
    return apiConfig.httpClient.get<Collection>(storePath(params.store_id, `collections/by-key/${segment(params.key)}`), options);
  },

  create(params: CreateCollectionParams, options?: RequestOptions): Promise<Collection> {
    requireId(params.id, "collection");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<Collection>(storePath(store_id, "collections"), body, options);
  },

  update(params: UpdateCollectionParams, options?: RequestOptions): Promise<Collection> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<Collection>(storeRecordPath(store_id, "collections", id), body, options);
  },

  delete(params: DeleteCollectionParams, options?: RequestOptions): Promise<Collection> {
    return apiConfig.httpClient.delete<Collection>(storeRecordPath(params.store_id, "collections", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },

  getCleanup(params: GetCollectionCleanupParams, options?: RequestOptions): Promise<CollectionCleanup> {
    return apiConfig.httpClient.get<CollectionCleanup>(
      `${storeRecordPath(params.store_id, "collections", params.id)}/cleanup`,
      options,
    );
  },
});

export const createEntryApi = (apiConfig: ApiConfig) => ({
  find(params: FindEntriesParams, options?: RequestOptions): Promise<PaginatedResponse<Entry>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<Entry>>(storePath(store_id, "entries"), { ...options, params: query });
  },

  get(params: GetEntryParams, options?: RequestOptions): Promise<Entry> {
    return apiConfig.httpClient.get<Entry>(storeRecordPath(params.store_id, "entries", params.id), options);
  },

  create(params: CreateEntryParams, options?: RequestOptions): Promise<Entry> {
    requireId(params.id, "entry");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<Entry>(storePath(store_id, "entries"), body, options);
  },

  update(params: UpdateEntryParams, options?: RequestOptions): Promise<Entry> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<Entry>(storeRecordPath(store_id, "entries", id), body, options);
  },

  delete(params: DeleteEntryParams, options?: RequestOptions): Promise<DeletedResponse> {
    return apiConfig.httpClient.delete<DeletedResponse>(storeRecordPath(params.store_id, "entries", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});
