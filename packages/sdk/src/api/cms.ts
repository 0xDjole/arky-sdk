import type { ApiConfig } from '../index';

export const createCmsApi = (apiConfig: ApiConfig) => {
	const { httpClient, businessId } = apiConfig;

	return {
		async getCollection(id: string, options?: any) {
		return httpClient.get(`/v1/businesses/${businessId}/collections/${id}`, options);
	},

	async getCollections(params?: { name?: string; ids?: string[] }, options?: any) {
		return httpClient.get(`/v1/businesses/${businessId}/collections`, {
			params: { name: params?.name, ids: params?.ids },
			...options
		});
	},

	async getCollectionEntries(params: { collectionId: string; limit?: number; cursor?: string; ids?: string[] }, options?: any) {
		return httpClient.get(`/v1/businesses/${businessId}/collections/${params.collectionId}/entries`, {
			params: { limit: params.limit, cursor: params.cursor, ids: params.ids },
			...options
		});
	},

	async getCollectionEntry(params: { collectionId: string; id: string }, options?: any) {
		return httpClient.get(`/v1/businesses/${businessId}/collections/${params.collectionId}/entries/${params.id}`, options);
	},

	async createCollectionEntry(params: { collectionId: string; blocks?: any; data?: any }, options?: any) {
		const payload = params.blocks ? { blocks: params.blocks } : params.data || {};
		if (params.collectionId && !payload.collectionId) {
			payload.collectionId = params.collectionId;
		}
		return httpClient.post(
			`/v1/businesses/${businessId}/collections/${params.collectionId}/entries`,
			payload,
			options
		);
	}
	};
};
