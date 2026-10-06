import { requireStoreId } from "../utils/storeTarget";
import { createStoreCommerceApi } from "./storeCommerce";
import type { StoreCustomerWorkspacePresentation, UpdateStoreCustomerWorkspaceParams } from "../types/storeCustomerWorkspace";
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
  FindOwnStoreMembershipsParams,
  GetOwnStoreMembershipParams,
  TestWebhookParams,
  TestWebhookResponse,
  ListWebhooksParams,
  CreateWebhookParams,
  UpdateWebhookParams,
  DeleteWebhookParams,
  RequestOptions,
} from "../types/api";
import type { StoreDeletionResult } from "../types";
import type { ChangeStoreMemberStatusParams, UpdateStoreMemberRolesParams } from "../types/storeRole";
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
  StorePlan,
  StoreSubscription,
  StoreMember,
  StoreMembership,
  StoreMembershipWithStoreName,
} from "../types";

type StoreSubscriptionCheckoutRequest = {
  checkout_id: string;
  plan_id: string;
  return_url: string;
};

const storeSubscriptionCheckoutLabel = "Store subscription Checkout";
const canonicalUuidV4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function storeSubscriptionCheckoutRequest(params: SelectStoreSubscriptionParams): StoreSubscriptionCheckoutRequest {
  if (typeof params.checkout_id !== "string" || !canonicalUuidV4.test(params.checkout_id)) {
    throw new TypeError("Store plan selection requires the caller's canonical UUID-v4 checkout_id");
  }
  return { checkout_id: params.checkout_id, plan_id: params.plan_id, return_url: params.return_url };
}

