import type { ApiConfig } from "../index";
import type {
  CancelSocialPublicationParams,
  ClassifySocialPublicationCommentsParams,
  ConnectSocialConnectionParams,
  CreateSocialCommentReplyParams,
  CreateSocialPublicationParams,
  DeleteSocialConnectionParams,
  FindSocialPublicationCommentsParams,
  FindSocialPublicationsParams,
  GetSocialCommentClassificationRunParams,
  GetSocialCapabilitiesParams,
  GetSocialCommentReplyParams,
  GetSocialOAuthAttemptParams,
  GetSocialPublicationEffectParams,
  GetSocialPublicationCommentThreadParams,
  GetSocialPublicationCommentsParams,
  GetSocialPublicationMetricsParams,
  GetSocialPublicationParams,
  ListSocialCommentRepliesParams,
  ListSocialPublicationEffectsParams,
  RequestOptions,
  RetrySocialCommentReplyParams,
  ScheduleSocialPublicationParams,
  SelectSocialDestinationParams,
  ListSocialConnectionsParams,
  SyncSocialEngagementParams,
  SyncSocialPublicationCommentsParams,
  SyncSocialPublicationCommentThreadParams,
  SyncSocialPublicationMetricsParams,
  UpdateSocialPublicationParams,
  ValidateSocialPublicationParams,
} from "../types/api";
import type {
  PaginatedResponse,
  SocialConnectResponse,
  SocialOAuthCallbackResponse,
  SocialProviderCapability,
  SocialConnection,
  SocialCommentReply,
  SocialPublication,
  SocialPublicationCommentClassificationResult,
  SocialPublicationComment,
  SocialPublicationEngagementSyncResult,
  SocialPublicationCommentReplyResponse,
  SocialPublicationEffect,
  SocialPublicationMetricSnapshot,
  SocialPublicationMutationResponse,
  SocialPublicationValidation,
} from "../types";
import {
  pollScheduledResult,
  prepareScheduledMutation,
  scheduledObservationOptions,
} from "../utils/scheduledResult";

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

    async syncPublicationComments(
      params: SyncSocialPublicationCommentsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<SocialPublicationComment>> {
      const { store_id, publication_id, ...payload } = params;
      return apiConfig.httpClient.post<
        PaginatedResponse<SocialPublicationComment>
      >(
        `/v1/stores/${storeId(store_id)}/social-publications/${publication_id}/comments/sync`,
        payload,
        options,
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

    async syncPublicationCommentThread(
      params: SyncSocialPublicationCommentThreadParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<SocialPublicationComment>> {
      const { store_id, publication_id, comment_id, ...payload } = params;
      return apiConfig.httpClient.post<
        PaginatedResponse<SocialPublicationComment>
      >(
        `/v1/stores/${storeId(store_id)}/social-publications/${publication_id}/comments/${comment_id}/thread/sync`,
        payload,
        options,
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
      const targetStoreId = storeId(store_id);
      const mutation = prepareScheduledMutation(payload, options);
      const requested =
        await apiConfig.httpClient.post<SocialPublicationCommentClassificationResult>(
          `/v1/stores/${targetStoreId}/social-publications/comments/classify`,
          mutation.body,
          mutation.options,
        );
      return pollScheduledResult(
        requested,
        (observationSignal) =>
          apiConfig.httpClient.get<SocialPublicationCommentClassificationResult>(
            `/v1/stores/${targetStoreId}/social-publications/comments/classifications/${requested.run_id}`,
            scheduledObservationOptions(mutation.options, observationSignal),
          ),
        (result) =>
          result.status === "requested" || result.status === "processing",
        options?.signal,
      );
    },

    async getCommentClassificationRun(
      params: GetSocialCommentClassificationRunParams,
      options?: RequestOptions,
    ): Promise<SocialPublicationCommentClassificationResult> {
      return apiConfig.httpClient.get<SocialPublicationCommentClassificationResult>(
        `/v1/stores/${storeId(params.store_id)}/social-publications/comments/classifications/${params.run_id}`,
        options,
      );
    },

    async createCommentReply(
      params: CreateSocialCommentReplyParams,
      options?: RequestOptions,
    ): Promise<SocialPublicationCommentReplyResponse> {
      const { store_id, publication_id, comment_id, ...payload } = params;
      return apiConfig.httpClient.post<SocialPublicationCommentReplyResponse>(
        `/v1/stores/${storeId(store_id)}/social-publications/${publication_id}/comments/${comment_id}/replies`,
        payload,
        options,
      );
    },

    async listCommentReplies(
      params: ListSocialCommentRepliesParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<SocialCommentReply>> {
      const { store_id, publication_id, comment_id, ...queryParams } = params;
      return apiConfig.httpClient.get<PaginatedResponse<SocialCommentReply>>(
        `/v1/stores/${storeId(store_id)}/social-publications/${publication_id}/comments/${comment_id}/replies`,
        {
          ...options,
          params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        },
      );
    },

    async getCommentReply(
      params: GetSocialCommentReplyParams,
      options?: RequestOptions,
    ): Promise<SocialCommentReply> {
      return apiConfig.httpClient.get<SocialCommentReply>(
        `/v1/stores/${storeId(params.store_id)}/social-publications/${params.publication_id}/comments/${params.comment_id}/replies/${params.reply_id}`,
        options,
      );
    },

    async retryCommentReply(
      params: RetrySocialCommentReplyParams,
      options?: RequestOptions,
    ): Promise<SocialCommentReply> {
      return apiConfig.httpClient.post<SocialCommentReply>(
        `/v1/stores/${storeId(params.store_id)}/social-publications/${params.publication_id}/comments/${params.comment_id}/replies/${params.reply_id}/retry`,
        {},
        options,
      );
    },

    async listPublicationEffects(
      params: ListSocialPublicationEffectsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<SocialPublicationEffect>> {
      const { store_id, publication_id, ...queryParams } = params;
      return apiConfig.httpClient.get<PaginatedResponse<SocialPublicationEffect>>(
        `/v1/stores/${storeId(store_id)}/social-publications/${publication_id}/effects`,
        {
          ...options,
          params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        },
      );
    },

    async getPublicationEffect(
      params: GetSocialPublicationEffectParams,
      options?: RequestOptions,
    ): Promise<SocialPublicationEffect> {
      return apiConfig.httpClient.get<SocialPublicationEffect>(
        `/v1/stores/${storeId(params.store_id)}/social-publications/${params.publication_id}/effects/${params.effect_id}`,
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

    async syncPublicationMetrics(
      params: SyncSocialPublicationMetricsParams,
      options?: RequestOptions,
    ): Promise<SocialPublicationMetricSnapshot> {
      return apiConfig.httpClient.post<SocialPublicationMetricSnapshot>(
        `/v1/stores/${storeId(params.store_id)}/social-publications/${params.publication_id}/metrics/sync`,
        {},
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
        `/v1/stores/${storeId(params?.store_id)}/social-connections/capabilities`,
        options,
      );
    },

    async listConnections(
      params?: ListSocialConnectionsParams,
      options?: RequestOptions,
    ): Promise<SocialConnection[]> {
      return apiConfig.httpClient.get<SocialConnection[]>(
        `/v1/stores/${storeId(params?.store_id)}/social-connections`,
        options,
      );
    },

    async connect(
      params: ConnectSocialConnectionParams,
      options?: RequestOptions,
    ): Promise<SocialConnectResponse> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<SocialConnectResponse>(
        `/v1/stores/${storeId(store_id)}/social-connections/oauth/connect`,
        payload,
        options,
      );
    },

    async getOAuthAttempt(
      params: GetSocialOAuthAttemptParams,
      options?: RequestOptions,
    ): Promise<SocialOAuthCallbackResponse> {
      return apiConfig.httpClient.get<SocialOAuthCallbackResponse>(
        `/v1/stores/${storeId(params.store_id)}/social-connections/oauth/attempts/${params.attempt_id}`,
        options,
      );
    },

    async selectDestination(
      params: SelectSocialDestinationParams,
      options?: RequestOptions,
    ): Promise<SocialOAuthCallbackResponse> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<SocialOAuthCallbackResponse>(
        `/v1/stores/${storeId(store_id)}/social-connections/oauth/select-destination`,
        payload,
        options,
      );
    },

    async deleteConnection(
      params: DeleteSocialConnectionParams,
      options?: RequestOptions,
    ): Promise<{ deleted: boolean }> {
      return apiConfig.httpClient.delete<{ deleted: boolean }>(
        `/v1/stores/${storeId(params.store_id)}/social-connections/${params.id}`,
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
