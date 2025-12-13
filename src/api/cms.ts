import type { ApiConfig } from "../index";
import type {
  CreateCollectionParams,
  UpdateCollectionParams,
  DeleteCollectionParams,
  GetCollectionParams,
  GetCollectionsParams,
  GetEntriesParams,
  CreateEntryParams,
  UpdateEntryParams,
  GetCollectionEntryParams,
  DeleteCollectionEntryParams,
  GenerateBlocksParams,
  GetVariableMetadataParams,
  SendEntryParams,
  GetCollectionSubscribersParams,
  RequestOptions,
} from "../types/api";
import { formatIdOrSlug } from "../utils/slug";
import {
  getBlockFromArray,
  getBlockObjectValues,
  getImageUrl,
} from "../utils/blocks";

export const createCmsApi = (apiConfig: ApiConfig) => {
  return {
    // ===== COLLECTIONS =====

    async createCollection(
      params: CreateCollectionParams,
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/collections`,
        params,
        options
      );
    },

    async updateCollection(
      params: UpdateCollectionParams,
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.put(
        `/v1/businesses/${apiConfig.businessId}/collections/${params.id}`,
        params,
        options
      );
    },

    async deleteCollection(
      params: DeleteCollectionParams,
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.delete(
        `/v1/businesses/${apiConfig.businessId}/collections/${params.id}`,
        options
      );
    },

    async getCollection(params: GetCollectionParams, options?: RequestOptions) {
      const formattedId = formatIdOrSlug(params.id, apiConfig);
      const response = await apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/collections/${formattedId}`,
        options
      );

      // Add helper methods that automatically use SDK's current locale
      return {
        ...response,
        getBlock(key: string) {
          return getBlockFromArray(response, key, apiConfig.locale);
        },
        getBlockValues(key: string) {
          return getBlockObjectValues(response, key, apiConfig.locale);
        },
        getImage(key: string) {
          const block = getBlockFromArray(response, key, apiConfig.locale);
          return getImageUrl(block, true);
        },
      };
    },

    async getCollections(
      params: GetCollectionsParams,
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/collections`,
        {
          ...options,
          params,
        }
      );
    },

    async generateBlocks(
      params: GenerateBlocksParams,
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/collections/blocks/generate`,
        params,
        options
      );
    },

    // ===== ENTRIES =====

    async getCollectionEntries(
      params: GetEntriesParams,
      options?: RequestOptions
    ) {
      const { collectionId, ...queryParams } = params;
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/collections/${collectionId}/entries`,
        {
          ...options,
          params: queryParams,
        }
      );
    },

    async createCollectionEntry(
      params: CreateEntryParams,
      options?: RequestOptions
    ) {
      const { collectionId, ...payload } = params;
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/collections/${collectionId}/entries`,
        { ...payload, collectionId },
        options
      );
    },

    async updateCollectionEntry(
      params: UpdateEntryParams,
      options?: RequestOptions
    ) {
      const { collectionId, id, ...payload } = params;

      return apiConfig.httpClient.put(
        `/v1/businesses/${apiConfig.businessId}/collections/${collectionId}/entries/${id}`,
        { ...payload, collectionId },
        options
      );
    },

    async deleteCollectionEntry(
      params: DeleteCollectionEntryParams,
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.delete(
        `/v1/businesses/${apiConfig.businessId}/collections/${params.collectionId}/entries/${params.id}`,
        options
      );
    },

    async getCollectionEntry(
      params: GetCollectionEntryParams,
      options?: RequestOptions
    ) {
      const formattedId = formatIdOrSlug(params.id, apiConfig);
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/collections/${params.collectionId}/entries/${formattedId}`,
        options
      );
    },

    async sendEntry(params: SendEntryParams, options?: RequestOptions) {
      const { collectionId, entryId, scheduledAt } = params;

      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/collections/${collectionId}/entries/${entryId}/send`,
        {
          businessId: apiConfig.businessId,
          entryId,
          scheduledAt: scheduledAt ?? Math.floor(Date.now() / 1000),
        },
        options
      );
    },

    // ===== VARIABLES / METADATA =====

    async getVariableMetadata(
      params: GetVariableMetadataParams,
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/collections/types/${params.entryType}/variables`,
        options
      );
    },

    // ===== COLLECTION SUBSCRIPTIONS =====

    async getCollectionSubscribers(
      params: GetCollectionSubscribersParams,
      options?: RequestOptions
    ) {
      const formattedId = formatIdOrSlug(params.id, apiConfig);
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/collections/${formattedId}/subscribers`,
        options
      );
    },
  };
};
