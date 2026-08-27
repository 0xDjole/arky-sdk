import type { ApiConfig } from "../services/clientTypes";
import type {
  CancelLeadResearchMessageParams,
  CreateLeadResearchParams,
  FindLeadResearchesParams,
  FindLeadResearchMessagesParams,
  GetLeadResearchParams,
  RequestOptions,
  RetryLeadResearchMessageParams,
  SendLeadResearchMessageParams,
} from "../types/api";
import type {
  LeadResearch,
  LeadResearchCreated,
  LeadResearchMessage,
  LeadResearchMessagePair,
  PaginatedResponse,
} from "../types";

export const createLeadResearchApi = (apiConfig: ApiConfig) => {
  const storeId = (store_id?: string) => store_id || apiConfig.storeId;

  return {
    async create(
      params: CreateLeadResearchParams,
      options?: RequestOptions,
    ): Promise<LeadResearchCreated> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<LeadResearchCreated>(
        `/v1/stores/${storeId(store_id)}/lead-research`,
        payload,
        options,
      );
    },

    async find(
      params?: FindLeadResearchesParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<LeadResearch>> {
      const { store_id, ...queryParams } = params || {};
      return apiConfig.httpClient.get<PaginatedResponse<LeadResearch>>(
        `/v1/stores/${storeId(store_id)}/lead-research`,
        { ...options, params: queryParams },
      );
    },

    async get(
      params: GetLeadResearchParams,
      options?: RequestOptions,
    ): Promise<LeadResearch> {
      return apiConfig.httpClient.get<LeadResearch>(
        `/v1/stores/${storeId(params.store_id)}/lead-research/${params.lead_research_id}`,
        options,
      );
    },

    async sendMessage(
      params: SendLeadResearchMessageParams,
      options?: RequestOptions,
    ): Promise<LeadResearchMessagePair> {
      const { store_id, lead_research_id, ...payload } = params;
      return apiConfig.httpClient.post<LeadResearchMessagePair>(
        `/v1/stores/${storeId(store_id)}/lead-research/${lead_research_id}/messages`,
        payload,
        options,
      );
    },

    async findMessages(
      params: FindLeadResearchMessagesParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<LeadResearchMessage>> {
      const { store_id, lead_research_id, ...queryParams } = params;
      return apiConfig.httpClient.get<PaginatedResponse<LeadResearchMessage>>(
        `/v1/stores/${storeId(store_id)}/lead-research/${lead_research_id}/messages`,
        { ...options, params: queryParams },
      );
    },

    async retryMessage(
      params: RetryLeadResearchMessageParams,
      options?: RequestOptions,
    ): Promise<LeadResearchMessage> {
      const { store_id, lead_research_id, account_message_id, ...payload } = params;
      return apiConfig.httpClient.post<LeadResearchMessage>(
        `/v1/stores/${storeId(store_id)}/lead-research/${lead_research_id}/messages/${account_message_id}/retry`,
        payload,
        options,
      );
    },

    async cancelMessage(
      params: CancelLeadResearchMessageParams,
      options?: RequestOptions,
    ): Promise<LeadResearchMessage> {
      const { store_id, lead_research_id, assistant_message_id } = params;
      return apiConfig.httpClient.post<LeadResearchMessage>(
        `/v1/stores/${storeId(store_id)}/lead-research/${lead_research_id}/messages/${assistant_message_id}/cancel`,
        {},
        options,
      );
    },
  };
};
