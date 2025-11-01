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
  SubscribeToCollectionParams,
  UnsubscribeFromCollectionParams,
  RequestOptions,
} from "../types/api";

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
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/collections/${params.id}`,
        options
      );
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
    // Note: Backend uses /entries NOT /collections/{id}/entries

    async getCollectionEntries(
      params: GetEntriesParams,
      options?: RequestOptions
    ) {
      const { collectionId, ...queryParams } = params;

      // Convert collectionId to owner format if provided
      const finalParams = collectionId
        ? { ...queryParams, owner: `collection:${collectionId}` }
        : queryParams;

      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/entries`,
        {
          ...options,
          params: finalParams,
        }
      );
    },

    async createCollectionEntry(
      params: CreateEntryParams,
      options?: RequestOptions
    ) {
      const { collectionId, owner, ...rest } = params;

      // Convert collectionId to owner format if provided
      const payload = {
        ...rest,
        owner:
          owner || (collectionId ? `collection:${collectionId}` : undefined),
      };

      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/entries`,
        payload,
        options
      );
    },

    async updateCollectionEntry(
      params: UpdateEntryParams,
      options?: RequestOptions
    ) {
      const { id, collectionId, owner, ...rest } = params;

      // Convert collectionId to owner format if provided
      const payload = {
        ...rest,
        owner:
          owner || (collectionId ? `collection:${collectionId}` : undefined),
      };

      return apiConfig.httpClient.put(
        `/v1/businesses/${apiConfig.businessId}/entries/${id}`,
        payload,
        options
      );
    },

    async deleteCollectionEntry(
      params: DeleteCollectionEntryParams,
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.delete(
        `/v1/businesses/${apiConfig.businessId}/entries/${params.id}`,
        options
      );
    },

    async getCollectionEntry(
      params: GetCollectionEntryParams,
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/entries/${params.id}`,
        options
      );
    },

    async sendEntry(params: SendEntryParams, options?: RequestOptions) {
      const { entryId, scheduledAt } = params;

      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/entries/${entryId}/send`,
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
        `/v1/collections/entry-types/${params.entryType}/variables`,
        options
      );
    },

    // ===== COLLECTION SUBSCRIPTIONS =====

    async getCollectionSubscribers(
      params: GetCollectionSubscribersParams,
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/collections/${params.id}/subscribers`,
        options
      );
    },

    async subscribeToCollection(
      params: SubscribeToCollectionParams,
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/collections/${params.collectionId}/subscribe`,
        {
          email: params.email,
          market: apiConfig.market,
          planId: params.planId,
        },
        options
      );
    },

    async unsubscribeFromCollection(
      params: UnsubscribeFromCollectionParams,
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.get(`/v1/businesses/${apiConfig.businessId}/collections/unsubscribe`, {
        ...options,
        params,
      });
    },
  };
};
