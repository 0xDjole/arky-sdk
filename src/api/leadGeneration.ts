import type { ApiConfig } from "../index";
import type {
  CreateLeadGenerationSessionParams,
  CancelLeadGenerationSessionParams,
  FindLeadGenerationSessionsParams,
  GetLeadGenerationSessionParams,
  FindLeadGenerationMessagesParams,
  RequestOptions,
  SendLeadGenerationMessageParams,
  UpdateLeadGenerationSessionParams,
  ValidateLeadEmailParams,
} from "../types/api";
import type {
  LeadEmailValidationResult,
  LeadGenerationSession,
  LeadGenerationMessage,
  PaginatedResponse,
  SendLeadGenerationMessageResult,
} from "../types";

export const createLeadGenerationApi = (apiConfig: ApiConfig) => {
  const storeId = (store_id?: string) => store_id || apiConfig.storeId;

  return {
    async createSession(params: CreateLeadGenerationSessionParams, options?: RequestOptions): Promise<LeadGenerationSession> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<LeadGenerationSession>(
        `/v1/stores/${storeId(store_id)}/lead-generation/sessions`,
        payload,
        options,
      );
    },

    async findSessions(params?: FindLeadGenerationSessionsParams, options?: RequestOptions): Promise<PaginatedResponse<LeadGenerationSession>> {
      const { store_id, ...queryParams } = params || {};
      return apiConfig.httpClient.get<PaginatedResponse<LeadGenerationSession>>(
        `/v1/stores/${storeId(store_id)}/lead-generation/sessions`,
        { ...options, params: queryParams },
      );
    },

    async getSession(params: GetLeadGenerationSessionParams, options?: RequestOptions): Promise<LeadGenerationSession> {
      return apiConfig.httpClient.get<LeadGenerationSession>(
        `/v1/stores/${storeId(params.store_id)}/lead-generation/sessions/${params.id}`,
        options,
      );
    },

    async updateSession(params: UpdateLeadGenerationSessionParams, options?: RequestOptions): Promise<LeadGenerationSession> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.patch<LeadGenerationSession>(
        `/v1/stores/${storeId(store_id)}/lead-generation/sessions/${id}`,
        payload,
        options,
      );
    },

    async cancelSession(params: CancelLeadGenerationSessionParams, options?: RequestOptions): Promise<LeadGenerationSession> {
      return apiConfig.httpClient.post<LeadGenerationSession>(
        `/v1/stores/${storeId(params.store_id)}/lead-generation/sessions/${params.id}/cancel`,
        {},
        options,
      );
    },

    async sendMessage(params: SendLeadGenerationMessageParams, options?: RequestOptions): Promise<SendLeadGenerationMessageResult> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.post<SendLeadGenerationMessageResult>(
        `/v1/stores/${storeId(store_id)}/lead-generation/sessions/${id}/messages`,
        payload,
        options,
      );
    },

    async findMessages(params: FindLeadGenerationMessagesParams, options?: RequestOptions): Promise<LeadGenerationMessage[]> {
      const { store_id, id, ...queryParams } = params;
      return apiConfig.httpClient.get<LeadGenerationMessage[]>(
        `/v1/stores/${storeId(store_id)}/lead-generation/sessions/${id}/messages`,
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
