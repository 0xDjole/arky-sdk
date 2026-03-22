import type { ApiConfig } from '../index';
import type {
	CreateAgentParams,
	UpdateAgentParams,
	DeleteAgentParams,
	GetAgentParams,
	GetAgentsParams,
	RunAgentParams,
	GetAgentChatsParams,
	GetBusinessChatsParams,
	GetAgentChatParams,
	UpdateAgentChatParams,
	RateAgentChatParams,
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

		async sendMessage(params: RunAgentParams, options?: RequestOptions) {
			const body: Record<string, any> = { message: params.message };
			if (params.chatId) body.chatId = params.chatId;
			if (params.direct) body.direct = params.direct;
			return apiConfig.httpClient.post(
				`/v1/businesses/${apiConfig.businessId}/agents/${params.id}/chats/messages`,
				body,
				options
			);
		},

		async getChats(params: GetAgentChatsParams, options?: RequestOptions) {
			const queryParams: Record<string, string> = {};
			if (params.limit) queryParams.limit = String(params.limit);
			if (params.cursor) queryParams.cursor = params.cursor;
			return apiConfig.httpClient.get(
				`/v1/businesses/${apiConfig.businessId}/agents/${params.id}/chats`,
				{
					...options,
					params: Object.keys(queryParams).length > 0 ? queryParams : undefined
				}
			);
		},

		async getChat(params: GetAgentChatParams, options?: RequestOptions) {
			return apiConfig.httpClient.get(
				`/v1/businesses/${apiConfig.businessId}/agents/${params.id}/chats/${params.chatId}`,
				options
			);
		},

		async updateChat(params: UpdateAgentChatParams, options?: RequestOptions) {
			return apiConfig.httpClient.put(
				`/v1/businesses/${apiConfig.businessId}/agents/${params.id}/chats/${params.chatId}`,
				{ status: params.status },
				options
			);
		},

		async rateChat(params: RateAgentChatParams, options?: RequestOptions) {
			const body: Record<string, any> = { rating: params.rating };
			if (params.comment) body.comment = params.comment;
			return apiConfig.httpClient.post(
				`/v1/businesses/${apiConfig.businessId}/agents/${params.id}/chats/${params.chatId}/rate`,
				body,
				options
			);
		},

		async getBusinessChats(params: GetBusinessChatsParams, options?: RequestOptions) {
			const businessId = params.businessId || apiConfig.businessId;
			const { businessId: _, ...queryParams } = params;
			return apiConfig.httpClient.get(`/v1/businesses/${businessId}/chats`, {
				...options,
				params: Object.keys(queryParams).length > 0 ? queryParams : undefined
			});
		},

		async getChatMessages(params: GetAgentChatParams & { limit?: number }, options?: RequestOptions) {
			const queryParams: Record<string, string> = {};
			if (params.limit) queryParams.limit = String(params.limit);
			return apiConfig.httpClient.get(
				`/v1/businesses/${apiConfig.businessId}/agents/${params.id}/chats/${params.chatId}/messages`,
				{
					...options,
					params: Object.keys(queryParams).length > 0 ? queryParams : undefined
				}
			);
		},


	};
};
