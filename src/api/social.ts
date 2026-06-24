import type { ApiConfig } from "../index";
import type {
  CancelSocialPublicationParams,
  ClassifySocialPublicationCommentsParams,
  ConnectSocialAccountParams,
  CreateSocialPublicationParams,
  DeleteSocialAccountParams,
  FindSocialPublicationCommentsParams,
  FindSocialPublicationsParams,
  GetSocialCapabilitiesParams,
  GetSocialOAuthAttemptParams,
  GetSocialPublicationCommentThreadParams,
  GetSocialPublicationCommentsParams,
  GetSocialPublicationMetricsParams,
  GetSocialPublicationParams,
  ReplySocialPublicationCommentParams,
  RequestOptions,
  ScheduleSocialPublicationParams,
  SelectSocialDestinationParams,
  ListSocialAccountsParams,
  SyncSocialEngagementParams,
  UpdateSocialPublicationParams,
  ValidateSocialPublicationParams,
} from "../types/api";
import type {
  PaginatedResponse,
  SocialConnectResponse,
  SocialOAuthCallbackResponse,
  SocialProviderCapability,
  SocialAccount,
  SocialPublication,
  SocialPublicationCommentClassificationResult,
  SocialPublicationComment,
  SocialPublicationEngagementSyncResult,
  SocialPublicationCommentReplyResponse,
  SocialPublicationMetricSnapshot,
  SocialPublicationMutationResponse,
  SocialPublicationValidation,
} from "../types";

