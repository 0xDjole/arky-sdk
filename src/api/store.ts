import type { ApiConfig, AdminSessionUpdater } from "../index";
import type {
  CreateStoreParams,
  UpdateStoreParams,
  GetStoreParams,
  GetStoresParams,
  GetSubscriptionPlansParams,
  GetStoreSubscriptionParams,
  CreateStoreSubscriptionActionParams,
  RetryStoreSubscriptionActionParams,
  GetStoreSubscriptionActionParams,
  FindStoreSubscriptionActionsParams,
  FindStoreSubscriptionActionEffectsParams,
  GetStoreSubscriptionActionEffectParams,
  CreatePortalSessionParams,
  AddMemberParams,
  RemoveMemberParams,
  FindStoreMembersParams,
  TestWebhookParams,
  TestWebhookResponse,
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
  PaginatedResponse,
  SubscriptionPlan,
  PaymentStoreConfig,
  BuildHook,
  StoreSubscription,
  StoreSubscriptionAction,
  StoreSubscriptionEffect,
  StoreMember,
  StoreMembership,
} from "../types";

export const createStoreApi = (apiConfig: ApiConfig, _updateSession: AdminSessionUpdater) => {
  return {
    async createStore(params: CreateStoreParams, options?: RequestOptions): Promise<Store> {
      return apiConfig.httpClient.post<Store>(`/v1/stores`, params, options);
    },

    async updateStore(params: UpdateStoreParams, options?: RequestOptions): Promise<Store> {
      return apiConfig.httpClient.put<Store>(`/v1/stores/${params.id}`, params, options);
    },

    async getStore(_params: GetStoreParams, options?: RequestOptions): Promise<Store> {
      return apiConfig.httpClient.get<Store>(`/v1/stores/${apiConfig.storeId}`, options);
    },

    async getStores(params?: GetStoresParams, options?: RequestOptions): Promise<PaginatedResponse<Store>> {
      return apiConfig.httpClient.get<PaginatedResponse<Store>>(`/v1/stores`, {
        ...options,
        params,
      });
    },

    async getSubscriptionPlans(
      _params: GetSubscriptionPlansParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<SubscriptionPlan>> {
      return apiConfig.httpClient.get<PaginatedResponse<SubscriptionPlan>>("/v1/stores/plans", options);
    },

    async createSubscriptionAction(
      params: CreateStoreSubscriptionActionParams,
      options?: RequestOptions,
    ): Promise<StoreSubscriptionAction> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      const response = await apiConfig.httpClient.post<StoreSubscriptionAction>(
        `/v1/stores/${target_store_id}/subscription/actions`,
        payload,
        options,
      );
      if (response.id !== params.action_id) {
        throw new Error("Subscription response did not match the requested action_id");
      }
      return response;
    },

    async getSubscription(params: GetStoreSubscriptionParams = {}, options?: RequestOptions): Promise<StoreSubscription> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<StoreSubscription>(`/v1/stores/${store_id}/subscription`, options);
    },

    async retrySubscriptionAction(params: RetryStoreSubscriptionActionParams, options?: RequestOptions): Promise<StoreSubscriptionAction> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<StoreSubscriptionAction>(
        `/v1/stores/${store_id}/subscription/actions/${params.action_id}/retry`,
        {},
        options,
      );
    },

    async getSubscriptionAction(params: GetStoreSubscriptionActionParams, options?: RequestOptions): Promise<StoreSubscriptionAction> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<StoreSubscriptionAction>(`/v1/stores/${store_id}/subscription/actions/${params.action_id}`, options);
    },

    async findSubscriptionActionEffects(
      params: FindStoreSubscriptionActionEffectsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<StoreSubscriptionEffect>> {
      const { store_id, action_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<StoreSubscriptionEffect>>(
        `/v1/stores/${store_id || apiConfig.storeId}/subscription/actions/${action_id}/effects`,
        { ...options, params: query },
      );
    },

    async getSubscriptionActionEffect(
      params: GetStoreSubscriptionActionEffectParams,
      options?: RequestOptions,
    ): Promise<StoreSubscriptionEffect> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<StoreSubscriptionEffect>(
        `/v1/stores/${store_id}/subscription/actions/${params.action_id}/effects/${params.effect_id}`,
        options,
      );
    },

    async findSubscriptionActions(
      params: FindStoreSubscriptionActionsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<StoreSubscriptionAction>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<StoreSubscriptionAction>>(
        `/v1/stores/${store_id || apiConfig.storeId}/subscription/actions`,
        { ...options, params: query },
      );
    },

    async createPortalSession(params: CreatePortalSessionParams, options?: RequestOptions): Promise<{ portal_url: string }> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<{ portal_url: string }>(
        `/v1/stores/${store_id}/subscription/portal`,
        { return_url: params.return_url },
        options,
      );
    },

    async addMember(params: AddMemberParams, options?: RequestOptions): Promise<boolean> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<boolean>(`/v1/stores/${store_id || apiConfig.storeId}/members`, payload, options);
    },

    async inviteUser(params: AddMemberParams, options?: RequestOptions): Promise<boolean> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<boolean>(`/v1/stores/${store_id || apiConfig.storeId}/invitation`, payload, options);
    },

    async findMembers(params: FindStoreMembersParams = {}, options?: RequestOptions): Promise<PaginatedResponse<StoreMember>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<StoreMember>>(`/v1/stores/${store_id || apiConfig.storeId}/members`, {
        ...options,
        params: query,
      });
    },

    async findOwnMemberships(options?: RequestOptions): Promise<PaginatedResponse<StoreMembership>> {
      return apiConfig.httpClient.get<PaginatedResponse<StoreMembership>>("/v1/stores/memberships", options);
    },

    async removeMember(params: RemoveMemberParams, options?: RequestOptions): Promise<boolean> {
      return apiConfig.httpClient.delete<boolean>(
        `/v1/stores/${params.store_id || apiConfig.storeId}/members/${params.account_id}`,
        options,
      );
    },

    async testWebhook(params: TestWebhookParams, options?: RequestOptions): Promise<TestWebhookResponse> {
      return apiConfig.httpClient.post<TestWebhookResponse>(`/v1/stores/${apiConfig.storeId}/webhooks/test`, params, options);
    },

    async listBuildHooks(params: ListBuildHooksParams, options?: RequestOptions): Promise<BuildHook[]> {
      return apiConfig.httpClient.get<BuildHook[]>(`/v1/stores/${params.store_id}/build-hooks`, options);
    },

    async createBuildHook(params: CreateBuildHookParams, options?: RequestOptions): Promise<BuildHook> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<BuildHook>(`/v1/stores/${store_id}/build-hooks`, payload, options);
    },

    async updateBuildHook(params: UpdateBuildHookParams, options?: RequestOptions): Promise<BuildHook> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<BuildHook>(`/v1/stores/${store_id}/build-hooks/${id}`, payload, options);
    },

    async deleteBuildHook(params: DeleteBuildHookParams, options?: RequestOptions): Promise<{ deleted: boolean }> {
      return apiConfig.httpClient.delete<{ deleted: boolean }>(`/v1/stores/${params.store_id}/build-hooks/${params.id}`, options);
    },

    async getPaymentConfig(params: { store_id: string }, options?: RequestOptions): Promise<PaymentStoreConfig | null> {
      return apiConfig.httpClient.get<PaymentStoreConfig | null>(`/v1/stores/${params.store_id}/config/payment`, options);
    },

    async listWebhooks(params: ListWebhooksParams, options?: RequestOptions): Promise<Webhook[]> {
      return apiConfig.httpClient.get<Webhook[]>(`/v1/stores/${params.store_id}/webhooks`, options);
    },

    async createWebhook(params: CreateWebhookParams, options?: RequestOptions): Promise<Webhook> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<Webhook>(`/v1/stores/${store_id}/webhooks`, payload, options);
    },

    async updateWebhook(params: UpdateWebhookParams, options?: RequestOptions): Promise<Webhook> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<Webhook>(`/v1/stores/${store_id}/webhooks/${id}`, payload, options);
    },

    async deleteWebhook(params: DeleteWebhookParams, options?: RequestOptions): Promise<{ deleted: boolean }> {
      return apiConfig.httpClient.delete<{ deleted: boolean }>(`/v1/stores/${params.store_id}/webhooks/${params.id}`, options);
    },
  };
};
