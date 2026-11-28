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
  GetPrivateCollectionByKeyParams,
  GetPrivateCollectionParams,
  GetPrivateEntryParams,
  PrintPrivateEntryParams,
  PrivateCollection,
  PrivateEntry,
  PrivateEntryFileLinkParams,
  PrivateFileLink,
  StorefrontUserEntry,
  StorefrontUserEntryFileLinkParams,
  StorefrontFindUserEntriesParams,
  StorefrontGetUserEntryParams,
  UpdatePrivateCollectionParams,
  UpdatePrivateEntryParams,
} from "../types/content";
import type { HttpClient } from "../types/httpClient";
import { requireId } from "../utils/ids";
import { segment, tenantPath, tenantRecordPath, storefrontBase } from "./paths";

function privateEntriesPath(tenantId: string, collectionId: string): string {
  return `${tenantRecordPath(tenantId, "private-collections", collectionId)}/entries`;
}

export const createPrivateCollectionApi = (apiConfig: ApiConfig) => ({
  find(params: FindPrivateCollectionsParams, options?: RequestOptions): Promise<PaginatedResponse<PrivateCollection>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<PrivateCollection>>(tenantPath(tenant_id, "private-collections"), {
      ...options,
      params: query,
    });
  },

  get(params: GetPrivateCollectionParams, options?: RequestOptions): Promise<PrivateCollection> {
    return apiConfig.httpClient.get<PrivateCollection>(tenantRecordPath(params.tenant_id, "private-collections", params.id), options);
  },

  getByKey(params: GetPrivateCollectionByKeyParams, options?: RequestOptions): Promise<PrivateCollection> {
    return apiConfig.httpClient.get<PrivateCollection>(tenantPath(params.tenant_id, `private-collections/by-key/${segment(params.key)}`), options);
  },

  create(params: CreatePrivateCollectionParams, options?: RequestOptions): Promise<PrivateCollection> {
    requireId(params.id, "collection");
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<PrivateCollection>(tenantPath(tenant_id, "private-collections"), body, options);
  },

  update(params: UpdatePrivateCollectionParams, options?: RequestOptions): Promise<PrivateCollection> {
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.put<PrivateCollection>(tenantRecordPath(tenant_id, "private-collections", id), body, options);
  },

  delete(params: DeletePrivateCollectionParams, options?: RequestOptions): Promise<PrivateCollection> {
    return apiConfig.httpClient.delete<PrivateCollection>(tenantRecordPath(params.tenant_id, "private-collections", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});

export const createPrivateEntryApi = (apiConfig: ApiConfig) => ({
  find(params: FindPrivateEntriesParams, options?: RequestOptions): Promise<PaginatedResponse<PrivateEntry>> {
    const { tenant_id, collection_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<PrivateEntry>>(privateEntriesPath(tenant_id, collection_id), {
      ...options,
      params: query,
    });
  },

  get(params: GetPrivateEntryParams, options?: RequestOptions): Promise<PrivateEntry> {
    return apiConfig.httpClient.get<PrivateEntry>(`${privateEntriesPath(params.tenant_id, params.collection_id)}/${segment(params.id)}`, options);
  },

  create(params: CreatePrivateEntryParams, options?: RequestOptions): Promise<PrivateEntry> {
    requireId(params.id, "entry");
    const { tenant_id, collection_id, ...body } = params;
    return apiConfig.httpClient.post<PrivateEntry>(privateEntriesPath(tenant_id, collection_id), body, options);
  },

  update(params: UpdatePrivateEntryParams, options?: RequestOptions): Promise<PrivateEntry> {
    const { tenant_id, collection_id, id, ...body } = params;
    return apiConfig.httpClient.put<PrivateEntry>(`${privateEntriesPath(tenant_id, collection_id)}/${segment(id)}`, body, options);
  },

  delete(params: DeletePrivateEntryParams, options?: RequestOptions): Promise<DeletedResponse> {
    return apiConfig.httpClient.delete<DeletedResponse>(`${privateEntriesPath(params.tenant_id, params.collection_id)}/${segment(params.id)}`, {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },

  fileLink(params: PrivateEntryFileLinkParams, options?: RequestOptions): Promise<PrivateFileLink> {
    return apiConfig.httpClient.get<PrivateFileLink>(
      `${privateEntriesPath(params.tenant_id, params.collection_id)}/${segment(params.id)}/files/${segment(params.media_id)}`,
      { ...options, params: { variant: params.variant } },
    );
  },

  print(params: PrintPrivateEntryParams, options?: RequestOptions): Promise<PrivateEntry> {
    return apiConfig.httpClient.post<PrivateEntry>(
      `${privateEntriesPath(params.tenant_id, params.collection_id)}/${segment(params.id)}/print`,
      undefined,
      options,
    );
  },
});

export const createUserEntriesApi = (httpClient: HttpClient) => ({
  find(
    params: StorefrontFindUserEntriesParams = {},
    options?: RequestOptions,
  ): Promise<PaginatedResponse<StorefrontUserEntry>> {
    return httpClient.get<PaginatedResponse<StorefrontUserEntry>>(`${storefrontBase}/user-entries`, { ...options, params });
  },

  get(params: StorefrontGetUserEntryParams, options?: RequestOptions): Promise<StorefrontUserEntry> {
    return httpClient.get<StorefrontUserEntry>(`${storefrontBase}/user-entries/${segment(params.id)}`, options);
  },

  fileLink(params: StorefrontUserEntryFileLinkParams, options?: RequestOptions): Promise<PrivateFileLink> {
    return httpClient.get<PrivateFileLink>(`${storefrontBase}/user-entries/${segment(params.id)}/files/${segment(params.media_id)}`, {
      ...options,
      params: { variant: params.variant },
    });
  },
});