export const createSocialApi = (apiConfig: ApiConfig) => {
  const storeId = (store_id?: string) => store_id || apiConfig.storeId;

  const api = {
    async findPublications(
      params?: FindSocialPublicationsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<SocialPublication>> {
      const { store_id, ...queryParams } = params || {};
      return apiConfig.httpClient.get<PaginatedResponse<SocialPublication>>(
        `/v1/stores/${storeId(store_id)}/social-publications`,
        {
          ...options,
          params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        },
      );
    },

    async getPublication(
      params: GetSocialPublicationParams,
      options?: RequestOptions,
    ): Promise<SocialPublication> {
      return apiConfig.httpClient.get<SocialPublication>(
        `/v1/stores/${storeId(params.store_id)}/social-publications/${params.id}`,
        options,
      );
    },

    async validatePublication(
      params: ValidateSocialPublicationParams,
      options?: RequestOptions,
    ): Promise<SocialPublicationValidation> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<SocialPublicationValidation>(
        `/v1/stores/${storeId(store_id)}/social-publications/validate`,
        payload,
        options,
      );
    },

    async createPublication(
      params: CreateSocialPublicationParams,
      options?: RequestOptions,
    ): Promise<SocialPublicationMutationResponse> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<SocialPublicationMutationResponse>(
        `/v1/stores/${storeId(store_id)}/social-publications`,
        payload,
        options,
      );
    },

    async updatePublication(
      params: UpdateSocialPublicationParams,
      options?: RequestOptions,
    ): Promise<SocialPublicationMutationResponse> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<SocialPublicationMutationResponse>(
        `/v1/stores/${storeId(store_id)}/social-publications/${id}`,
        payload,
        options,
      );
    },

    async schedulePublication(
      params: ScheduleSocialPublicationParams,
      options?: RequestOptions,
    ): Promise<SocialPublicationMutationResponse> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.post<SocialPublicationMutationResponse>(
        `/v1/stores/${storeId(store_id)}/social-publications/${id}/schedule`,
        payload,
        options,
      );
    },

    async cancelPublication(
      params: CancelSocialPublicationParams,
      options?: RequestOptions,
    ): Promise<SocialPublication> {
      return apiConfig.httpClient.post<SocialPublication>(
        `/v1/stores/${storeId(params.store_id)}/social-publications/${params.id}/cancel`,
        {},
        options,
      );
    },

    async getPublicationComments(
      params: GetSocialPublicationCommentsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<SocialPublicationComment>> {
      const { store_id, publication_id, ...queryParams } = params;
      return apiConfig.httpClient.get<
        PaginatedResponse<SocialPublicationComment>
      >(
        `/v1/stores/${storeId(store_id)}/social-publications/${publication_id}/comments`,
        {
          ...options,
          params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        },
      );
    },

    async getPublicationCommentThread(
      params: GetSocialPublicationCommentThreadParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<SocialPublicationComment>> {
      const { store_id, publication_id, comment_id, ...queryParams } = params;
      return apiConfig.httpClient.get<
        PaginatedResponse<SocialPublicationComment>
      >(
        `/v1/stores/${storeId(store_id)}/social-publications/${publication_id}/comments/${comment_id}/thread`,
        {
          ...options,
          params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        },
      );
    },

    async findPublicationComments(
      params?: FindSocialPublicationCommentsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<SocialPublicationComment>> {
      const { store_id, ...queryParams } = params || {};
      return apiConfig.httpClient.get<
        PaginatedResponse<SocialPublicationComment>
      >(`/v1/stores/${storeId(store_id)}/social-publications/comments`, {
        ...options,
        params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
      });
    },

    async classifyPublicationComments(
      params?: ClassifySocialPublicationCommentsParams,
      options?: RequestOptions,
    ): Promise<SocialPublicationCommentClassificationResult> {
      const { store_id, ...payload } = params || {};
      return apiConfig.httpClient.post<SocialPublicationCommentClassificationResult>(
        `/v1/stores/${storeId(store_id)}/social-publications/comments/classify`,
        payload,
        options,
      );
    },

    async replyToPublicationComment(
      params: ReplySocialPublicationCommentParams,
      options?: RequestOptions,
    ): Promise<SocialPublicationCommentReplyResponse> {
      const { store_id, publication_id, comment_id, text } = params;
      return apiConfig.httpClient.post<SocialPublicationCommentReplyResponse>(
        `/v1/stores/${storeId(store_id)}/social-publications/${publication_id}/comments/${comment_id}/reply`,
        { text },
        options,
      );
    },

    async getPublicationMetrics(
      params: GetSocialPublicationMetricsParams,
      options?: RequestOptions,
    ): Promise<SocialPublicationMetricSnapshot> {
      return apiConfig.httpClient.get<SocialPublicationMetricSnapshot>(
        `/v1/stores/${storeId(params.store_id)}/social-publications/${params.publication_id}/metrics`,
        options,
      );
    },

    async syncEngagement(
      params?: SyncSocialEngagementParams,
      options?: RequestOptions,
    ): Promise<SocialPublicationEngagementSyncResult> {
      const { store_id, ...payload } = params || {};
      return apiConfig.httpClient.post<SocialPublicationEngagementSyncResult>(
        `/v1/stores/${storeId(store_id)}/social-publications/engagement/sync`,
        payload,
        options,
      );
    },

    async getCapabilities(
      params?: GetSocialCapabilitiesParams,
      options?: RequestOptions,
    ): Promise<SocialProviderCapability[]> {
      return apiConfig.httpClient.get<SocialProviderCapability[]>(
        `/v1/stores/${storeId(params?.store_id)}/social-accounts/capabilities`,
        options,
      );
    },

    async listAccounts(
      params?: ListSocialAccountsParams,
      options?: RequestOptions,
    ): Promise<SocialAccount[]> {
      return apiConfig.httpClient.get<SocialAccount[]>(
        `/v1/stores/${storeId(params?.store_id)}/social-accounts`,
        options,
      );
    },

    async connect(
      params: ConnectSocialAccountParams,
      options?: RequestOptions,
    ): Promise<SocialConnectResponse> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<SocialConnectResponse>(
        `/v1/stores/${storeId(store_id)}/social-accounts/oauth/connect`,
        payload,
        options,
      );
    },

    async getOAuthAttempt(
      params: GetSocialOAuthAttemptParams,
      options?: RequestOptions,
    ): Promise<SocialOAuthCallbackResponse> {
      return apiConfig.httpClient.get<SocialOAuthCallbackResponse>(
        `/v1/stores/${storeId(params.store_id)}/social-accounts/oauth/attempts/${params.attempt_id}`,
        options,
      );
    },

    async selectDestination(
      params: SelectSocialDestinationParams,
      options?: RequestOptions,
    ): Promise<SocialOAuthCallbackResponse> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<SocialOAuthCallbackResponse>(
        `/v1/stores/${storeId(store_id)}/social-accounts/oauth/select-destination`,
        payload,
        options,
      );
    },

    async deleteAccount(
      params: DeleteSocialAccountParams,
      options?: RequestOptions,
    ): Promise<{ deleted: boolean }> {
      return apiConfig.httpClient.delete<{ deleted: boolean }>(
        `/v1/stores/${storeId(params.store_id)}/social-accounts/${params.id}`,
        options,
      );
    },

    validatePublications(
      params: ValidateSocialPublicationParams,
      options?: RequestOptions,
    ): Promise<SocialPublicationValidation> {
      return api.validatePublication(params, options);
    },

    createPublications(
      params: CreateSocialPublicationParams,
      options?: RequestOptions,
    ): Promise<SocialPublicationMutationResponse> {
      return api.createPublication(params, options);
    },
  };

  return api;
};
