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
			const { business_id, ...payload } = params;
			const target_business_id = business_id || apiConfig.businessId;
			return apiConfig.httpClient.post(
				`/v1/businesses/${target_business_id}/agents`,
				{ ...payload, business_id: target_business_id },
				options
			);
		},

		async updateAgent(params: UpdateAgentParams, options?: RequestOptions) {
			const { business_id, id, ...payload } = params;
			const target_business_id = business_id || apiConfig.businessId;
			return apiConfig.httpClient.put(
				`/v1/businesses/${target_business_id}/agents/${id}`,
				payload,
				options
			);
		},

		async deleteAgent(params: DeleteAgentParams, options?: RequestOptions) {
			const business_id = params.business_id || apiConfig.businessId;
			return apiConfig.httpClient.delete(
				`/v1/businesses/${business_id}/agents/${params.id}`,
				options
			);
		},

		async getAgent(params: GetAgentParams, options?: RequestOptions) {
			const business_id = params.business_id || apiConfig.businessId;
			return apiConfig.httpClient.get(
				`/v1/businesses/${business_id}/agents/${params.id}`,
				options
			);
		},

		async getAgents(params?: GetAgentsParams, options?: RequestOptions) {
			const business_id = params?.business_id || apiConfig.businessId;
			const { business_id: _, ...queryParams } = params || {};
			return apiConfig.httpClient.get(`/v1/businesses/${business_id}/agents`, {
				...options,
				params: Object.keys(queryParams).length > 0 ? queryParams : undefined
			});
		},

		async sendMessage(params: RunAgentParams, options?: RequestOptions) {
			const business_id = params.business_id || apiConfig.businessId;
			const body: Record<string, any> = { message: params.message };
			if (params.chat_id) body.chat_id = params.chat_id;
			if (params.direct) body.direct = params.direct;
			return apiConfig.httpClient.post(
				`/v1/businesses/${business_id}/agents/${params.id}/chats/messages`,
				body,
				options
			);
		},

		async getChats(params: GetAgentChatsParams, options?: RequestOptions) {
			const business_id = params.business_id || apiConfig.businessId;
			const queryParams: Record<string, string> = {};
			if (params.limit) queryParams.limit = String(params.limit);
			if (params.cursor) queryParams.cursor = params.cursor;
			return apiConfig.httpClient.get(
				`/v1/businesses/${business_id}/agents/${params.id}/chats`,
				{
					...options,
					params: Object.keys(queryParams).length > 0 ? queryParams : undefined
				}
			);
		},

		async getChat(params: GetAgentChatParams, options?: RequestOptions) {
			const business_id = params.business_id || apiConfig.businessId;
			return apiConfig.httpClient.get(
				`/v1/businesses/${business_id}/agents/${params.id}/chats/${params.chat_id}`,
				options
			);
		},

		async updateChat(params: UpdateAgentChatParams, options?: RequestOptions) {
			const business_id = params.business_id || apiConfig.businessId;
			return apiConfig.httpClient.put(
				`/v1/businesses/${business_id}/agents/${params.id}/chats/${params.chat_id}`,
				{ status: params.status },
				options
			);
		},

		async rateChat(params: RateAgentChatParams, options?: RequestOptions) {
			const business_id = params.business_id || apiConfig.businessId;
			const body: Record<string, any> = { rating: params.rating };
			if (params.comment) body.comment = params.comment;
			return apiConfig.httpClient.post(
				`/v1/businesses/${business_id}/agents/${params.id}/chats/${params.chat_id}/rate`,
				body,
				options
			);
		},

		async getBusinessChats(params: GetBusinessChatsParams, options?: RequestOptions) {
			const business_id = params.business_id || apiConfig.businessId;
			const { business_id: _, ...queryParams } = params;
			return apiConfig.httpClient.get(`/v1/businesses/${business_id}/chats`, {
				...options,
				params: Object.keys(queryParams).length > 0 ? queryParams : undefined
			});
		},

		async getChatMessages(params: GetAgentChatParams & { limit?: number }, options?: RequestOptions) {
			const business_id = params.business_id || apiConfig.businessId;
			const queryParams: Record<string, string> = {};
			if (params.limit) queryParams.limit = String(params.limit);
			return apiConfig.httpClient.get(
				`/v1/businesses/${business_id}/agents/${params.id}/chats/${params.chat_id}/messages`,
				{
					...options,
					params: Object.keys(queryParams).length > 0 ? queryParams : undefined
				}
			);
		},


	};
};
