import type { ApiConfig } from "../services/clientTypes";
import type {
  RequestOptions,
  CreateCampaignParams,
  UpdateCampaignParams,
  FindCampaignsParams,
  GetCampaignParams,
  LaunchCampaignParams,
  DuplicateCampaignParams,
  GetCampaignLaunchReadinessParams,
  ImportCampaignEnrollmentsParams,
  GenerateOutreachPersonalizedDraftsParams,
  FindCampaignEnrollmentsParams,
  UpdateCampaignEnrollmentParams,
  UpdateCampaignEnrollmentDraftParams,
  UpdateCampaignEnrollmentStepExecutionParams,
  GetCampaignEnrollmentConversationParams,
  ReplyCampaignEnrollmentParams,
  StopCampaignEnrollmentParams,
  FindCampaignMessagesParams,
  UpdateCampaignMessageParams,
  CreateSuppressionParams,
  UpdateSuppressionParams,
  FindSuppressionsParams,
  GetSuppressionParams,
} from "../types/api";
import type {
  Campaign,
  CampaignPersonalization,
  CampaignLaunchReadiness,
  CampaignEnrollment,
  CampaignMessage,
  CampaignEnrollmentConversationResponse,
  PaginatedResponse,
  Suppression,
  CampaignEnrollmentImportResult,
} from "../types";

