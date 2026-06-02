import type { ApiConfig } from "../index";
import type {
  CreateLeadGenerationThreadParams,
  CancelLeadGenerationThreadParams,
  FindLeadGenerationThreadsParams,
  GetLeadGenerationThreadParams,
  FindLeadGenerationMessagesParams,
  RequestOptions,
  SendLeadGenerationMessageParams,
  UpdateLeadGenerationThreadParams,
  ValidateLeadEmailParams,
} from "../types/api";
import type {
  LeadEmailValidationResult,
  LeadGenerationThread,
  LeadGenerationMessage,
  PaginatedResponse,
  SendLeadGenerationMessageResult,
} from "../types";

export const createLeadGenerationApi = (apiConfig: ApiConfig) => {
  const storeId = (store_id?: string) => store_id || apiConfig.storeId;

  return {
    async createRun(params: CreateLeadGenerationThreadParams, options?: RequestOptions): Promise<LeadGenerationThread> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<LeadGenerationThread>(
        `/v1/stores/${storeId(store_id)}/lead-generation/runs`,
        payload,
        options,
      );
    },

    async createThread(params: CreateLeadGenerationThreadParams, options?: RequestOptions): Promise<LeadGenerationThread> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<LeadGenerationThread>(
        `/v1/stores/${storeId(store_id)}/lead-generation/runs`,
        payload,
        options,
      );
    },

    async findRuns(params?: FindLeadGenerationThreadsParams, options?: RequestOptions): Promise<PaginatedResponse<LeadGenerationThread>> {
      const { store_id, ...queryParams } = params || {};
      return apiConfig.httpClient.get<PaginatedResponse<LeadGenerationThread>>(
        `/v1/stores/${storeId(store_id)}/lead-generation/runs`,
        { ...options, params: queryParams },
      );
    },

    async getRun(params: GetLeadGenerationThreadParams, options?: RequestOptions): Promise<LeadGenerationThread> {
      return apiConfig.httpClient.get<LeadGenerationThread>(
        `/v1/stores/${storeId(params.store_id)}/lead-generation/runs/${params.id}`,
        options,
      );
    },

    async updateRun(params: UpdateLeadGenerationThreadParams, options?: RequestOptions): Promise<LeadGenerationThread> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.patch<LeadGenerationThread>(
        `/v1/stores/${storeId(store_id)}/lead-generation/runs/${id}`,
        payload,
        options,
      );
    },

    async updateThread(params: UpdateLeadGenerationThreadParams, options?: RequestOptions): Promise<LeadGenerationThread> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.patch<LeadGenerationThread>(
        `/v1/stores/${storeId(store_id)}/lead-generation/runs/${id}`,
        payload,
        options,
      );
    },

    async cancelRun(params: CancelLeadGenerationThreadParams, options?: RequestOptions): Promise<LeadGenerationThread> {
      return apiConfig.httpClient.post<LeadGenerationThread>(
        `/v1/stores/${storeId(params.store_id)}/lead-generation/runs/${params.id}/cancel`,
        {},
        options,
      );
    },

    async sendMessage(params: SendLeadGenerationMessageParams, options?: RequestOptions): Promise<SendLeadGenerationMessageResult> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.post<SendLeadGenerationMessageResult>(
        `/v1/stores/${storeId(store_id)}/lead-generation/runs/${id}/messages`,
        payload,
        options,
      );
    },

    async findMessages(params: FindLeadGenerationMessagesParams, options?: RequestOptions): Promise<LeadGenerationMessage[]> {
      const { store_id, id, ...queryParams } = params;
      return apiConfig.httpClient.get<LeadGenerationMessage[]>(
        `/v1/stores/${storeId(store_id)}/lead-generation/runs/${id}/messages`,
        { ...options, params: queryParams },
      );
    },

    async validateEmail(params: ValidateLeadEmailParams, options?: RequestOptions): Promise<LeadEmailValidationResult> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<LeadEmailValidationResult>(
        `/v1/stores/${storeId(store_id)}/lead-generation/validate-email`,
        payload,
        options,
      );
    },
  };
};
