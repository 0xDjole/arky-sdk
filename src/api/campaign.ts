import type { ApiConfig } from "../services/clientTypes";
import type {
  RequestOptions,
  CreateCampaignParams,
  ReplaceDraftCampaignParams,
  FindCampaignsParams,
  GetCampaignParams,
  EnrollCampaignParams,
  FindCampaignEnrollmentsParams,
  RemovePendingCampaignEnrollmentParams,
  GetCampaignEnrollmentConversationParams,
  ReplyCampaignEnrollmentParams,
  StopCampaignEnrollmentParams,
  ReplaceCampaignMessageDraftParams,
} from "../types/api";
import type {
  Campaign,
  CampaignEnrollment,
  CampaignEnrollmentConversationResponse,
  CampaignConversationMessage,
  EnrollCampaignResult,
  PaginatedResponse,
} from "../types";

const storeId = (configured: string | undefined, explicit?: string) =>
  explicit || configured;

export const createCampaignApi = (apiConfig: ApiConfig) => ({
  campaign: {
    async create(
      params: CreateCampaignParams,
      options?: RequestOptions,
    ): Promise<Campaign> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<Campaign>(
        `/v1/stores/${storeId(apiConfig.storeId, store_id)}/campaigns`,
        payload,
        options,
      );
    },

    async find(
      params?: FindCampaignsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Campaign>> {
      const { store_id, ...query } = params || {};
      return apiConfig.httpClient.get<PaginatedResponse<Campaign>>(
        `/v1/stores/${storeId(apiConfig.storeId, store_id)}/campaigns`,
        { ...options, params: query },
      );
    },

    async get(
      params: GetCampaignParams,
      options?: RequestOptions,
    ): Promise<Campaign> {
      return apiConfig.httpClient.get<Campaign>(
        `/v1/stores/${storeId(apiConfig.storeId, params.store_id)}/campaigns/${params.id}`,
        options,
      );
    },

    async replaceDraft(
      params: ReplaceDraftCampaignParams,
      options?: RequestOptions,
    ): Promise<Campaign> {
      const { id, store_id, ...payload } = params;
      return apiConfig.httpClient.put<Campaign>(
        `/v1/stores/${storeId(apiConfig.storeId, store_id)}/campaigns/${id}`,
        payload,
        options,
      );
    },

    async deleteDraft(
      params: GetCampaignParams,
      options?: RequestOptions,
    ): Promise<boolean> {
      return apiConfig.httpClient.delete<boolean>(
        `/v1/stores/${storeId(apiConfig.storeId, params.store_id)}/campaigns/${params.id}`,
        options,
      );
    },

    async launch(
      params: GetCampaignParams,
      options?: RequestOptions,
    ): Promise<Campaign> {
      return apiConfig.httpClient.post<Campaign>(
        `/v1/stores/${storeId(apiConfig.storeId, params.store_id)}/campaigns/${params.id}/launch`,
        {},
        options,
      );
    },

    async pause(
      params: GetCampaignParams,
      options?: RequestOptions,
    ): Promise<Campaign> {
      return apiConfig.httpClient.post<Campaign>(
        `/v1/stores/${storeId(apiConfig.storeId, params.store_id)}/campaigns/${params.id}/pause`,
        {},
        options,
      );
    },

    async resume(
      params: GetCampaignParams,
      options?: RequestOptions,
    ): Promise<Campaign> {
      return apiConfig.httpClient.post<Campaign>(
        `/v1/stores/${storeId(apiConfig.storeId, params.store_id)}/campaigns/${params.id}/resume`,
        {},
        options,
      );
    },

    async enroll(
      params: EnrollCampaignParams,
      options?: RequestOptions,
    ): Promise<EnrollCampaignResult> {
      const { store_id, campaign_id, ...payload } = params;
      return apiConfig.httpClient.post<EnrollCampaignResult>(
        `/v1/stores/${storeId(apiConfig.storeId, store_id)}/campaigns/${campaign_id}/enrollments`,
        payload,
        options,
      );
    },

    async findEnrollments(
      params: FindCampaignEnrollmentsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<CampaignEnrollment>> {
      const { store_id, campaign_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<CampaignEnrollment>>(
        `/v1/stores/${storeId(apiConfig.storeId, store_id)}/campaigns/${campaign_id}/enrollments`,
        { ...options, params: query },
      );
    },
  },

  campaignEnrollment: {
    async removePending(
      params: RemovePendingCampaignEnrollmentParams,
      options?: RequestOptions,
    ): Promise<boolean> {
      const { store_id, campaign_id, id } = params;
      return apiConfig.httpClient.delete<boolean>(
        `/v1/stores/${storeId(apiConfig.storeId, store_id)}/campaigns/${campaign_id}/enrollments/${id}`,
        options,
      );
    },

    async stop(
      params: StopCampaignEnrollmentParams,
      options?: RequestOptions,
    ): Promise<CampaignEnrollment> {
      const { store_id, campaign_id, id } = params;
      return apiConfig.httpClient.post<CampaignEnrollment>(
        `/v1/stores/${storeId(apiConfig.storeId, store_id)}/campaigns/${campaign_id}/enrollments/${id}/stop`,
        {},
        options,
      );
    },

    async getConversation(
      params: GetCampaignEnrollmentConversationParams,
      options?: RequestOptions,
    ): Promise<CampaignEnrollmentConversationResponse> {
      const { store_id, campaign_id, id, ...query } = params;
      return apiConfig.httpClient.get<CampaignEnrollmentConversationResponse>(
        `/v1/stores/${storeId(apiConfig.storeId, store_id)}/campaigns/${campaign_id}/enrollments/${id}/conversation`,
        { ...options, params: query },
      );
    },

    async reply(
      params: ReplyCampaignEnrollmentParams,
      options?: RequestOptions,
    ): Promise<CampaignConversationMessage> {
      const { store_id, campaign_id, id, ...payload } = params;
      return apiConfig.httpClient.post<CampaignConversationMessage>(
        `/v1/stores/${storeId(apiConfig.storeId, store_id)}/campaigns/${campaign_id}/enrollments/${id}/replies`,
        payload,
        options,
      );
    },
  },

  campaignMessage: {
    async replaceDraft(
      params: ReplaceCampaignMessageDraftParams,
      options?: RequestOptions,
    ): Promise<CampaignConversationMessage> {
      const { store_id, campaign_id, campaign_enrollment_id, id, ...payload } = params;
      return apiConfig.httpClient.put<CampaignConversationMessage>(
        `/v1/stores/${storeId(apiConfig.storeId, store_id)}/campaigns/${campaign_id}/enrollments/${campaign_enrollment_id}/messages/${id}`,
        payload,
        options,
      );
    },
  },
});
