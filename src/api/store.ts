import type { ApiConfig, AdminSessionUpdater } from "../index";
import type {
  CreateStoreParams,
  UpdateStoreParams,
  DeleteStoreParams,
  GetStoreParams,
  GetStoresParams,
  GetSubscriptionPlansParams,
  SubscribeParams,
  CreatePortalSessionParams,
  AddMemberParams,
  InviteUserParams,
  RemoveMemberParams,
  TestWebhookParams,
  GetStoreMediaParams2,
  ListBuildHooksParams,
  CreateBuildHookParams,
  UpdateBuildHookParams,
  DeleteBuildHookParams,
  ListWebhooksParams,
  CreateWebhookParams,
  UpdateWebhookParams,
  DeleteWebhookParams,
  RequestOptions,
} from "../types/api";
import type {
  Store,
  Webhook,
  Media,
  PaginatedResponse,
  SubscriptionPlan,
  StoreRuntimeConfig,
  BuildHook,
} from "../types";

export const createStoreApi = (
  apiConfig: ApiConfig,
  _updateSession: AdminSessionUpdater,
) => {
  return {
    async createStore(
      params: CreateStoreParams,
      options?: RequestOptions,
    ): Promise<Store> {
      return apiConfig.httpClient.post<Store>(`/v1/stores`, params, options);
    },

    async updateStore(
      params: UpdateStoreParams,
      options?: RequestOptions,
    ): Promise<Store> {
      return apiConfig.httpClient.put<Store>(
        `/v1/stores/${params.id}`,
        params,
        options,
      );
    },

    async deleteStore(
      params: DeleteStoreParams,
      options?: RequestOptions,
    ): Promise<{ deleted: boolean }> {
      return apiConfig.httpClient.delete<{ deleted: boolean }>(
        `/v1/stores/${params.id}`,
        options,
      );
    },

    async getStore(
      _params: GetStoreParams,
      options?: RequestOptions,
    ): Promise<Store> {
      return apiConfig.httpClient.get<Store>(
        `/v1/stores/${apiConfig.storeId}`,
        options,
      );
    },

    async getStores(
      params?: GetStoresParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Store>> {
      return apiConfig.httpClient.get<PaginatedResponse<Store>>(`/v1/stores`, {
        ...options,
        params,
      });
    },

    async getSubscriptionPlans(
      _params: GetSubscriptionPlansParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<SubscriptionPlan>> {
      return apiConfig.httpClient.get<PaginatedResponse<SubscriptionPlan>>(
        "/v1/stores/plans",
        options,
      );
    },

    async subscribe(
      params: SubscribeParams,
      options?: RequestOptions,
    ): Promise<{ checkout_url?: string }> {
      const { store_id, plan_id, success_url, cancel_url } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<{ checkout_url?: string }>(
        `/v1/stores/${target_store_id}/subscribe`,
        { plan_id, success_url, cancel_url },
        options,
      );
    },

    async createPortalSession(
      params: CreatePortalSessionParams,
      options?: RequestOptions,
    ): Promise<{ portal_url: string }> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<{ portal_url: string }>(
        `/v1/stores/${store_id}/subscription/portal`,
        { return_url: params.return_url },
        options,
      );
    },

    async addMember(
      params: AddMemberParams,
      options?: RequestOptions,
    ): Promise<boolean> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<boolean>(
        `/v1/stores/${store_id || apiConfig.storeId}/members`,
        payload,
        options,
      );
    },

    async inviteUser(
      params: InviteUserParams,
      options?: RequestOptions,
    ): Promise<boolean> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<boolean>(
        `/v1/stores/${store_id || apiConfig.storeId}/members`,
        payload,
        options,
      );
    },

    async removeMember(
      params: RemoveMemberParams,
      options?: RequestOptions,
    ): Promise<{ removed: boolean }> {
      return apiConfig.httpClient.delete<{ removed: boolean }>(
        `/v1/stores/${apiConfig.storeId}/members/${params.account_id}`,
        options,
      );
    },

    async testWebhook(
      params: TestWebhookParams,
      options?: RequestOptions,
    ): Promise<{ tested: boolean }> {
      return apiConfig.httpClient.post<{ tested: boolean }>(
        `/v1/stores/${apiConfig.storeId}/webhooks/test`,
        params,
        options,
      );
    },

    async getStoreMedia(
      params: GetStoreMediaParams2,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Media>> {
      const queryParams: Record<string, unknown> = {
        limit: params.limit,
      };
      if (params.cursor) queryParams.cursor = params.cursor;
      if (params.ids && params.ids.length > 0)
        queryParams.ids = JSON.stringify(params.ids);
      if (params.query) queryParams.query = params.query;
      if (params.mime_type) queryParams.mime_type = params.mime_type;
      if (params.sort_field) queryParams.sort_field = params.sort_field;
      if (params.sort_direction)
        queryParams.sort_direction = params.sort_direction;

      return apiConfig.httpClient.get<PaginatedResponse<Media>>(
        `/v1/stores/${params.id}/media`,
        {
          ...options,
          params: queryParams,
        },
      );
    },

    async listBuildHooks(
      params: ListBuildHooksParams,
      options?: RequestOptions,
    ): Promise<BuildHook[]> {
      return apiConfig.httpClient.get<BuildHook[]>(
        `/v1/stores/${params.store_id}/build-hooks`,
        options,
      );
    },

    async createBuildHook(
      params: CreateBuildHookParams,
      options?: RequestOptions,
    ): Promise<BuildHook> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<BuildHook>(
        `/v1/stores/${store_id}/build-hooks`,
        payload,
        options,
      );
    },

    async updateBuildHook(
      params: UpdateBuildHookParams,
      options?: RequestOptions,
    ): Promise<BuildHook> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<BuildHook>(
        `/v1/stores/${store_id}/build-hooks/${id}`,
        payload,
        options,
      );
    },

    async deleteBuildHook(
      params: DeleteBuildHookParams,
      options?: RequestOptions,
    ): Promise<{ deleted: boolean }> {
      return apiConfig.httpClient.delete<{ deleted: boolean }>(
        `/v1/stores/${params.store_id}/build-hooks/${params.id}`,
        options,
      );
    },

    async getStoreConfig(
      params: { store_id: string; type: "payment" | "shipping" },
      options?: RequestOptions,
    ): Promise<StoreRuntimeConfig> {
      return apiConfig.httpClient.get<StoreRuntimeConfig>(
        `/v1/stores/${params.store_id}/config/${params.type}`,
        options,
      );
    },

    async listWebhooks(
      params: ListWebhooksParams,
      options?: RequestOptions,
    ): Promise<Webhook[]> {
      return apiConfig.httpClient.get<Webhook[]>(
        `/v1/stores/${params.store_id}/webhooks`,
        options,
      );
    },

    async createWebhook(
      params: CreateWebhookParams,
      options?: RequestOptions,
    ): Promise<Webhook> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<Webhook>(
        `/v1/stores/${store_id}/webhooks`,
        payload,
        options,
      );
    },

    async updateWebhook(
      params: UpdateWebhookParams,
      options?: RequestOptions,
    ): Promise<Webhook> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<Webhook>(
        `/v1/stores/${store_id}/webhooks/${id}`,
        payload,
        options,
      );
    },

    async deleteWebhook(
      params: DeleteWebhookParams,
      options?: RequestOptions,
    ): Promise<{ deleted: boolean }> {
      return apiConfig.httpClient.delete<{ deleted: boolean }>(
        `/v1/stores/${params.store_id}/webhooks/${params.id}`,
        options,
      );
    },
  };
};
