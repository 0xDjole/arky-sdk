import type { ApiConfig } from "../index";
import type {
  CreateLeadResearchRunParams,
  CancelLeadResearchRunParams,
  FindLeadResearchRunsParams,
  GetLeadResearchRunParams,
  FindLeadResearchMessagesParams,
  RequestOptions,
  SendLeadResearchMessageParams,
  UpdateLeadResearchRunParams,
  ValidateLeadEmailParams,
} from "../types/api";
import type {
  LeadEmailValidationResult,
  LeadResearchRun,
  LeadResearchMessage,
  PaginatedResponse,
  SendLeadResearchMessageResult,
} from "../types";

export const createLeadResearchApi = (apiConfig: ApiConfig) => {
  const storeId = (store_id?: string) => store_id || apiConfig.storeId;

  return {
    async createRun(params: CreateLeadResearchRunParams, options?: RequestOptions): Promise<LeadResearchRun> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<LeadResearchRun>(
        `/v1/stores/${storeId(store_id)}/lead-research/runs`,
        payload,
        options,
      );
    },

    async findRuns(params?: FindLeadResearchRunsParams, options?: RequestOptions): Promise<PaginatedResponse<LeadResearchRun>> {
      const { store_id, ...queryParams } = params || {};
      return apiConfig.httpClient.get<PaginatedResponse<LeadResearchRun>>(
        `/v1/stores/${storeId(store_id)}/lead-research/runs`,
        { ...options, params: queryParams },
      );
    },

    async getRun(params: GetLeadResearchRunParams, options?: RequestOptions): Promise<LeadResearchRun> {
      return apiConfig.httpClient.get<LeadResearchRun>(
        `/v1/stores/${storeId(params.store_id)}/lead-research/runs/${params.id}`,
        options,
      );
    },

    async updateRun(params: UpdateLeadResearchRunParams, options?: RequestOptions): Promise<LeadResearchRun> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.patch<LeadResearchRun>(
        `/v1/stores/${storeId(store_id)}/lead-research/runs/${id}`,
        payload,
        options,
      );
    },

    async cancelRun(params: CancelLeadResearchRunParams, options?: RequestOptions): Promise<LeadResearchRun> {
      return apiConfig.httpClient.post<LeadResearchRun>(
        `/v1/stores/${storeId(params.store_id)}/lead-research/runs/${params.id}/cancel`,
        {},
        options,
      );
    },

    async sendMessage(params: SendLeadResearchMessageParams, options?: RequestOptions): Promise<SendLeadResearchMessageResult> {
      const { store_id, run_id, ...payload } = params;
      return apiConfig.httpClient.post<SendLeadResearchMessageResult>(
        `/v1/stores/${storeId(store_id)}/lead-research/runs/${run_id}/messages`,
        payload,
        options,
      );
    },

    async findMessages(params: FindLeadResearchMessagesParams, options?: RequestOptions): Promise<LeadResearchMessage[]> {
      const { store_id, run_id, ...queryParams } = params;
      return apiConfig.httpClient.get<LeadResearchMessage[]>(
        `/v1/stores/${storeId(store_id)}/lead-research/runs/${run_id}/messages`,
        { ...options, params: queryParams },
      );
    },

    async validateEmail(params: ValidateLeadEmailParams, options?: RequestOptions): Promise<LeadEmailValidationResult> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<LeadEmailValidationResult>(
        `/v1/stores/${storeId(store_id)}/lead-research/validate-email`,
        payload,
        options,
      );
    },
  };
};