function responseStatusCode(value: unknown): number | null {
  if (typeof value !== "object" || value === null || !("statusCode" in value)) return null;
  return typeof value.statusCode === "number" ? value.statusCode : null;
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

export const createStoreApi = (
  apiConfig: ApiConfig,
  _updateSession: AdminSessionUpdater,
) => {
  return {
    ...createStoreCommerceApi(apiConfig),

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
        `/v1/stores/${requireStoreId(params.id)}`,
        {
          name: params.name,
          default_sales_channel_id: params.default_sales_channel_id,
          timezone: params.timezone,
          default_language: params.default_language,
          supported_languages: params.supported_languages,
          billing_email: params.billing_email,
          contact_email: params.contact_email,
        },
        options,
      );
    },

    async getStore(
      params: GetStoreParams,
      options?: RequestOptions,
    ): Promise<Store> {
      const store_id = requireStoreId(params.id);
      return apiConfig.httpClient.get<Store>(`/v1/stores/${requireStoreId(store_id)}`, options);
    },

    async requestDeletion(
      params: RequestStoreDeletionParams,
      options?: RequestOptions,
    ): Promise<StoreDeletionResult> {
      const store_id = requireStoreId(params.id);
      return apiConfig.httpClient.post<StoreDeletionResult>(
        `/v1/stores/${requireStoreId(store_id)}/deletion`,
        { confirmation: params.confirmation },
        options,
      );
    },

    async getCustomerWorkspace(
      params: GetStoreParams,
      options?: RequestOptions,
    ): Promise<StoreCustomerWorkspacePresentation> {
      const storeId = requireStoreId(params.id);
      return apiConfig.httpClient.get<StoreCustomerWorkspacePresentation>(
        `/v1/stores/${requireStoreId(storeId)}/customer-workspace`, options,
      );
    },

    async updateCustomerWorkspace(
      params: UpdateStoreCustomerWorkspaceParams,
      options?: RequestOptions,
    ): Promise<Store> {
      const storeId = requireStoreId(params.id);
      return apiConfig.httpClient.put<Store>(
        `/v1/stores/${requireStoreId(storeId)}/customer-workspace`,
        { expected_revision: params.expected_revision, customer_workspace: params.customer_workspace }, options,
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

    async getStorePlans(
      options?: RequestOptions,
    ): Promise<PaginatedResponse<StorePlan>> {
      return apiConfig.httpClient.get<PaginatedResponse<StorePlan>>(
        "/v1/stores/plans",
        options,
      );
    },

    async selectSubscription(params: SelectStoreSubscriptionParams, options?: RequestOptions): Promise<StoreSubscription> {
      const storeId = requireStoreId(params.store_id);
      const payload = storeSubscriptionCheckoutRequest(params);
      const result = await apiConfig.httpClient.post<StoreSubscription>(`/v1/stores/${storeId}/subscription`, payload, options);
      if ((result.checkout && result.checkout.id !== payload.checkout_id) || (!result.checkout && result.plan_access?.plan_id !== payload.plan_id)) {
        throw new DurableRequestStorageError("Store plan selection returned neither its Checkout nor the requested plan access");
      }
      return result;
    },

    async retainSubscriptionSelection(params: SelectStoreSubscriptionParams): Promise<void> {
      const storeId = requireStoreId(params.store_id);
      const payload = storeSubscriptionCheckoutRequest(params);
      const key = `arky:store-subscription-checkout:${storeId}`;
      await withDurableRequestLock(key, storeSubscriptionCheckoutLabel, async () => {
        getOrCreateDurableRequest(key, payload, storeSubscriptionCheckoutLabel);
      });
    },

    async pendingSubscriptionSelection(params: GetStoreSubscriptionParams): Promise<StoreSubscriptionCheckoutRequest | null> {
      const key = `arky:store-subscription-checkout:${requireStoreId(params.store_id)}`;
      return withDurableRequestLock(key, storeSubscriptionCheckoutLabel, async () => {
        const retained = readDurableRequest(key, storeSubscriptionCheckoutLabel);
        return retained ? persistedStoreSubscriptionCheckoutRequest(durableRequestPayload(retained)) : null;
      });
    },

    async recoverSubscriptionSelection(params: GetStoreSubscriptionParams, options?: RequestOptions): Promise<StoreSubscription | null> {
      const storeId = requireStoreId(params.store_id);
      const key = `arky:store-subscription-checkout:${storeId}`;
      return withDurableRequestLock(key, storeSubscriptionCheckoutLabel, async () => {
        const retained = readDurableRequest(key, storeSubscriptionCheckoutLabel);
        if (!retained) return null;
        const payload = persistedStoreSubscriptionCheckoutRequest(durableRequestPayload(retained));
        let result: StoreSubscription;
        try {
          result = await apiConfig.httpClient.post<StoreSubscription>(`/v1/stores/${storeId}/subscription`, payload, options);
        } catch (error) {
          if (responseStatusCode(error) === 400) clearDurableRequest(retained, storeSubscriptionCheckoutLabel);
          throw error;
        }
        if ((result.checkout && result.checkout.id !== payload.checkout_id) || (!result.checkout && result.plan_access?.plan_id !== payload.plan_id)) {
          throw new DurableRequestStorageError("Recovered plan selection returned neither its Checkout nor the requested plan access");
        }
        clearDurableRequest(retained, storeSubscriptionCheckoutLabel);
        return result;
      });
    },

    async getSubscription(
      params: GetStoreSubscriptionParams,
      options?: RequestOptions,
    ): Promise<StoreSubscription> {
      const store_id = requireStoreId(params.store_id);
      return apiConfig.httpClient.get<StoreSubscription>(
        `/v1/stores/${requireStoreId(store_id)}/subscription`,
        options,
      );
    },

    async cancelSubscription(
      params: CancelStoreSubscriptionParams,
      options?: RequestOptions,
    ): Promise<StoreSubscription> {
      const store_id = requireStoreId(params.store_id);
      return apiConfig.httpClient.post<StoreSubscription>(
        `/v1/stores/${requireStoreId(store_id)}/subscription/cancel`,
        { mode: params.mode },
        options,
      );
    },

    async reactivateSubscription(
      params: ReactivateStoreSubscriptionParams,
      options?: RequestOptions,
    ): Promise<StoreSubscription> {
      const store_id = requireStoreId(params.store_id);
      return apiConfig.httpClient.post<StoreSubscription>(
        `/v1/stores/${requireStoreId(store_id)}/subscription/reactivate`,
        undefined,
        options,
      );
    },

    async createPortalSession(
      params: CreatePortalSessionParams,
      options?: RequestOptions,
    ): Promise<{ portal_url: string }> {
      const store_id = requireStoreId(params.store_id);
      return apiConfig.httpClient.post<{ portal_url: string }>(
        `/v1/stores/${requireStoreId(store_id)}/subscription/portal`,
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
        `/v1/stores/${requireStoreId(store_id)}/members`,
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
        `/v1/stores/${requireStoreId(store_id)}/invitation`,
        payload,
        options,
      );
    },

    async updateMemberRoles(
      params: UpdateStoreMemberRolesParams,
      options?: RequestOptions,
    ): Promise<StoreMembership> {
      const store_id = requireStoreId(params.store_id);
      if (!canonicalUuidV4.test(store_id) || !canonicalUuidV4.test(params.account_id)) {
        throw new TypeError("Member role changes require canonical Store and Account UUIDs");
      }
      return apiConfig.httpClient.put<StoreMembership>(
        `/v1/stores/${store_id}/members/${params.account_id}/roles`,
        { expected_updated_at: params.expected_updated_at, role_ids: params.role_ids },
        options,
      );
    },

    async changeMemberStatus(
      params: ChangeStoreMemberStatusParams,
      options?: RequestOptions,
    ): Promise<StoreMembership> {
      const store_id = requireStoreId(params.store_id);
      if (!canonicalUuidV4.test(store_id) || !canonicalUuidV4.test(params.account_id)) {
        throw new TypeError("Member status changes require canonical Store and Account UUIDs");
      }
      return apiConfig.httpClient.put<StoreMembership>(
        `/v1/stores/${store_id}/members/${params.account_id}/status`,
        { expected_updated_at: params.expected_updated_at, status: params.status },
        options,
      );
    },

    async transferOwnership(
      params: TransferStoreOwnershipParams,
      options?: RequestOptions,
    ): Promise<Store> {
      const store_id = requireStoreId(params.store_id);
      if (!canonicalUuidV4.test(store_id) || !canonicalUuidV4.test(params.account_id)) {
        throw new TypeError("Ownership transfer requires canonical Store and Account UUIDs");
      }
      return apiConfig.httpClient.post<Store>(
        `/v1/stores/${store_id}/ownership/transfer`,
        { account_id: params.account_id },
        options,
      );
    },

    async findMembers(
      params: FindStoreMembersParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<StoreMember>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<StoreMember>>(
        `/v1/stores/${requireStoreId(store_id)}/members`,
        {
          ...options,
          params: query,
        },
      );
    },

    async findOwnMemberships(
      params: FindOwnStoreMembershipsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<StoreMembershipWithStoreName>> {
      return apiConfig.httpClient.get<PaginatedResponse<StoreMembershipWithStoreName>>(
        "/v1/stores/memberships",
        { ...options, params },
      );
    },

    async getOwnMembership(
      params: GetOwnStoreMembershipParams,
      options?: RequestOptions,
    ): Promise<StoreMembershipWithStoreName | null> {
      const storeId = requireStoreId(params.store_id);
      if (!canonicalUuidV4.test(storeId)) throw new TypeError("Membership lookup requires a canonical Store UUID");
      return apiConfig.httpClient.get<StoreMembershipWithStoreName | null>(`/v1/stores/${requireStoreId(storeId)}/membership`, options);
    },

    async removeMember(
      params: RemoveMemberParams,
      options?: RequestOptions,
    ): Promise<boolean> {
      return apiConfig.httpClient.delete<boolean>(
        `/v1/stores/${requireStoreId(params.store_id)}/members/${params.account_id}`,
        options,
      );
    },

    async testWebhook(
      params: TestWebhookParams,
      options?: RequestOptions,
    ): Promise<TestWebhookResponse> {
      return apiConfig.httpClient.post<TestWebhookResponse>(
        `/v1/stores/${requireStoreId(params.store_id)}/webhooks/test`,
        { delivery_id: params.delivery_id, webhook_id: params.webhook_id },
        options,
      );
    },

    async listWebhooks(
      params: ListWebhooksParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Webhook>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Webhook>>(
        `/v1/stores/${requireStoreId(store_id)}/webhooks`,
        { ...options, params: query },
      );
    },

    async createWebhook(
      params: CreateWebhookParams,
      options?: RequestOptions,
    ): Promise<Webhook> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<Webhook>(
        `/v1/stores/${requireStoreId(store_id)}/webhooks`,
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
        `/v1/stores/${requireStoreId(store_id)}/webhooks/${id}`,
        payload,
        options,
      );
    },

    async deleteWebhook(
      params: DeleteWebhookParams,
      options?: RequestOptions,
    ): Promise<{ deleted: boolean }> {
      return apiConfig.httpClient.delete<{ deleted: boolean }>(
        `/v1/stores/${requireStoreId(params.store_id)}/webhooks/${params.id}`,
        options,
      );
    },
  };
};
