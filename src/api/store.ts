import type { ApiConfig, AdminSessionUpdater } from "../services/clientTypes";
import type {
  CreateStoreParams,
  UpdateStoreParams,
  GetStoreParams,
  RequestStoreDeletionParams,
  GetStoresParams,
  GetStoreSubscriptionParams,
  CancelStoreSubscriptionParams,
  ReactivateStoreSubscriptionParams,
  SelectStoreSubscriptionParams,
  CreatePortalSessionParams,
  AddMemberParams,
  RemoveMemberParams,
  TransferStoreOwnershipParams,
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
import type { StoreDeletionResult } from "../types";
import {
  DurableRequestStorageError,
  clearDurableRequest,
  durableRequestPayload,
  getOrCreateDurableRequest,
  readDurableRequest,
  withDurableRequestLock,
} from "../utils/durableRequest";
import type {
  Store,
  Webhook,
  PaginatedResponse,
  SubscriptionPlan,
  BuildHook,
  StoreSubscription,
  StoreMember,
  StoreMembership,
} from "../types";

type StoreSubscriptionCheckoutRequest = {
  checkout_id: string;
  plan_id: string;
  return_url: string;
};

const storeSubscriptionCheckoutLabel = "Store subscription Checkout";
const canonicalUuidV4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function browserHasDurableStorage(): boolean {
  return typeof globalThis.window !== "undefined";
}

function responseStatusCode(value: unknown): number | null {
  if (typeof value !== "object" || value === null || !("statusCode" in value)) {
    return null;
  }
  return typeof value.statusCode === "number" ? value.statusCode : null;
}

function newStoreSubscriptionCheckoutId(): string {
  const id = globalThis.crypto?.randomUUID?.();
  if (!id || !canonicalUuidV4.test(id)) {
    throw new DurableRequestStorageError(
      `Cannot safely start ${storeSubscriptionCheckoutLabel} because UUID-v4 generation is unavailable`,
    );
  }
  return id;
}

function storeSubscriptionCheckoutRequest(
  params: SelectStoreSubscriptionParams,
  retainedCheckoutId?: string,
): StoreSubscriptionCheckoutRequest {
  const checkout_id =
    params.checkout_id ||
    retainedCheckoutId ||
    newStoreSubscriptionCheckoutId();
  if (!canonicalUuidV4.test(checkout_id)) {
    throw new DurableRequestStorageError(
      `Cannot safely start ${storeSubscriptionCheckoutLabel} because checkout_id is not a canonical UUID-v4`,
    );
  }
  return {
    checkout_id,
    plan_id: params.plan_id,
    return_url: params.return_url,
  };
}

function persistedStoreSubscriptionCheckoutRequest(
  value: unknown,
): StoreSubscriptionCheckoutRequest {
  if (
    typeof value !== "object" ||
    value === null ||
    Object.keys(value).sort().join(",") !== "checkout_id,plan_id,return_url" ||
    typeof (value as Record<string, unknown>).checkout_id !== "string" ||
    !canonicalUuidV4.test((value as Record<string, string>).checkout_id) ||
    typeof (value as Record<string, unknown>).plan_id !== "string" ||
    !(value as Record<string, string>).plan_id ||
    typeof (value as Record<string, unknown>).return_url !== "string" ||
    !(value as Record<string, string>).return_url
  ) {
    throw new DurableRequestStorageError(
      `Cannot safely start ${storeSubscriptionCheckoutLabel} because its durable request payload is invalid`,
    );
  }
  return value as StoreSubscriptionCheckoutRequest;
}

function storeSubscriptionCheckoutIsTerminal(
  subscription: StoreSubscription,
  checkoutId: string,
): boolean {
  if (!subscription.checkout) return true;
  return (
    subscription.checkout.id === checkoutId &&
    ["completed", "expired", "failed"].includes(
      subscription.checkout.status.type,
    )
  );
}

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

    async getStore(
      params: GetStoreParams = {},
      options?: RequestOptions,
    ): Promise<Store> {
      const store_id = params.id || apiConfig.storeId;
      return apiConfig.httpClient.get<Store>(`/v1/stores/${store_id}`, options);
    },

    async requestDeletion(
      params: RequestStoreDeletionParams,
      options?: RequestOptions,
    ): Promise<StoreDeletionResult> {
      const store_id = params.id || apiConfig.storeId;
      return apiConfig.httpClient.post<StoreDeletionResult>(
        `/v1/stores/${store_id}/deletion`,
        { confirmation: params.confirmation },
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

    async regeneratePublishableKey(
      params: { store_id?: string } = {},
      options?: RequestOptions,
    ): Promise<Store> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Store>(
        `/v1/stores/${store_id}/publishable-key/regenerate`,
        {},
        options,
      );
    },

    async getSubscriptionPlans(
      options?: RequestOptions,
    ): Promise<PaginatedResponse<SubscriptionPlan>> {
      return apiConfig.httpClient.get<PaginatedResponse<SubscriptionPlan>>(
        "/v1/stores/plans",
        options,
      );
    },

    async selectSubscription(
      params: SelectStoreSubscriptionParams,
      options?: RequestOptions,
    ): Promise<StoreSubscription> {
      const target_store_id = params.store_id || apiConfig.storeId;
      const endpoint = `/v1/stores/${target_store_id}/subscription`;
      const post = (payload: StoreSubscriptionCheckoutRequest) =>
        apiConfig.httpClient.post<StoreSubscription>(
          endpoint,
          payload,
          options,
        );

      if (!browserHasDurableStorage()) {
        return post(storeSubscriptionCheckoutRequest(params));
      }

      const storageKey = `arky:store-subscription-checkout:${target_store_id}`;
      return withDurableRequestLock(
        storageKey,
        storeSubscriptionCheckoutLabel,
        async () => {
          const retained = readDurableRequest(
            storageKey,
            storeSubscriptionCheckoutLabel,
          );
          const retainedPayload = retained
            ? persistedStoreSubscriptionCheckoutRequest(
                durableRequestPayload(retained),
              )
            : undefined;
          let payload = storeSubscriptionCheckoutRequest(
            params,
            retainedPayload?.checkout_id,
          );

          if (retained && retained.requestJson !== JSON.stringify(payload)) {
            const current = await apiConfig.httpClient.get<StoreSubscription>(
              endpoint,
              options,
            );
            if (
              !storeSubscriptionCheckoutIsTerminal(
                current,
                retainedPayload!.checkout_id,
              )
            ) {
              getOrCreateDurableRequest(
                storageKey,
                payload,
                storeSubscriptionCheckoutLabel,
              );
            }
            clearDurableRequest(retained, storeSubscriptionCheckoutLabel);
            payload = storeSubscriptionCheckoutRequest(params);
          }

          const durable = getOrCreateDurableRequest(
            storageKey,
            payload,
            storeSubscriptionCheckoutLabel,
          );
          const exactPayload = persistedStoreSubscriptionCheckoutRequest(
            durableRequestPayload(durable),
          );
          let subscription: StoreSubscription;
          try {
            subscription = await post(exactPayload);
          } catch (error) {
            if (responseStatusCode(error) === 400) {
              clearDurableRequest(durable, storeSubscriptionCheckoutLabel);
            }
            throw error;
          }
          if (
            subscription.checkout &&
            subscription.checkout.id !== exactPayload.checkout_id
          ) {
            throw new DurableRequestStorageError(
              `Cannot safely continue ${storeSubscriptionCheckoutLabel} because Server returned a different Checkout`,
            );
          }
          if (
            !subscription.checkout &&
            subscription.plan_access?.plan_id !== exactPayload.plan_id
          ) {
            throw new DurableRequestStorageError(
              `Cannot safely continue ${storeSubscriptionCheckoutLabel} because Server returned neither its Checkout nor the requested plan access`,
            );
          }
          clearDurableRequest(durable, storeSubscriptionCheckoutLabel);
          return subscription;
        },
      );
    },

    async getSubscription(
      params: GetStoreSubscriptionParams = {},
      options?: RequestOptions,
    ): Promise<StoreSubscription> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<StoreSubscription>(
        `/v1/stores/${store_id}/subscription`,
        options,
      );
    },

    async cancelSubscription(
      params: CancelStoreSubscriptionParams,
      options?: RequestOptions,
    ): Promise<StoreSubscription> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<StoreSubscription>(
        `/v1/stores/${store_id}/subscription/cancel`,
        { mode: params.mode },
        options,
      );
    },

    async reactivateSubscription(
      params: ReactivateStoreSubscriptionParams = {},
      options?: RequestOptions,
    ): Promise<StoreSubscription> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<StoreSubscription>(
        `/v1/stores/${store_id}/subscription/reactivate`,
        {},
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
      params: AddMemberParams,
      options?: RequestOptions,
    ): Promise<boolean> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<boolean>(
        `/v1/stores/${store_id || apiConfig.storeId}/invitation`,
        payload,
        options,
      );
    },

    async transferOwnership(
      params: TransferStoreOwnershipParams,
      options?: RequestOptions,
    ): Promise<StoreMembership> {
      const store_id = params.store_id || apiConfig.storeId;
      if (!canonicalUuidV4.test(store_id) || !canonicalUuidV4.test(params.account_id)) {
        throw new TypeError("Ownership transfer requires canonical Store and Account UUIDs");
      }
      return apiConfig.httpClient.post<StoreMembership>(
        `/v1/stores/${store_id}/ownership/transfer`,
        { account_id: params.account_id },
        options,
      );
    },

    async findMembers(
      params: FindStoreMembersParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<StoreMember>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<StoreMember>>(
        `/v1/stores/${store_id || apiConfig.storeId}/members`,
        {
          ...options,
          params: query,
        },
      );
    },

    async findOwnMemberships(
      options?: RequestOptions,
    ): Promise<PaginatedResponse<StoreMembership>> {
      return apiConfig.httpClient.get<PaginatedResponse<StoreMembership>>(
        "/v1/stores/memberships",
        options,
      );
    },

    async removeMember(
      params: RemoveMemberParams,
      options?: RequestOptions,
    ): Promise<boolean> {
      return apiConfig.httpClient.delete<boolean>(
        `/v1/stores/${params.store_id || apiConfig.storeId}/members/${params.account_id}`,
        options,
      );
    },

    async testWebhook(
      params: TestWebhookParams,
      options?: RequestOptions,
    ): Promise<TestWebhookResponse> {
      return apiConfig.httpClient.post<TestWebhookResponse>(
        `/v1/stores/${apiConfig.storeId}/webhooks/test`,
        params,
        options,
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