export const createOutreachApi = (apiConfig: ApiConfig) => ({
  campaign: {
    async create(
      params: CreateCampaignParams,
      options?: RequestOptions,
    ): Promise<Campaign> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Campaign>(
        `/v1/stores/${target_store_id}/campaigns`,
        payload,
        options,
      );
    },

    async update(
      params: UpdateCampaignParams,
      options?: RequestOptions,
    ): Promise<Campaign> {
      const { id, store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<Campaign>(
        `/v1/stores/${target_store_id}/campaigns/${id}`,
        payload,
        options,
      );
    },

    async get(
      params: GetCampaignParams,
      options?: RequestOptions,
    ): Promise<Campaign> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<Campaign>(
        `/v1/stores/${target_store_id}/campaigns/${params.id}`,
        options,
      );
    },

    async getPersonalization(
      params: GetCampaignParams,
      options?: RequestOptions,
    ): Promise<CampaignPersonalization> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<CampaignPersonalization>(
        `/v1/stores/${target_store_id}/campaigns/${params.id}/personalization`,
        options,
      );
    },

    async find(
      params?: FindCampaignsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Campaign>> {
      const { store_id, ...queryParams } = params || {};
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<Campaign>>(
        `/v1/stores/${target_store_id}/campaigns`,
        { ...options, params: queryParams },
      );
    },

    async launch(
      params: LaunchCampaignParams,
      options?: RequestOptions,
    ): Promise<Campaign> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Campaign>(
        `/v1/stores/${target_store_id}/campaigns/${params.id}/launch`,
        {},
        options,
      );
    },

    async duplicate(
      params: DuplicateCampaignParams,
      options?: RequestOptions,
    ): Promise<Campaign> {
      const { id, store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Campaign>(
        `/v1/stores/${target_store_id}/campaigns/${id}/duplicate`,
        payload,
        options,
      );
    },

    async launchReadiness(
      params: GetCampaignLaunchReadinessParams,
      options?: RequestOptions,
    ): Promise<CampaignLaunchReadiness> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<CampaignLaunchReadiness>(
        `/v1/stores/${target_store_id}/campaigns/${params.id}/launch-readiness`,
        options,
      );
    },

    async importEnrollments(
      params: ImportCampaignEnrollmentsParams,
      options?: RequestOptions,
    ): Promise<CampaignEnrollmentImportResult> {
      const { id, store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<CampaignEnrollmentImportResult>(
        `/v1/stores/${target_store_id}/campaigns/${id}/enrollments/import`,
        payload,
        options,
      );
    },

    async generatePersonalizedDrafts(
      params: GenerateOutreachPersonalizedDraftsParams,
      options?: RequestOptions,
    ): Promise<CampaignPersonalization> {
      const { id, store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<CampaignPersonalization>(
        `/v1/stores/${target_store_id}/campaigns/${id}/personalized-drafts`,
        payload,
        options,
      );
    },
  },

  campaignEnrollment: {
    async find(
      params?: FindCampaignEnrollmentsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<CampaignEnrollment>> {
      const { store_id, ...queryParams } = params || {};
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<CampaignEnrollment>>(
        `/v1/stores/${target_store_id}/campaign-enrollments`,
        { ...options, params: queryParams },
      );
    },

    async get(
      params: GetCampaignEnrollmentConversationParams,
      options?: RequestOptions,
    ): Promise<CampaignEnrollmentConversationResponse> {
      const { store_id, id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<CampaignEnrollmentConversationResponse>(
        `/v1/stores/${target_store_id}/campaign-enrollments/${id}`,
        { ...options, params: { ...queryParams, store_id: target_store_id } },
      );
    },

    async update(
      params: UpdateCampaignEnrollmentParams,
      options?: RequestOptions,
    ): Promise<CampaignEnrollment> {
      const { store_id, id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<CampaignEnrollment>(
        `/v1/stores/${target_store_id}/campaign-enrollments/${id}`,
        payload,
        options,
      );
    },

    async updateDraft(
      params: UpdateCampaignEnrollmentDraftParams,
      options?: RequestOptions,
    ): Promise<CampaignEnrollment> {
      const { store_id, id, draft_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<CampaignEnrollment>(
        `/v1/stores/${target_store_id}/campaign-enrollments/${id}/drafts/${draft_id}`,
        payload,
        options,
      );
    },

    async updateStepExecution(
      params: UpdateCampaignEnrollmentStepExecutionParams,
      options?: RequestOptions,
    ): Promise<CampaignEnrollmentConversationResponse> {
      const { store_id, id, execution_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<CampaignEnrollmentConversationResponse>(
        `/v1/stores/${target_store_id}/campaign-enrollments/${id}/step-executions/${execution_id}`,
        payload,
        options,
      );
    },

    async reply(
      params: ReplyCampaignEnrollmentParams,
      options?: RequestOptions,
    ): Promise<CampaignEnrollmentConversationResponse> {
      const { store_id, id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<CampaignEnrollmentConversationResponse>(
        `/v1/stores/${target_store_id}/campaign-enrollments/${id}/reply`,
        payload,
        options,
      );
    },

    async stop(
      params: StopCampaignEnrollmentParams,
      options?: RequestOptions,
    ): Promise<CampaignEnrollmentConversationResponse> {
      const { store_id, id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<CampaignEnrollmentConversationResponse>(
        `/v1/stores/${target_store_id}/campaign-enrollments/${id}/stop`,
        payload,
        options,
      );
    },
  },

  campaignMessage: {
    async find(
      params?: FindCampaignMessagesParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<CampaignMessage>> {
      const { store_id, ...queryParams } = params || {};
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<CampaignMessage>>(
        `/v1/stores/${target_store_id}/campaign-messages`,
        { ...options, params: queryParams },
      );
    },

    async update(
      params: UpdateCampaignMessageParams,
      options?: RequestOptions,
    ): Promise<CampaignMessage> {
      const { id, store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<CampaignMessage>(
        `/v1/stores/${target_store_id}/campaign-messages/${id}`,
        payload,
        options,
      );
    },
  },

  suppression: {
    async create(
      params: CreateSuppressionParams,
      options?: RequestOptions,
    ): Promise<Suppression> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Suppression>(
        `/v1/stores/${target_store_id}/suppressions`,
        payload,
        options,
      );
    },

    async update(
      params: UpdateSuppressionParams,
      options?: RequestOptions,
    ): Promise<Suppression> {
      const { id, store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<Suppression>(
        `/v1/stores/${target_store_id}/suppressions/${id}`,
        payload,
        options,
      );
    },

    async get(
      params: GetSuppressionParams,
      options?: RequestOptions,
    ): Promise<Suppression> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<Suppression>(
        `/v1/stores/${target_store_id}/suppressions/${params.id}`,
        options,
      );
    },

    async find(
      params?: FindSuppressionsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Suppression>> {
      const { store_id, ...queryParams } = params || {};
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<Suppression>>(
        `/v1/stores/${target_store_id}/suppressions`,
        { ...options, params: queryParams },
      );
    },
  },
});
