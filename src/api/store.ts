import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  AllowStoreEmailSendingParams,
  CreateStoreCardSetupParams,
  StoreCardSetup,
  StoreSubscriptionPayment,
  SetStoreSubscriptionCardParams,
  CancelStoreSubscriptionParams,
  GrantStorePlanParams,
  FindTestStoresParams,
  WipeStoreParams,
  CreateStoreParams,
  EndStoreGrantParams,
  GetStoreUsageParams,
  GetStorePlanParams,
  GetStoreAgreementParams,
  FindStoresParams,
  GetStoreParams,
  GetStoreSubscriptionParams,
  PauseStoreEmailSendingParams,
  RequestStoreDeletionParams,
  ResumeStoreParams,
  SuspendStoreParams,
  ChangeStorePlanParams,
  Store,
  StorePlanSummary,
  StoreSubscription,
  StoreUsageSummary,
  UpdateStoreParams,
} from "../types/store";
import type {
  AcceptStoreInviteParams,
  ChangeStoreMemberStatusParams,
  FindOwnStoreMembershipsParams,
  FindStoreMemberDirectoryParams,
  FindStoreMembersParams,
  GetOwnStoreMembershipParams,
  InviteStoreMemberParams,
  ResendStoreInviteParams,
  FindStoreMemberSessionsParams,
  RemoveStoreMemberParams,
  RevokeStoreMemberSessionParams,
  StoreMember,
  StoreMemberProfile,
  StoreMembership,
  StoreMembershipWithStoreName,
  TransferStoreOwnershipParams,
  UpdateStoreMemberLocationsParams,
  UpdateStoreMemberRolesParams,
} from "../types/storeRole";
import type { AccountSession } from "../types/account";
import type { StoreAgreement } from "../types/network";
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

  suspend(params: SuspendStoreParams, options?: RequestOptions): Promise<Store> {
    return apiConfig.httpClient.post<Store>(
      storePath(params.store_id, "suspend"),
      { expected_updated_at: params.expected_updated_at, reason: params.reason },
      options,
    );
  },

  resume(params: ResumeStoreParams, options?: RequestOptions): Promise<Store> {
    return apiConfig.httpClient.post<Store>(
      storePath(params.store_id, "resume"),
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

    changePlan(params: ChangeStorePlanParams, options?: RequestOptions): Promise<StoreSubscription> {
      const { store_id, ...body } = params;
      return apiConfig.httpClient.put<StoreSubscription>(storePath(store_id, "subscription/plan"), body, options);
    },
    createCardSetup(params: CreateStoreCardSetupParams, options?: RequestOptions): Promise<StoreCardSetup> {
      return apiConfig.httpClient.post<StoreCardSetup>(`/v1/networks/${segment(requireId(params.network_id, "network"))}/card-setups`,
        { id: requireId(params.id, "card setup") }, options);
    },
    setCard(params: SetStoreSubscriptionCardParams, options?: RequestOptions): Promise<StoreSubscription> {
      const { store_id, ...body } = params;
      return apiConfig.httpClient.put<StoreSubscription>(storePath(store_id, "subscription/card"), body, options);
    },
    pendingPayment(params: GetStoreSubscriptionParams, options?: RequestOptions): Promise<StoreSubscriptionPayment> {
      return apiConfig.httpClient.get<StoreSubscriptionPayment>(storePath(params.store_id, "subscription/payment"), options);
    },
    cancel(params: CancelStoreSubscriptionParams, options?: RequestOptions): Promise<StoreSubscription> {
      const { store_id, ...body } = params;
      return apiConfig.httpClient.post<StoreSubscription>(storePath(store_id, "subscription/cancel"), body, options);
    },
    grant(params: GrantStorePlanParams, options?: RequestOptions): Promise<StoreSubscription> {
      const { store_id, ...body } = params;
      return apiConfig.httpClient.post<StoreSubscription>(storePath(store_id, "subscription/grant"), body, options);
    },
    endGrant(params: EndStoreGrantParams, options?: RequestOptions): Promise<StoreSubscription> {
      const { store_id, ...body } = params;
      return apiConfig.httpClient.post<StoreSubscription>(storePath(store_id, "subscription/end-grant"), body, options);
    },
  },

  testStores: {
    find(params: FindTestStoresParams, options?: RequestOptions): Promise<PaginatedResponse<Store>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Store>>(storePath(store_id, "test-stores"), { ...options, params: query });
    },
  },
  wipe(params: WipeStoreParams, options?: RequestOptions): Promise<Store> {
    const { id, ...body } = params;
    return apiConfig.httpClient.post<Store>(storePath(id, "wipe"), body, options);
  },

  usage: {
    get(params: GetStoreUsageParams, options?: RequestOptions): Promise<StoreUsageSummary> {
      return apiConfig.httpClient.get<StoreUsageSummary>(storePath(params.store_id, "usage"), options);
    },
  },

  plan: {
    get(params: GetStorePlanParams, options?: RequestOptions): Promise<StorePlanSummary> {
      return apiConfig.httpClient.get<StorePlanSummary>(storePath(params.store_id, "plan"), options);
    },
  },

  agreement: {
    get(params: GetStoreAgreementParams, options?: RequestOptions): Promise<StoreAgreement> {
      return apiConfig.httpClient.get<StoreAgreement>(storePath(params.store_id, "agreement"), options);
    },
  },

  member: {
    invite(params: InviteStoreMemberParams, options?: RequestOptions): Promise<boolean> {
      return apiConfig.httpClient.post<boolean>(
        storePath(params.store_id, "invitation"),
        { id: requireId(params.id, "membership"), contact: params.contact, role_ids: params.role_ids },
        options,
      );
    },

    resendInvite(params: ResendStoreInviteParams, options?: RequestOptions): Promise<boolean> {
      return apiConfig.httpClient.post<boolean>(
        storePath(params.store_id, `members/${segment(requireId(params.id, "membership"))}/invitation`),
        { expected_updated_at: params.expected_updated_at },
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

    findDirectory(
      params: FindStoreMemberDirectoryParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<StoreMemberProfile>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<StoreMemberProfile>>(storePath(store_id, "members/directory"), {
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

    remove(params: RemoveStoreMemberParams, options?: RequestOptions): Promise<true> {
      return apiConfig.httpClient.delete<true>(
        storePath(params.store_id, `members/${segment(requireId(params.id, "membership"))}`),
        {
          ...options,
          params: { expected_updated_at: params.expected_updated_at },
        },
      );
    },

    updateRoles(params: UpdateStoreMemberRolesParams, options?: RequestOptions): Promise<StoreMembership> {
      return apiConfig.httpClient.put<StoreMembership>(
        storePath(params.store_id, `members/${segment(requireId(params.id, "membership"))}/roles`),
        { expected_updated_at: params.expected_updated_at, role_ids: params.role_ids },
        options,
      );
    },

    updateLocations(params: UpdateStoreMemberLocationsParams, options?: RequestOptions): Promise<StoreMembership> {
      return apiConfig.httpClient.put<StoreMembership>(
        storePath(params.store_id, `members/${segment(requireId(params.id, "membership"))}/locations`),
        { expected_updated_at: params.expected_updated_at, store_location_ids: params.store_location_ids },
        options,
      );
    },

    changeStatus(params: ChangeStoreMemberStatusParams, options?: RequestOptions): Promise<StoreMembership> {
      return apiConfig.httpClient.put<StoreMembership>(
        storePath(params.store_id, `members/${segment(requireId(params.id, "membership"))}/status`),
        { expected_updated_at: params.expected_updated_at, status: params.status },
        options,
      );
    },

    findSessions(
      params: FindStoreMemberSessionsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<AccountSession>> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<AccountSession>>(
        storePath(store_id, `members/${segment(requireId(id, "membership"))}/sessions`),
        { ...options, params: query },
      );
    },

    revokeSession(params: RevokeStoreMemberSessionParams, options?: RequestOptions): Promise<AccountSession> {
      return apiConfig.httpClient.delete<AccountSession>(
        storePath(
          params.store_id,
          `members/${segment(requireId(params.id, "membership"))}/sessions/${segment(requireId(params.session_id, "session"))}`,
        ),
        options,
      );
    },

    transferOwnership(params: TransferStoreOwnershipParams, options?: RequestOptions): Promise<Store> {
      return apiConfig.httpClient.post<Store>(
        storePath(params.store_id, "ownership/transfer"),
        { account_id: requireId(params.account_id, "account"), expected_updated_at: params.expected_updated_at },
        options,
      );
    },
  },
});
