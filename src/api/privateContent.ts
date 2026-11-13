import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { DeletedResponse, PaginatedResponse } from "../types/common";
import type {
  CreatePrivateCollectionParams,
  CreatePrivateEntryParams,
  DeletePrivateCollectionParams,
  DeletePrivateEntryParams,
  FindPrivateCollectionsParams,
  FindPrivateEntriesParams,
  FindSharedEntriesParams,
  GetPrivateCollectionParams,
  GetPrivateEntryParams,
  GetSharedEntryParams,
  PrintPrivateEntryParams,
  PrivateCollection,
  PrivateEntry,
  PrivateEntryFileLinkParams,
  PrivateFileLink,
  SharedEntryFileLinkParams,
  StorefrontSharedEntry,
  UpdatePrivateCollectionParams,
  UpdatePrivateEntryParams,
} from "../types/content";
import type { HttpClient } from "../types/httpClient";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath, storefrontBase } from "./paths";

function privateEntriesPath(storeId: string, collectionId: string): string {
  return `${storeRecordPath(storeId, "private-collections", collectionId)}/entries`;
}

export const createPrivateCollectionApi = (apiConfig: ApiConfig) => ({
  find(params: FindPrivateCollectionsParams, options?: RequestOptions): Promise<PaginatedResponse<PrivateCollection>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<PrivateCollection>>(storePath(store_id, "private-collections"), {
      ...options,
      params: query,
    });
  },

  get(params: GetPrivateCollectionParams, options?: RequestOptions): Promise<PrivateCollection> {
    return apiConfig.httpClient.get<PrivateCollection>(storeRecordPath(params.store_id, "private-collections", params.id), options);
  },

  create(params: CreatePrivateCollectionParams, options?: RequestOptions): Promise<PrivateCollection> {
    requireId(params.id, "collection");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<PrivateCollection>(storePath(store_id, "private-collections"), body, options);
  },

  update(params: UpdatePrivateCollectionParams, options?: RequestOptions): Promise<PrivateCollection> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<PrivateCollection>(storeRecordPath(store_id, "private-collections", id), body, options);
  },

  delete(params: DeletePrivateCollectionParams, options?: RequestOptions): Promise<PrivateCollection> {
    return apiConfig.httpClient.delete<PrivateCollection>(storeRecordPath(params.store_id, "private-collections", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});

export const createPrivateEntryApi = (apiConfig: ApiConfig) => ({
  find(params: FindPrivateEntriesParams, options?: RequestOptions): Promise<PaginatedResponse<PrivateEntry>> {
    const { store_id, collection_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<PrivateEntry>>(privateEntriesPath(store_id, collection_id), {
      ...options,
      params: query,
    });
  },

  get(params: GetPrivateEntryParams, options?: RequestOptions): Promise<PrivateEntry> {
    return apiConfig.httpClient.get<PrivateEntry>(`${privateEntriesPath(params.store_id, params.collection_id)}/${segment(params.id)}`, options);
  },

  create(params: CreatePrivateEntryParams, options?: RequestOptions): Promise<PrivateEntry> {
    requireId(params.id, "entry");
    const { store_id, collection_id, ...body } = params;
    return apiConfig.httpClient.post<PrivateEntry>(privateEntriesPath(store_id, collection_id), body, options);
  },

  update(params: UpdatePrivateEntryParams, options?: RequestOptions): Promise<PrivateEntry> {
    const { store_id, collection_id, id, ...body } = params;
    return apiConfig.httpClient.put<PrivateEntry>(`${privateEntriesPath(store_id, collection_id)}/${segment(id)}`, body, options);
  },

  delete(params: DeletePrivateEntryParams, options?: RequestOptions): Promise<DeletedResponse> {
    return apiConfig.httpClient.delete<DeletedResponse>(`${privateEntriesPath(params.store_id, params.collection_id)}/${segment(params.id)}`, {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },

  fileLink(params: PrivateEntryFileLinkParams, options?: RequestOptions): Promise<PrivateFileLink> {
    return apiConfig.httpClient.get<PrivateFileLink>(
      `${privateEntriesPath(params.store_id, params.collection_id)}/${segment(params.id)}/files/${segment(params.media_id)}`,
      { ...options, params: { variant: params.variant } },
    );
  },

  print(params: PrintPrivateEntryParams, options?: RequestOptions): Promise<PrivateEntry> {
    return apiConfig.httpClient.post<PrivateEntry>(
      `${privateEntriesPath(params.store_id, params.collection_id)}/${segment(params.id)}/print`,
      undefined,
      options,
    );
  },
});

export const createSharedEntriesApi = (httpClient: HttpClient) => ({
  find(params: FindSharedEntriesParams = {}, options?: RequestOptions): Promise<PaginatedResponse<StorefrontSharedEntry>> {
    return httpClient.get<PaginatedResponse<StorefrontSharedEntry>>(`${storefrontBase}/shared-entries`, { ...options, params });
  },

  get(params: GetSharedEntryParams, options?: RequestOptions): Promise<StorefrontSharedEntry> {
    return httpClient.get<StorefrontSharedEntry>(`${storefrontBase}/shared-entries/${segment(params.id)}`, options);
  },

  fileLink(params: SharedEntryFileLinkParams, options?: RequestOptions): Promise<PrivateFileLink> {
    return httpClient.get<PrivateFileLink>(`${storefrontBase}/shared-entries/${segment(params.id)}/files/${segment(params.media_id)}`, {
      ...options,
      params: { variant: params.variant },
    });
  },
});
