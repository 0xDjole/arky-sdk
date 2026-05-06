import type { ApiConfig } from '../index';
import type {
	CreateAgentParams,
	UpdateAgentParams,
	DeleteAgentParams,
	GetAgentParams,
	GetAgentsParams,
	RunAgentParams,
	GetAgentChatsParams,
	GetStoreChatsParams,
	GetAgentChatParams,
	UpdateAgentChatParams,
	RateAgentChatParams,
	RequestOptions
} from '../types/api';

export const createAgentApi = (apiConfig: ApiConfig) => {
	return {
		async createAgent(params: CreateAgentParams, options?: RequestOptions) {
			const { store_id, ...payload } = params;
			const target_store_id = store_id || apiConfig.storeId;
			return apiConfig.httpClient.post(
				`/v1/stores/${target_store_id}/agents`,
				{ ...payload, store_id: target_store_id },
				options
			);
		},

		async updateAgent(params: UpdateAgentParams, options?: RequestOptions) {
			const { store_id, id, ...payload } = params;
			const target_store_id = store_id || apiConfig.storeId;
			return apiConfig.httpClient.put(
				`/v1/stores/${target_store_id}/agents/${id}`,
				payload,
				options
			);
		},

		async deleteAgent(params: DeleteAgentParams, options?: RequestOptions) {
			const store_id = params.store_id || apiConfig.storeId;
			return apiConfig.httpClient.delete(
				`/v1/stores/${store_id}/agents/${params.id}`,
				options
			);
		},

		async getAgent(params: GetAgentParams, options?: RequestOptions) {
			const store_id = params.store_id || apiConfig.storeId;
			return apiConfig.httpClient.get(
				`/v1/stores/${store_id}/agents/${params.id}`,
				options
			);
		},

		async getAgents(params?: GetAgentsParams, options?: RequestOptions) {
			const store_id = params?.store_id || apiConfig.storeId;
			const { store_id: _, ...queryParams } = params || {};
			return apiConfig.httpClient.get(`/v1/stores/${store_id}/agents`, {
				...options,
				params: Object.keys(queryParams).length > 0 ? queryParams : undefined
			});
		},

		async sendMessage(params: RunAgentParams, options?: RequestOptions) {
			const store_id = params.store_id || apiConfig.storeId;
			const body: Record<string, any> = { message: params.message };
			if (params.chat_id) body.chat_id = params.chat_id;
			if (params.direct) body.direct = params.direct;
			return apiConfig.httpClient.post(
				`/v1/stores/${store_id}/agents/${params.id}/chats/messages`,
				body,
				options
			);
		},

		async getChats(params: GetAgentChatsParams, options?: RequestOptions) {
			const store_id = params.store_id || apiConfig.storeId;
			const queryParams: Record<string, string> = {};
			if (params.limit) queryParams.limit = String(params.limit);
			if (params.cursor) queryParams.cursor = params.cursor;
			return apiConfig.httpClient.get(
				`/v1/stores/${store_id}/agents/${params.id}/chats`,
				{
					...options,
					params: Object.keys(queryParams).length > 0 ? queryParams : undefined
				}
			);
		},

		async getChat(params: GetAgentChatParams, options?: RequestOptions) {
			const store_id = params.store_id || apiConfig.storeId;
			return apiConfig.httpClient.get(
				`/v1/stores/${store_id}/agents/${params.id}/chats/${params.chat_id}`,
				options
			);
		},

		async updateChat(params: UpdateAgentChatParams, options?: RequestOptions) {
			const store_id = params.store_id || apiConfig.storeId;
			return apiConfig.httpClient.put(
				`/v1/stores/${store_id}/agents/${params.id}/chats/${params.chat_id}`,
				{ status: params.status },
				options
			);
		},

		async rateChat(params: RateAgentChatParams, options?: RequestOptions) {
			const store_id = params.store_id || apiConfig.storeId;
			const body: Record<string, any> = { rating: params.rating };
			if (params.comment) body.comment = params.comment;
			return apiConfig.httpClient.post(
				`/v1/stores/${store_id}/agents/${params.id}/chats/${params.chat_id}/rate`,
				body,
				options
			);
		},

		async getStoreChats(params: GetStoreChatsParams, options?: RequestOptions) {
			const store_id = params.store_id || apiConfig.storeId;
			const { store_id: _, ...queryParams } = params;
			return apiConfig.httpClient.get(`/v1/stores/${store_id}/chats`, {
				...options,
				params: Object.keys(queryParams).length > 0 ? queryParams : undefined
			});
		},

		async getChatMessages(params: GetAgentChatParams & { limit?: number }, options?: RequestOptions) {
			const store_id = params.store_id || apiConfig.storeId;
			const queryParams: Record<string, string> = {};
			if (params.limit) queryParams.limit = String(params.limit);
			return apiConfig.httpClient.get(
				`/v1/stores/${store_id}/agents/${params.id}/chats/${params.chat_id}/messages`,
				{
					...options,
					params: Object.keys(queryParams).length > 0 ? queryParams : undefined
				}
			);
		},


	};
};
