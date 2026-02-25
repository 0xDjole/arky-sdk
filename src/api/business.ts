import type { ApiConfig } from "../index";
import type {
  CreateBusinessParams,
  UpdateBusinessParams,
  DeleteBusinessParams,
  GetBusinessParams,
  GetBusinessesParams,
  TriggerBuildsParams,
  GetSubscriptionPlansParams,
  SubscribeParams,
  CreatePortalSessionParams,
  InviteUserParams,
  RemoveMemberParams,
  HandleInvitationParams,
  TestWebhookParams,
  GetBusinessMediaParams2,
  ProcessRefundParams,
  OAuthConnectParams,
  OAuthDisconnectParams,
  ListIntegrationsParams,
  CreateIntegrationParams,
  UpdateIntegrationParams,
  DeleteIntegrationParams,
  RequestOptions,
} from "../types/api";

export const createBusinessApi = (apiConfig: ApiConfig) => {
  return {
    async createBusiness(
      params: CreateBusinessParams,
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.post(`/v1/businesses`, params, options);
    },

    async updateBusiness(
      params: UpdateBusinessParams,
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.put(
        `/v1/businesses/${params.id}`,
        params,
        options
      );
    },

    async deleteBusiness(
      params: DeleteBusinessParams,
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.delete(
        `/v1/businesses/${params.id}`,
        options
      );
    },

    async getBusiness(params: GetBusinessParams, options?: RequestOptions) {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}`,
        options
      );
    },

    async getBusinesses(params?: GetBusinessesParams, options?: RequestOptions) {
      return apiConfig.httpClient.get(`/v1/businesses`, {
        ...options,
        params,
      });
    },

    async triggerBuilds(params: TriggerBuildsParams, options?: RequestOptions) {
      return apiConfig.httpClient.post(
        `/v1/businesses/${params.id}/trigger-builds`,
        {},
        options
      );
    },

    async getSubscriptionPlans(
      params: GetSubscriptionPlansParams,
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.get("/v1/businesses/plans", options);
    },

    async subscribe(params: SubscribeParams, options?: RequestOptions) {
      return apiConfig.httpClient.put(
        `/v1/businesses/${apiConfig.businessId}/subscribe`,
        params,
        options
      );
    },

    async createPortalSession(
      params: CreatePortalSessionParams,
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/subscription/portal`,
        params,
        options
      );
    },

    async inviteUser(params: InviteUserParams, options?: RequestOptions) {
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/invitation`,
        params,
        options
      );
    },

    async removeMember(params: RemoveMemberParams, options?: RequestOptions) {
      return apiConfig.httpClient.delete(
        `/v1/businesses/${apiConfig.businessId}/members/${params.accountId}`,
        options
      );
    },

    async handleInvitation(
      params: HandleInvitationParams,
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.put(
        `/v1/businesses/${apiConfig.businessId}/invitation`,
        params,
        options
      );
    },

    async testWebhook(params: TestWebhookParams, options?: RequestOptions) {
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/webhooks/test`,
        params.webhook,
        options
      );
    },

    async getBusinessMedia(
      params: GetBusinessMediaParams2,
      options?: RequestOptions
    ) {
      const queryParams: Record<string, any> = {
        limit: params.limit,
      };
      if (params.cursor) queryParams.cursor = params.cursor;
      if (params.ids && params.ids.length > 0) queryParams.ids = params.ids.join(',');
      if (params.query) queryParams.query = params.query;
      if (params.mimeType) queryParams.mimeType = params.mimeType;
      if (params.sortField) queryParams.sortField = params.sortField;
      if (params.sortDirection) queryParams.sortDirection = params.sortDirection;

      return apiConfig.httpClient.get(`/v1/businesses/${params.id}/media`, {
        ...options,
        params: queryParams,
      });
    },

    async processRefund(params: ProcessRefundParams, options?: RequestOptions) {
      const { id, ...payload } = params;
      return apiConfig.httpClient.post(
        `/v1/businesses/${id}/refund`,
        payload,
        options
      );
    },

    async oauthConnect(
      params: OAuthConnectParams,
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.post(
        `/v1/businesses/${params.businessId}/oauth/connect`,
        { provider: params.provider, code: params.code, redirectUri: params.redirectUri },
        options
      );
    },

    async oauthDisconnect(
      params: OAuthDisconnectParams,
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.post(
        `/v1/businesses/${params.businessId}/oauth/disconnect`,
        { provider: params.provider },
        options
      );
    },

    // ── Integration CRUD ──

    async listIntegrations(
      params: ListIntegrationsParams,
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.get(
        `/v1/businesses/${params.businessId}/integrations`,
        options
      );
    },

    async createIntegration(
      params: CreateIntegrationParams,
      options?: RequestOptions
    ) {
      const { businessId, ...payload } = params;
      return apiConfig.httpClient.post(
        `/v1/businesses/${businessId}/integrations`,
        payload,
        options
      );
    },

    async updateIntegration(
      params: UpdateIntegrationParams,
      options?: RequestOptions
    ) {
      const { businessId, id, ...payload } = params;
      return apiConfig.httpClient.put(
        `/v1/businesses/${businessId}/integrations/${id}`,
        payload,
        options
      );
    },

    async deleteIntegration(
      params: DeleteIntegrationParams,
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.delete(
        `/v1/businesses/${params.businessId}/integrations/${params.id}`,
        options
      );
    },

    async getIntegrationConfig(
      params: { businessId: string; type: 'payment' | 'shipping' | 'analytics' },
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.get(
        `/v1/businesses/${params.businessId}/integrations/config/${params.type}`,
        options
      );
    },

  };
};
