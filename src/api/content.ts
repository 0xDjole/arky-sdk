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
  Entry,
  PublicEntry,
  FindCollectionEntryPageParams,
  FindCollectionsParams,
  FindEntriesParams,
  GetCollectionByKeyParams,
  GetCollectionCleanupParams,
  GetCollectionParams,
  GetEntryByKeyParams,
  GetEntryParams,
  UpdateCollectionParams,
  UpdateEntryParams,
} from "../types/content";
import { requireId } from "../utils/ids";
import { segment, tenantPath, tenantRecordPath } from "./paths";

export const createCollectionApi = (apiConfig: ApiConfig) => ({
  find(params: FindCollectionsParams, options?: RequestOptions): Promise<PaginatedResponse<PublicCollection>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<PublicCollection>>(tenantPath(tenant_id, "collections"), {
      ...options,
      params: query,
    });
  },

  get(params: GetCollectionParams, options?: RequestOptions): Promise<PublicCollection> {
    return apiConfig.httpClient.get<PublicCollection>(tenantRecordPath(params.tenant_id, "collections", params.id), options);
  },

  getByKey(params: GetCollectionByKeyParams, options?: RequestOptions): Promise<PublicCollection> {
    return apiConfig.httpClient.get<PublicCollection>(tenantPath(params.tenant_id, `collections/by-key/${segment(params.key)}`), options);
  },

  findEntries(params: FindCollectionEntryPageParams, options?: RequestOptions): Promise<PaginatedResponse<PublicEntry>> {
    return apiConfig.httpClient.get<PaginatedResponse<PublicEntry>>(`${tenantRecordPath(params.tenant_id, "collections", params.id)}/entries`, {
      ...options,
      params: { limit: params.limit, cursor: params.cursor },
    });
  },

  create(params: CreateCollectionParams, options?: RequestOptions): Promise<PublicCollection> {
    requireId(params.id, "collection");
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<PublicCollection>(tenantPath(tenant_id, "collections"), body, options);
  },

  update(params: UpdateCollectionParams, options?: RequestOptions): Promise<PublicCollection> {
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.put<PublicCollection>(tenantRecordPath(tenant_id, "collections", id), body, options);
  },

  delete(params: DeleteCollectionParams, options?: RequestOptions): Promise<PublicCollection> {
    return apiConfig.httpClient.delete<PublicCollection>(tenantRecordPath(params.tenant_id, "collections", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },

  getCleanup(params: GetCollectionCleanupParams, options?: RequestOptions): Promise<CollectionCleanup> {
    return apiConfig.httpClient.get<CollectionCleanup>(
      `${tenantRecordPath(params.tenant_id, "collections", params.id)}/cleanup`,
      options,
    );
  },
});

export const createEntryApi = (apiConfig: ApiConfig) => ({
  find(params: FindEntriesParams, options?: RequestOptions): Promise<PaginatedResponse<Entry>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<Entry>>(tenantPath(tenant_id, "entries"), { ...options, params: query });
  },

  get(params: GetEntryParams, options?: RequestOptions): Promise<PublicEntry> {
    return apiConfig.httpClient.get<PublicEntry>(tenantRecordPath(params.tenant_id, "entries", params.id), options);
  },

  getByKey(params: GetEntryByKeyParams, options?: RequestOptions): Promise<PublicEntry> {
    return apiConfig.httpClient.get<PublicEntry>(tenantPath(params.tenant_id, `entries/by-key/${segment(params.key)}`), {
      ...options,
      params: { collection_id: params.collection_id },
    });
  },

  create(params: CreateEntryParams, options?: RequestOptions): Promise<PublicEntry> {
    requireId(params.id, "entry");
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<PublicEntry>(tenantPath(tenant_id, "entries"), body, options);
  },

  update(params: UpdateEntryParams, options?: RequestOptions): Promise<PublicEntry> {
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.put<PublicEntry>(tenantRecordPath(tenant_id, "entries", id), body, options);
  },

  delete(params: DeleteEntryParams, options?: RequestOptions): Promise<DeletedResponse> {
    return apiConfig.httpClient.delete<DeletedResponse>(tenantRecordPath(params.tenant_id, "entries", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});
