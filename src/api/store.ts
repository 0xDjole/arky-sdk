import type { ApiConfig } from "../index";
import type {
  CreateStoreParams,
  UpdateStoreParams,
  DeleteStoreParams,
  GetStoreParams,
  GetStoresParams,
  GetSubscriptionPlansParams,
  SubscribeParams,
  CreatePortalSessionParams,
  InviteUserParams,
  RemoveMemberParams,
  HandleInvitationParams,
  TestWebhookParams,
  GetStoreMediaParams2,
  OAuthConnectParams,
  OAuthDisconnectParams,
  ListIntegrationsParams,
  CreateIntegrationParams,
  UpdateIntegrationParams,
  DeleteIntegrationParams,
  ListWebhooksParams,
  CreateWebhookParams,
  UpdateWebhookParams,
  DeleteWebhookParams,
  RequestOptions,
} from "../types/api";

export const createStoreApi = (apiConfig: ApiConfig) => {
  return {
    async createStore(
      params: CreateStoreParams,
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.post(`/v1/stores`, params, options);
    },

    async updateStore(
      params: UpdateStoreParams,
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.put(
        `/v1/stores/${params.id}`,
        params,
        options
      );
    },

    async deleteStore(
      params: DeleteStoreParams,
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.delete(
        `/v1/stores/${params.id}`,
        options
      );
    },

    async getStore(params: GetStoreParams, options?: RequestOptions) {
      return apiConfig.httpClient.get(
        `/v1/stores/${apiConfig.storeId}`,
        options
      );
    },

    async getStores(params?: GetStoresParams, options?: RequestOptions) {
      return apiConfig.httpClient.get(`/v1/stores`, {
        ...options,
        params,
      });
    },

    async getSubscriptionPlans(
      params: GetSubscriptionPlansParams,
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.get("/v1/stores/plans", options);
    },

    async subscribe(params: SubscribeParams, options?: RequestOptions) {
      const { store_id, plan_id, success_url, cancel_url } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put(
        `/v1/stores/${target_store_id}/subscribe`,
        { plan_id, success_url, cancel_url },
        options
      );
    },

    async createPortalSession(
      params: CreatePortalSessionParams,
      options?: RequestOptions
    ) {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.post(
        `/v1/stores/${store_id}/subscription/portal`,
        { return_url: params.return_url },
        options
      );
    },

    async inviteUser(params: InviteUserParams, options?: RequestOptions) {
      return apiConfig.httpClient.post(
        `/v1/stores/${apiConfig.storeId}/invitation`,
        params,
        options
      );
    },

    async removeMember(params: RemoveMemberParams, options?: RequestOptions) {
      return apiConfig.httpClient.delete(
        `/v1/stores/${apiConfig.storeId}/members/${params.account_id}`,
        options
      );
    },

    async handleInvitation(
      params: HandleInvitationParams,
      options?: RequestOptions
    ) {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.put(
        `/v1/stores/${store_id || apiConfig.storeId}/invitation`,
        payload,
        options
      );
    },

    async testWebhook(params: TestWebhookParams, options?: RequestOptions) {
      return apiConfig.httpClient.post(
        `/v1/stores/${apiConfig.storeId}/webhooks/test`,
        params.webhook,
        options
      );
    },

    async getStoreMedia(
      params: GetStoreMediaParams2,
      options?: RequestOptions
    ) {
      const queryParams: Record<string, any> = {
        limit: params.limit,
      };
      if (params.cursor) queryParams.cursor = params.cursor;
      if (params.ids && params.ids.length > 0) queryParams.ids = params.ids.join(',');
      if (params.query) queryParams.query = params.query;
      if (params.mime_type) queryParams.mime_type = params.mime_type;
      if (params.sort_field) queryParams.sort_field = params.sort_field;
      if (params.sort_direction) queryParams.sort_direction = params.sort_direction;

      return apiConfig.httpClient.get(`/v1/stores/${params.id}/media`, {
        ...options,
        params: queryParams,
      });
    },

    async oauthConnect(
      params: OAuthConnectParams,
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.post(
        `/v1/stores/${params.store_id}/oauth/connect`,
        { provider: params.provider, code: params.code, redirect_uri: params.redirect_uri },
        options
      );
    },

    async oauthDisconnect(
      params: OAuthDisconnectParams,
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.post(
        `/v1/stores/${params.store_id}/oauth/disconnect`,
        { provider: params.provider },
        options
      );
    },


    async listIntegrations(
      params: ListIntegrationsParams,
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.get(
        `/v1/stores/${params.store_id}/integrations`,
        options
      );
    },

    async createIntegration(
      params: CreateIntegrationParams,
      options?: RequestOptions
    ) {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post(
        `/v1/stores/${store_id}/integrations`,
        payload,
        options
      );
    },

    async updateIntegration(
      params: UpdateIntegrationParams,
      options?: RequestOptions
    ) {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put(
        `/v1/stores/${store_id}/integrations/${id}`,
        payload,
        options
      );
    },

    async deleteIntegration(
      params: DeleteIntegrationParams,
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.delete(
        `/v1/stores/${params.store_id}/integrations/${params.id}`,
        options
      );
    },

    async getIntegrationConfig(
      params: { store_id: string; type: 'payment' | 'shipping' },
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.get(
        `/v1/stores/${params.store_id}/integrations/config/${params.type}`,
        options
      );
    },


    async listWebhooks(
      params: ListWebhooksParams,
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.get(
        `/v1/stores/${params.store_id}/webhooks`,
        options
      );
    },

    async createWebhook(
      params: CreateWebhookParams,
      options?: RequestOptions
    ) {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post(
        `/v1/stores/${store_id}/webhooks`,
        payload,
        options
      );
    },

    async updateWebhook(
      params: UpdateWebhookParams,
      options?: RequestOptions
    ) {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put(
        `/v1/stores/${store_id}/webhooks/${id}`,
        payload,
        options
      );
    },

    async deleteWebhook(
      params: DeleteWebhookParams,
      options?: RequestOptions
    ) {
      return apiConfig.httpClient.delete(
        `/v1/stores/${params.store_id}/webhooks/${params.id}`,
        options
      );
    },

  };
};
