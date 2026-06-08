import type { ApiConfig } from "../index";
import type {
  CreateCollectionParams,
  UpdateCollectionParams,
  DeleteCollectionParams,
  GetCollectionParams,
  GetCollectionsParams,
  CreateEntryParams,
  UpdateEntryParams,
  DeleteEntryParams,
  GetEntryParams,
  GetEntriesParams,
  RequestOptions,
} from "../types/api";
import type { Collection, CollectionEntry, PaginatedResponse } from "../types";

export const createCmsApi = (apiConfig: ApiConfig) => {
  return {
    async createCollection(params: CreateCollectionParams, options?: RequestOptions): Promise<Collection> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Collection>(
        `/v1/stores/${target_store_id}/collections`,
        payload,
        options
      );
    },

    async updateCollection(params: UpdateCollectionParams, options?: RequestOptions): Promise<Collection> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<Collection>(
        `/v1/stores/${target_store_id}/collections/${params.id}`,
        payload,
        options
      );
    },

    async deleteCollection(params: DeleteCollectionParams, options?: RequestOptions): Promise<boolean> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<boolean>(
        `/v1/stores/${target_store_id}/collections/${params.id}`,
        options
      );
    },

    async getCollection(params: GetCollectionParams, options?: RequestOptions): Promise<Collection> {
      const target_store_id = params.store_id || apiConfig.storeId;
      let identifier: string;
      if (params.id) {
        identifier = params.id;
      } else if (params.key) {
        identifier = `${target_store_id}:${params.key}`;
      } else {
        throw new Error("GetCollectionParams requires id or key");
      }

      return apiConfig.httpClient.get<Collection>(
        `/v1/stores/${target_store_id}/collections/${identifier}`,
        options
      );
    },

    async getCollections(params: GetCollectionsParams = {}, options?: RequestOptions): Promise<PaginatedResponse<Collection>> {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<Collection>>(
        `/v1/stores/${target_store_id}/collections`,
        {
          ...options,
          params: queryParams,
        }
      );
    },

    async createEntry(params: CreateEntryParams, options?: RequestOptions): Promise<CollectionEntry> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<CollectionEntry>(
        `/v1/stores/${target_store_id}/entries`,
        payload,
        options
      );
    },

    async updateEntry(params: UpdateEntryParams, options?: RequestOptions): Promise<CollectionEntry> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<CollectionEntry>(
        `/v1/stores/${target_store_id}/entries/${params.id}`,
        payload,
        options
      );
    },

    async deleteEntry(params: DeleteEntryParams, options?: RequestOptions): Promise<boolean> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<boolean>(
        `/v1/stores/${target_store_id}/entries/${params.id}`,
        options
      );
    },

    async getEntry(params: GetEntryParams, options?: RequestOptions): Promise<CollectionEntry> {
      const target_store_id = params.store_id || apiConfig.storeId;
      if (!params.id) {
        throw new Error("GetEntryParams requires id");
      }
      return apiConfig.httpClient.get<CollectionEntry>(
        `/v1/stores/${target_store_id}/entries/${params.id}`,
        options
      );
    },

    async getEntries(params: GetEntriesParams, options?: RequestOptions): Promise<PaginatedResponse<CollectionEntry>> {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<CollectionEntry>>(
        `/v1/stores/${target_store_id}/entries`,
        {
          ...options,
          params: queryParams,
        }
      );
    },
  };
};
