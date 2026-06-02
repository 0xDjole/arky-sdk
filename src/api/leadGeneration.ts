import type { ApiConfig } from "../index";
import type {
  CreateLeadGenerationThreadParams,
  CancelLeadGenerationThreadParams,
  FindLeadsParams,
  FindLeadGenerationThreadsParams,
  GetLeadGenerationThreadParams,
  ImportLeadsParams,
  FindLeadGenerationMessagesParams,
  RequestOptions,
  SendLeadGenerationMessageParams,
  UpdateLeadParams,
  ValidateLeadEmailParams,
} from "../types/api";
import type {
  ImportLeadsResult,
  LeadEmailValidationResult,
  Lead,
  LeadGenerationThread,
  LeadGenerationMessage,
  PaginatedResponse,
  SendLeadGenerationMessageResult,
} from "../types";

export const createLeadGenerationApi = (apiConfig: ApiConfig) => {
  const storeId = (store_id?: string) => store_id || apiConfig.storeId;
  const threadId = (params: { thread_id?: string; run_id?: string; id?: string }) => {
    const id = params.thread_id || params.run_id || params.id;
    if (!id) throw new Error("Lead generation thread id is required");
    return id;
  };

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

    async findLeads(params: FindLeadsParams, options?: RequestOptions): Promise<PaginatedResponse<Lead>> {
      const id = threadId(params);
      const { store_id, thread_id: _thread_id, run_id: _run_id, id: _legacy_id, ...queryParams } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Lead>>(
        `/v1/stores/${storeId(store_id)}/lead-generation/runs/${id}/leads`,
        { ...options, params: queryParams },
      );
    },

    async updateLead(params: UpdateLeadParams, options?: RequestOptions): Promise<Lead> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<Lead>(
        `/v1/stores/${storeId(store_id)}/lead-generation/leads/${id}`,
        payload,
        options,
      );
    },

    async importLeads(params: ImportLeadsParams, options?: RequestOptions): Promise<ImportLeadsResult> {
      const id = threadId(params);
      const { store_id, thread_id: _thread_id, run_id: _run_id, id: _legacy_id, ...payload } = params;
      return apiConfig.httpClient.post<ImportLeadsResult>(
        `/v1/stores/${storeId(store_id)}/lead-generation/runs/${id}/import`,
        payload,
        options,
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
