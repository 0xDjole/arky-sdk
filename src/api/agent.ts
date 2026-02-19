import type { ApiConfig } from '../index';
import type {
	CreateAgentParams,
	UpdateAgentParams,
	DeleteAgentParams,
	GetAgentParams,
	GetAgentsParams,
	SetupAgentWebhookParams,
	RunAgentParams,
	GetAgentMemoriesParams,
	DeleteAgentMemoryParams,
	RequestOptions
} from '../types/api';

export const createAgentApi = (apiConfig: ApiConfig) => {
	return {
		async createAgent(params: CreateAgentParams, options?: RequestOptions) {
			const businessId = params.businessId || apiConfig.businessId;
			return apiConfig.httpClient.post(
				`/v1/businesses/${businessId}/agents`,
				{ ...params, businessId },
				options
			);
		},

		async updateAgent(params: UpdateAgentParams, options?: RequestOptions) {
			return apiConfig.httpClient.put(
				`/v1/businesses/${apiConfig.businessId}/agents/${params.id}`,
				params,
				options
			);
		},

		async deleteAgent(params: DeleteAgentParams, options?: RequestOptions) {
			return apiConfig.httpClient.delete(
				`/v1/businesses/${apiConfig.businessId}/agents/${params.id}`,
				options
			);
		},

		async getAgent(params: GetAgentParams, options?: RequestOptions) {
			return apiConfig.httpClient.get(
				`/v1/businesses/${apiConfig.businessId}/agents/${params.id}`,
				options
			);
		},

		async getAgents(params?: GetAgentsParams, options?: RequestOptions) {
			const businessId = params?.businessId || apiConfig.businessId;
			const { businessId: _, ...queryParams } = params || {};
			return apiConfig.httpClient.get(`/v1/businesses/${businessId}/agents`, {
				...options,
				params: Object.keys(queryParams).length > 0 ? queryParams : undefined
			});
		},

		async setupWebhook(params: SetupAgentWebhookParams, options?: RequestOptions) {
			const businessId = params.businessId || apiConfig.businessId;
			return apiConfig.httpClient.post(
				`/v1/businesses/${businessId}/agents/${params.id}/webhook`,
				params,
				options
			);
		},

		async runAgent(params: RunAgentParams, options?: RequestOptions) {
			return apiConfig.httpClient.post(
				`/v1/businesses/${apiConfig.businessId}/agents/${params.id}/run`,
				{ message: params.message },
				options
			);
		},

		async getMemories(params: GetAgentMemoriesParams, options?: RequestOptions) {
			const queryParams: Record<string, string> = {};
			if (params.category) queryParams.category = params.category;
			if (params.limit) queryParams.limit = String(params.limit);
			return apiConfig.httpClient.get(
				`/v1/businesses/${apiConfig.businessId}/agents/${params.id}/memories`,
				{
					...options,
					params: Object.keys(queryParams).length > 0 ? queryParams : undefined
				}
			);
		},

		async deleteMemory(params: DeleteAgentMemoryParams, options?: RequestOptions) {
			return apiConfig.httpClient.delete(
				`/v1/businesses/${apiConfig.businessId}/agents/${params.id}/memories/${params.memoryId}`,
				options
			);
		}
	};
};
