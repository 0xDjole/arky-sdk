import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  AllowStoreEmailSendingParams,
  CreateStorePortalSessionParams,
  CreateStoreParams,
  EndStoreGrantParams,
  FindStoreUsageParams,
  FindStoresParams,
  GetStoreParams,
  GetStoreSubscriptionParams,
  PauseStoreEmailSendingParams,
  RequestStoreDeletionParams,
  SelectStorePlanParams,
  Store,
  StorePortalSession,
  StoreSubscription,
  StoreSubscriptionSelection,
  StoreUsageSummary,
  UpdateStoreParams,
} from "../types/store";
import type {
  AcceptStoreInviteParams,
  AddStoreMemberParams,
  ChangeStoreMemberStatusParams,
  FindOwnStoreMembershipsParams,
  FindStoreMembersParams,
  GetOwnStoreMembershipParams,
  InviteStoreMemberParams,
  RemoveStoreMemberParams,
  StoreMember,
  StoreMembership,
  StoreMembershipWithStoreName,
  TransferStoreOwnershipParams,
  UpdateStoreMemberRolesParams,
} from "../types/storeRole";
import { requireStoreId } from "../utils/storeTarget";
import { requireId } from "../utils/ids";
import { segment, storePath } from "./paths";

export const createStoreApi = (apiConfig: ApiConfig) => ({
  create(params: CreateStoreParams, options?: RequestOptions): Promise<Store> {
    requireId(params.id, "store");
    return apiConfig.httpClient.post<Store>("/v1/stores", params, options);
  },

  update(params: UpdateStoreParams, options?: RequestOptions): Promise<Store> {
    const { id, ...body } = params;
    return apiConfig.httpClient.put<Store>(`/v1/stores/${requireStoreId(id)}`, body, options);
  },

  get(params: GetStoreParams, options?: RequestOptions): Promise<Store> {
    return apiConfig.httpClient.get<Store>(`/v1/stores/${requireStoreId(params.id)}`, options);
  },

  find(params: FindStoresParams = {}, options?: RequestOptions): Promise<PaginatedResponse<Store>> {
    return apiConfig.httpClient.get<PaginatedResponse<Store>>("/v1/stores", { ...options, params });
  },

  pauseEmailSending(params: PauseStoreEmailSendingParams, options?: RequestOptions): Promise<Store> {
    return apiConfig.httpClient.post<Store>(
      storePath(params.store_id, "pause-email-sending"),
      { expected_updated_at: params.expected_updated_at, reason: params.reason },
      options,
    );
  },

  allowEmailSending(params: AllowStoreEmailSendingParams, options?: RequestOptions): Promise<Store> {
    return apiConfig.httpClient.post<Store>(
      storePath(params.store_id, "allow-email-sending"),
      { expected_updated_at: params.expected_updated_at },
      options,
    );
  },

  requestDeletion(params: RequestStoreDeletionParams, options?: RequestOptions): Promise<Store> {
    return apiConfig.httpClient.post<Store>(
      `/v1/stores/${requireStoreId(params.id)}/deletion`,
      { confirmation: params.confirmation, expected_updated_at: params.expected_updated_at },
      options,
    );
  },

  subscription: {
    get(params: GetStoreSubscriptionParams, options?: RequestOptions): Promise<StoreSubscription> {
      return apiConfig.httpClient.get<StoreSubscription>(storePath(params.store_id, "subscription"), options);
    },

    select(params: SelectStorePlanParams, options?: RequestOptions): Promise<StoreSubscriptionSelection> {
      return apiConfig.httpClient.post<StoreSubscriptionSelection>(
        storePath(params.store_id, "subscription"),
        { plan_id: params.plan_id, return_url: params.return_url },
        options,
      );
    },

    createPortalSession(params: CreateStorePortalSessionParams, options?: RequestOptions): Promise<StorePortalSession> {
      return apiConfig.httpClient.post<StorePortalSession>(
        storePath(params.store_id, "subscription/portal"),
        { return_url: params.return_url },
        options,
      );
    },

    endGrant(params: EndStoreGrantParams, options?: RequestOptions): Promise<StoreSubscription> {
      return apiConfig.httpClient.post<StoreSubscription>(
        storePath(params.store_id, "subscription/end-grant"),
        { expected_updated_at: params.expected_updated_at },
        options,
      );
    },
  },

  usage: {
    find(params: FindStoreUsageParams, options?: RequestOptions): Promise<StoreUsageSummary> {
      return apiConfig.httpClient.get<StoreUsageSummary>(storePath(params.store_id, "usage"), options);
    },
  },

  member: {
    add(params: AddStoreMemberParams, options?: RequestOptions): Promise<boolean> {
      return apiConfig.httpClient.post<boolean>(
        storePath(params.store_id, "members"),
        { email: params.email, role_ids: params.role_ids },
        options,
      );
    },

    invite(params: InviteStoreMemberParams, options?: RequestOptions): Promise<boolean> {
      return apiConfig.httpClient.post<boolean>(
        storePath(params.store_id, "invitation"),
        { email: params.email, role_ids: params.role_ids },
        options,
      );
    },

    find(params: FindStoreMembersParams, options?: RequestOptions): Promise<PaginatedResponse<StoreMember>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<StoreMember>>(storePath(store_id, "members"), {
        ...options,
        params: query,
      });
    },

    findOwn(
      params: FindOwnStoreMembershipsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<StoreMembershipWithStoreName>> {
      return apiConfig.httpClient.get<PaginatedResponse<StoreMembershipWithStoreName>>("/v1/stores/memberships", {
        ...options,
        params,
      });
    },

    getOwn(params: GetOwnStoreMembershipParams, options?: RequestOptions): Promise<StoreMembershipWithStoreName | null> {
      return apiConfig.httpClient.get<StoreMembershipWithStoreName | null>(storePath(params.store_id, "membership"), options);
    },

    acceptInvite(params: AcceptStoreInviteParams, options?: RequestOptions): Promise<StoreMembership> {
      return apiConfig.httpClient.post<StoreMembership>(
        storePath(params.store_id, "membership/accept"),
        { expected_updated_at: params.expected_updated_at },
        options,
      );
    },

    remove(params: RemoveStoreMemberParams, options?: RequestOptions): Promise<boolean> {
      return apiConfig.httpClient.delete<boolean>(
        storePath(params.store_id, `members/${segment(requireId(params.account_id, "account"))}`),
        options,
      );
    },

    updateRoles(params: UpdateStoreMemberRolesParams, options?: RequestOptions): Promise<StoreMembership> {
      return apiConfig.httpClient.put<StoreMembership>(
        storePath(params.store_id, `members/${segment(requireId(params.account_id, "account"))}/roles`),
        { expected_updated_at: params.expected_updated_at, role_ids: params.role_ids },
        options,
      );
    },

    changeStatus(params: ChangeStoreMemberStatusParams, options?: RequestOptions): Promise<StoreMembership> {
      return apiConfig.httpClient.put<StoreMembership>(
        storePath(params.store_id, `members/${segment(requireId(params.account_id, "account"))}/status`),
        { expected_updated_at: params.expected_updated_at, status: params.status },
        options,
      );
    },

    transferOwnership(params: TransferStoreOwnershipParams, options?: RequestOptions): Promise<Store> {
      return apiConfig.httpClient.post<Store>(
        storePath(params.store_id, "ownership/transfer"),
        { account_id: requireId(params.account_id, "account") },
        options,
      );
    },
  },
});
