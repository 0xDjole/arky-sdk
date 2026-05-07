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
import type { PaginatedResponse, Agent, AgentChat, AgentChatMessage } from '../types';

export const createAgentApi = (apiConfig: ApiConfig) => {
	return {
		async createAgent(params: CreateAgentParams, options?: RequestOptions): Promise<Agent> {
			const { store_id, ...payload } = params;
			const target_store_id = store_id || apiConfig.storeId;
			return apiConfig.httpClient.post<Agent>(
				`/v1/stores/${target_store_id}/agents`,
				{ ...payload, store_id: target_store_id },
				options
			);
		},

		async updateAgent(params: UpdateAgentParams, options?: RequestOptions): Promise<Agent> {
			const { store_id, id, ...payload } = params;
			const target_store_id = store_id || apiConfig.storeId;
			return apiConfig.httpClient.put<Agent>(
				`/v1/stores/${target_store_id}/agents/${id}`,
				payload,
				options
			);
		},

		async deleteAgent(params: DeleteAgentParams, options?: RequestOptions): Promise<{ deleted: boolean }> {
			const store_id = params.store_id || apiConfig.storeId;
			return apiConfig.httpClient.delete<{ deleted: boolean }>(
				`/v1/stores/${store_id}/agents/${params.id}`,
				options
			);
		},

		async getAgent(params: GetAgentParams, options?: RequestOptions): Promise<Agent> {
			const store_id = params.store_id || apiConfig.storeId;
			return apiConfig.httpClient.get<Agent>(
				`/v1/stores/${store_id}/agents/${params.id}`,
				options
			);
		},

		async getAgents(params?: GetAgentsParams, options?: RequestOptions): Promise<PaginatedResponse<Agent>> {
			const store_id = params?.store_id || apiConfig.storeId;
			const { store_id: _, ...queryParams } = params || {};
			return apiConfig.httpClient.get<PaginatedResponse<Agent>>(`/v1/stores/${store_id}/agents`, {
				...options,
				params: Object.keys(queryParams).length > 0 ? queryParams : undefined
			});
		},

		async sendMessage(params: RunAgentParams, options?: RequestOptions): Promise<AgentChatMessage> {
			const store_id = params.store_id || apiConfig.storeId;
			const body: Record<string, unknown> = { message: params.message };
			if (params.chat_id) body.chat_id = params.chat_id;
			if (params.direct) body.direct = params.direct;
			return apiConfig.httpClient.post<AgentChatMessage>(
				`/v1/stores/${store_id}/agents/${params.id}/chats/messages`,
				body,
				options
			);
		},

		async getChats(params: GetAgentChatsParams, options?: RequestOptions): Promise<PaginatedResponse<AgentChat>> {
			const store_id = params.store_id || apiConfig.storeId;
			const queryParams: Record<string, string> = {};
			if (params.limit) queryParams.limit = String(params.limit);
			if (params.cursor) queryParams.cursor = params.cursor;
			return apiConfig.httpClient.get<PaginatedResponse<AgentChat>>(
				`/v1/stores/${store_id}/agents/${params.id}/chats`,
				{
					...options,
					params: Object.keys(queryParams).length > 0 ? queryParams : undefined
				}
			);
		},

		async getChat(params: GetAgentChatParams, options?: RequestOptions): Promise<AgentChat> {
			const store_id = params.store_id || apiConfig.storeId;
			return apiConfig.httpClient.get<AgentChat>(
				`/v1/stores/${store_id}/agents/${params.id}/chats/${params.chat_id}`,
				options
			);
		},

		async updateChat(params: UpdateAgentChatParams, options?: RequestOptions): Promise<AgentChat> {
			const store_id = params.store_id || apiConfig.storeId;
			return apiConfig.httpClient.put<AgentChat>(
				`/v1/stores/${store_id}/agents/${params.id}/chats/${params.chat_id}`,
				{ status: params.status },
				options
			);
		},

		async rateChat(params: RateAgentChatParams, options?: RequestOptions): Promise<AgentChat> {
			const store_id = params.store_id || apiConfig.storeId;
			const body: Record<string, unknown> = { rating: params.rating };
			if (params.comment) body.comment = params.comment;
			return apiConfig.httpClient.post<AgentChat>(
				`/v1/stores/${store_id}/agents/${params.id}/chats/${params.chat_id}/rate`,
				body,
				options
			);
		},

		async getStoreChats(params: GetStoreChatsParams, options?: RequestOptions): Promise<PaginatedResponse<AgentChat>> {
			const store_id = params.store_id || apiConfig.storeId;
			const { store_id: _, ...queryParams } = params;
			return apiConfig.httpClient.get<PaginatedResponse<AgentChat>>(`/v1/stores/${store_id}/chats`, {
				...options,
				params: Object.keys(queryParams).length > 0 ? queryParams : undefined
			});
		},

		async getChatMessages(params: GetAgentChatParams & { limit?: number }, options?: RequestOptions): Promise<PaginatedResponse<AgentChatMessage>> {
			const store_id = params.store_id || apiConfig.storeId;
			const queryParams: Record<string, string> = {};
			if (params.limit) queryParams.limit = String(params.limit);
			return apiConfig.httpClient.get<PaginatedResponse<AgentChatMessage>>(
				`/v1/stores/${store_id}/agents/${params.id}/chats/${params.chat_id}/messages`,
				{
					...options,
					params: Object.keys(queryParams).length > 0 ? queryParams : undefined
				}
			);
		},


	};
};
