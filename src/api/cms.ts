import type { ApiConfig } from '../index';
import type {
    GetCollectionEntriesParams,
    CreateCollectionEntryParams,
    RequestOptions
} from '../types/api';

export const createCmsApi = (apiConfig: ApiConfig) => {
    return {
        async getCollection(id: string, options?: RequestOptions) {
            return apiConfig.httpClient.get(
                `/v1/businesses/${apiConfig.businessId}/collections/${id}`,
                options
            );
        },

        async getCollections(params?: { name?: string; ids?: string[] }, options?: RequestOptions) {
            const queryParams = params ? { ...params } : {};

            return apiConfig.httpClient.get(
                `/v1/businesses/${apiConfig.businessId}/collections`,
                {
                    ...options,
                    params: queryParams
                }
            );
        },

        async getCollectionEntries(params: GetCollectionEntriesParams, options?: RequestOptions) {
            const { collectionId, ...queryParams } = params;

            return apiConfig.httpClient.get(
                `/v1/businesses/${apiConfig.businessId}/collections/${collectionId}/entries`,
                {
                    ...options,
                    params: queryParams
                }
            );
        },

        async getCollectionEntry(params: { collectionId: string; id: string }, options?: RequestOptions) {
            const { collectionId, id } = params;

            return apiConfig.httpClient.get(
                `/v1/businesses/${apiConfig.businessId}/collections/${collectionId}/entries/${id}`,
                options
            );
        },

        async createCollectionEntry(params: CreateCollectionEntryParams, options?: RequestOptions) {
            const { collectionId, blocks, status } = params;

            const payload = {
                businessId: apiConfig.businessId,
                blocks,
                ...(status && { status })
            };

            return apiConfig.httpClient.post(
                `/v1/businesses/${apiConfig.businessId}/collections/${collectionId}/entries`,
                payload,
                options
            );
        }
    };
};
