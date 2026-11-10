import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { DeletedResponse, PaginatedResponse } from "../types/common";
import type {
  PublicCollection,
  CollectionCleanup,
  CreateCollectionParams,
  CreateEntryParams,
  DeleteCollectionParams,
  DeleteEntryParams,
  PublicEntry,
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
  find(params: FindCollectionsParams, options?: RequestOptions): Promise<PaginatedResponse<PublicCollection>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<PublicCollection>>(storePath(store_id, "collections"), {
      ...options,
      params: query,
    });
  },

  get(params: GetCollectionParams, options?: RequestOptions): Promise<PublicCollection> {
    return apiConfig.httpClient.get<PublicCollection>(storeRecordPath(params.store_id, "collections", params.id), options);
  },

  getByKey(params: GetCollectionByKeyParams, options?: RequestOptions): Promise<PublicCollection> {
    return apiConfig.httpClient.get<PublicCollection>(storePath(params.store_id, `collections/by-key/${segment(params.key)}`), options);
  },

  create(params: CreateCollectionParams, options?: RequestOptions): Promise<PublicCollection> {
    requireId(params.id, "collection");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<PublicCollection>(storePath(store_id, "collections"), body, options);
  },

  update(params: UpdateCollectionParams, options?: RequestOptions): Promise<PublicCollection> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<PublicCollection>(storeRecordPath(store_id, "collections", id), body, options);
  },

  delete(params: DeleteCollectionParams, options?: RequestOptions): Promise<PublicCollection> {
    return apiConfig.httpClient.delete<PublicCollection>(storeRecordPath(params.store_id, "collections", params.id), {
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
  find(params: FindEntriesParams, options?: RequestOptions): Promise<PaginatedResponse<PublicEntry>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<PublicEntry>>(storePath(store_id, "entries"), { ...options, params: query });
  },

  get(params: GetEntryParams, options?: RequestOptions): Promise<PublicEntry> {
    return apiConfig.httpClient.get<PublicEntry>(storeRecordPath(params.store_id, "entries", params.id), options);
  },

  create(params: CreateEntryParams, options?: RequestOptions): Promise<PublicEntry> {
    requireId(params.id, "entry");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<PublicEntry>(storePath(store_id, "entries"), body, options);
  },

  update(params: UpdateEntryParams, options?: RequestOptions): Promise<PublicEntry> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<PublicEntry>(storeRecordPath(store_id, "entries", id), body, options);
  },

  delete(params: DeleteEntryParams, options?: RequestOptions): Promise<DeletedResponse> {
    return apiConfig.httpClient.delete<DeletedResponse>(storeRecordPath(params.store_id, "entries", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});
