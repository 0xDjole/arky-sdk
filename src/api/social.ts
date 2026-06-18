import type { ApiConfig } from "../index";
import type {
  CancelSocialPublicationParams,
  ConnectSocialProviderParams,
  CreateSocialPublicationParams,
  FakeConnectSocialProviderParams,
  FindSocialChannelCommentsParams,
  FindSocialChannelsParams,
  FindSocialPublicationsParams,
  GetSocialCapabilitiesParams,
  GetSocialChannelAnalyticsParams,
  GetSocialChannelParams,
  GetSocialOAuthAttemptParams,
  GetSocialPublicationParams,
  RequestOptions,
  ReplySocialChannelCommentParams,
  ScheduleSocialPublicationParams,
  SelectSocialDestinationParams,
  UpdateSocialPublicationParams,
  ValidateSocialPublicationParams,
} from "../types/api";
import type {
  Integration,
  PaginatedResponse,
  SocialChannel,
  SocialChannelAnalytics,
  SocialChannelCommentPage,
  SocialChannelCommentReply,
  SocialConnectResponse,
  SocialIntegrationCapability,
  SocialOAuthCallbackResponse,
  SocialPublication,
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

    async getCapabilities(
      params?: GetSocialCapabilitiesParams,
      options?: RequestOptions,
    ): Promise<SocialIntegrationCapability[]> {
      return apiConfig.httpClient.get<SocialIntegrationCapability[]>(
        `/v1/stores/${storeId(params?.store_id)}/integrations/social/capabilities`,
        options,
      );
    },

    async findChannels(
      params?: FindSocialChannelsParams,
      options?: RequestOptions,
    ): Promise<SocialChannel[]> {
      return apiConfig.httpClient.get<SocialChannel[]>(
        `/v1/stores/${storeId(params?.store_id)}/social-channels`,
        options,
      );
    },

    async getChannel(
      params: GetSocialChannelParams,
      options?: RequestOptions,
    ): Promise<SocialChannel> {
      return apiConfig.httpClient.get<SocialChannel>(
        `/v1/stores/${storeId(params.store_id)}/social-channels/${params.integration_id}`,
        options,
      );
    },

    async getChannelAnalytics(
      params: GetSocialChannelAnalyticsParams,
      options?: RequestOptions,
    ): Promise<SocialChannelAnalytics> {
      return apiConfig.httpClient.get<SocialChannelAnalytics>(
        `/v1/stores/${storeId(params.store_id)}/social-channels/${params.integration_id}/analytics`,
        options,
      );
    },

    async findChannelComments(
      params: FindSocialChannelCommentsParams,
      options?: RequestOptions,
    ): Promise<SocialChannelCommentPage> {
      const { store_id, integration_id, ...queryParams } = params;
      return apiConfig.httpClient.get<SocialChannelCommentPage>(
        `/v1/stores/${storeId(store_id)}/social-channels/${integration_id}/comments`,
        {
          ...options,
          params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        },
      );
    },

    async replyToChannelComment(
      params: ReplySocialChannelCommentParams,
      options?: RequestOptions,
    ): Promise<SocialChannelCommentReply> {
      const { store_id, integration_id, comment_id, ...payload } = params;
      return apiConfig.httpClient.post<SocialChannelCommentReply>(
        `/v1/stores/${storeId(store_id)}/social-channels/${integration_id}/comments/${comment_id}/reply`,
        payload,
        options,
      );
    },

    async connect(
      params: ConnectSocialProviderParams,
      options?: RequestOptions,
    ): Promise<SocialConnectResponse> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<SocialConnectResponse>(
        `/v1/stores/${storeId(store_id)}/integrations/oauth/connect`,
        payload,
        options,
      );
    },

    async getOAuthAttempt(
      params: GetSocialOAuthAttemptParams,
      options?: RequestOptions,
    ): Promise<SocialOAuthCallbackResponse> {
      return apiConfig.httpClient.get<SocialOAuthCallbackResponse>(
        `/v1/stores/${storeId(params.store_id)}/integrations/oauth/attempts/${params.attempt_id}`,
        options,
      );
    },

    async selectDestination(
      params: SelectSocialDestinationParams,
      options?: RequestOptions,
    ): Promise<SocialOAuthCallbackResponse> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<SocialOAuthCallbackResponse>(
        `/v1/stores/${storeId(store_id)}/integrations/oauth/select-destination`,
        payload,
        options,
      );
    },

    async fakeConnect(
      params: FakeConnectSocialProviderParams,
      options?: RequestOptions,
    ): Promise<Integration> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<Integration>(
        `/v1/stores/${storeId(store_id)}/integrations/social/${params.provider_id}/fake-connect`,
        payload,
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
