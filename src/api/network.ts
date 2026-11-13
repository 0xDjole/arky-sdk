import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  Network, NetworkPlan, NetworkProvider, FindNetworksParams, GetNetworkParams, CreateNetworkParams,
  UpdateNetworkParams, DeleteNetworkParams, FindNetworkPlansParams, CreateNetworkPlanParams,
  UpdateNetworkPlanParams, DeleteNetworkPlanParams, FindNetworkProvidersParams, GetNetworkProviderParams,
  SetNetworkProviderStatusParams, DeleteNetworkProviderParams, ConnectNetworkResendParams,
  ReplaceNetworkResendKeyParams, UpdateNetworkResendParams, ConnectNetworkStripeParams,
  ReplaceNetworkStripeKeysParams, ConnectNetworkTwilioParams, ReplaceNetworkTwilioAuthTokenParams,
  ConnectNetworkElevenLabsParams, SetUpNetworkElevenLabsAgainParams, FindNetworkStoresParams,
  NetworkRole, NetworkMember, NetworkMembership, OwnNetworkMembership, StoreAgreement,
  FindNetworkRolesParams, GetNetworkRoleParams, CreateNetworkRoleParams, UpdateNetworkRoleParams,
  DeleteNetworkRoleParams, FindNetworkMembersParams, InviteNetworkMemberParams,
  UpdateNetworkMemberRolesParams, ChangeNetworkMemberStatusParams, RemoveNetworkMemberParams,
  GetOwnNetworkMembershipParams, AcceptNetworkInviteParams, GetNetworkStoreAgreementParams,
  ResetNetworkMemberSecondFactorParams, NetworkStore, GetNetworkStoreParams,
} from "../types/network";
import type { Account } from "../types/account";
import { requireId } from "../utils/ids";
import { segment } from "./paths";

function networkPath(id: string): string { return `/v1/networks/${segment(requireId(id, "network"))}`; }

function providerPath(networkId: string, id: string): string {
  return `${networkPath(networkId)}/providers/${segment(requireId(id, "network provider"))}`;
}

function rolePath(networkId: string, id: string): string {
  return `${networkPath(networkId)}/roles/${segment(requireId(id, "network role"))}`;
}

function memberPath(networkId: string, id: string): string {
  return `${networkPath(networkId)}/members/${segment(requireId(id, "network membership"))}`;
}

export const createNetworkApi = (apiConfig: ApiConfig) => ({
  find(params: FindNetworksParams = {}, options?: RequestOptions): Promise<PaginatedResponse<Network>> {
    return apiConfig.httpClient.get<PaginatedResponse<Network>>("/v1/networks", { ...options, params });
  },
  get(params: GetNetworkParams, options?: RequestOptions): Promise<Network> {
    return apiConfig.httpClient.get<Network>(networkPath(params.id), options);
  },
  create(params: CreateNetworkParams, options?: RequestOptions): Promise<Network> {
    requireId(params.id, "network");
    return apiConfig.httpClient.post<Network>("/v1/networks", { id: params.id, name: params.name }, options);
  },
  update(params: UpdateNetworkParams, options?: RequestOptions): Promise<Network> {
    return apiConfig.httpClient.patch<Network>(
      networkPath(params.id),
      { expected_updated_at: params.expected_updated_at, name: params.name },
      options,
    );
  },
  delete(params: DeleteNetworkParams, options?: RequestOptions): Promise<Network> {
    return apiConfig.httpClient.delete<Network>(networkPath(params.id), {
      ...options, params: { expected_updated_at: params.expected_updated_at },
    });
  },
  provider: {
    find(params: FindNetworkProvidersParams, options?: RequestOptions): Promise<PaginatedResponse<NetworkProvider>> {
      return apiConfig.httpClient.get<PaginatedResponse<NetworkProvider>>(`${networkPath(params.network_id)}/providers`, {
        ...options, params: { limit: params.limit, cursor: params.cursor },
      });
    },
    get(params: GetNetworkProviderParams, options?: RequestOptions): Promise<NetworkProvider> {
      return apiConfig.httpClient.get<NetworkProvider>(providerPath(params.network_id, params.id), options);
    },
    setStatus(params: SetNetworkProviderStatusParams, options?: RequestOptions): Promise<NetworkProvider> {
      return apiConfig.httpClient.put<NetworkProvider>(
        `${providerPath(params.network_id, params.id)}/status`,
        { expected_updated_at: params.expected_updated_at, status: params.status },
        options,
      );
    },
    delete(params: DeleteNetworkProviderParams, options?: RequestOptions): Promise<NetworkProvider> {
      return apiConfig.httpClient.delete<NetworkProvider>(providerPath(params.network_id, params.id), {
        ...options, params: { expected_updated_at: params.expected_updated_at },
      });
    },
    connectResend(params: ConnectNetworkResendParams, options?: RequestOptions): Promise<NetworkProvider> {
      requireId(params.id, "network provider");
      return apiConfig.httpClient.post<NetworkProvider>(`${networkPath(params.network_id)}/providers/resend`, {
        id: params.id,
        api_key: params.api_key,
        from_name: params.from_name,
        from_address: params.from_address,
        sign_in_subject: params.sign_in_subject,
        sign_in_body: params.sign_in_body,
        store_addresses: params.store_addresses,
      }, options);
    },
    replaceResendKey(params: ReplaceNetworkResendKeyParams, options?: RequestOptions): Promise<NetworkProvider> {
      return apiConfig.httpClient.put<NetworkProvider>(
        `${providerPath(params.network_id, params.id)}/resend-key`,
        { expected_updated_at: params.expected_updated_at, api_key: params.api_key },
        options,
      );
    },
    updateResend(params: UpdateNetworkResendParams, options?: RequestOptions): Promise<NetworkProvider> {
      return apiConfig.httpClient.put<NetworkProvider>(`${providerPath(params.network_id, params.id)}/resend`, {
        expected_updated_at: params.expected_updated_at,
        from_name: params.from_name,
        from_address: params.from_address,
        sign_in_subject: params.sign_in_subject,
        sign_in_body: params.sign_in_body,
        store_addresses: params.store_addresses,
      }, options);
    },
    connectStripe(params: ConnectNetworkStripeParams, options?: RequestOptions): Promise<NetworkProvider> {
      requireId(params.id, "network provider");
      return apiConfig.httpClient.post<NetworkProvider>(`${networkPath(params.network_id)}/providers/stripe`, {
        id: params.id,
        publishable_key: params.publishable_key,
        secret_key: params.secret_key,
        webhook_secret: params.webhook_secret,
      }, options);
    },
    replaceStripeKeys(params: ReplaceNetworkStripeKeysParams, options?: RequestOptions): Promise<NetworkProvider> {
      return apiConfig.httpClient.put<NetworkProvider>(`${providerPath(params.network_id, params.id)}/stripe-keys`, {
        expected_updated_at: params.expected_updated_at,
        publishable_key: params.publishable_key,
        secret_key: params.secret_key,
        webhook_secret: params.webhook_secret,
      }, options);
    },
    connectTwilio(params: ConnectNetworkTwilioParams, options?: RequestOptions): Promise<NetworkProvider> {
      requireId(params.id, "network provider");
      return apiConfig.httpClient.post<NetworkProvider>(`${networkPath(params.network_id)}/providers/twilio`, {
        id: params.id,
        account_sid: params.account_sid,
        auth_token: params.auth_token,
      }, options);
    },
    replaceTwilioAuthToken(params: ReplaceNetworkTwilioAuthTokenParams, options?: RequestOptions): Promise<NetworkProvider> {
      return apiConfig.httpClient.put<NetworkProvider>(
        `${providerPath(params.network_id, params.id)}/twilio-auth-token`,
        { expected_updated_at: params.expected_updated_at, auth_token: params.auth_token },
        options,
      );
    },
    connectElevenLabs(params: ConnectNetworkElevenLabsParams, options?: RequestOptions): Promise<NetworkProvider> {
      requireId(params.id, "network provider");
      return apiConfig.httpClient.post<NetworkProvider>(`${networkPath(params.network_id)}/providers/elevenlabs`, {
        id: params.id,
        api_key: params.api_key,
        region: params.region,
      }, options);
    },
    setUpElevenLabsAgain(params: SetUpNetworkElevenLabsAgainParams, options?: RequestOptions): Promise<NetworkProvider> {
      return apiConfig.httpClient.post<NetworkProvider>(
        `${providerPath(params.network_id, params.id)}/elevenlabs-setup`,
        { expected_updated_at: params.expected_updated_at },
        options,
      );
    },
  },
  plan: {
    find(params: FindNetworkPlansParams, options?: RequestOptions): Promise<PaginatedResponse<NetworkPlan>> {
      const { network_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<NetworkPlan>>(`${networkPath(network_id)}/plans`, { ...options, params: query });
    },
    create(params: CreateNetworkPlanParams, options?: RequestOptions): Promise<NetworkPlan> {
      const { network_id, ...body } = params;
      requireId(params.id, "network plan");
      return apiConfig.httpClient.post<NetworkPlan>(`${networkPath(network_id)}/plans`, body, options);
    },
    update(params: UpdateNetworkPlanParams, options?: RequestOptions): Promise<NetworkPlan> {
      const { network_id, id, ...body } = params;
      return apiConfig.httpClient.patch<NetworkPlan>(`${networkPath(network_id)}/plans/${segment(requireId(id, "network plan"))}`, body, options);
    },
    delete(params: DeleteNetworkPlanParams, options?: RequestOptions): Promise<NetworkPlan> {
      return apiConfig.httpClient.delete<NetworkPlan>(`${networkPath(params.network_id)}/plans/${segment(requireId(params.id, "network plan"))}`, {
        ...options, params: { expected_updated_at: params.expected_updated_at },
      });
    },
  },
  store: {
    find(params: FindNetworkStoresParams, options?: RequestOptions): Promise<PaginatedResponse<NetworkStore>> {
      const { network_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<NetworkStore>>(`${networkPath(network_id)}/stores`, { ...options, params: query });
    },
    get(params: GetNetworkStoreParams, options?: RequestOptions): Promise<NetworkStore> {
      return apiConfig.httpClient.get<NetworkStore>(
        `${networkPath(params.network_id)}/stores/${segment(requireId(params.store_id, "store"))}`,
        options,
      );
    },
    getAgreement(params: GetNetworkStoreAgreementParams, options?: RequestOptions): Promise<StoreAgreement> {
      return apiConfig.httpClient.get<StoreAgreement>(
        `${networkPath(params.network_id)}/stores/${segment(requireId(params.store_id, "store"))}/agreement`,
        options,
      );
    },
  },
  role: {
    find(params: FindNetworkRolesParams, options?: RequestOptions): Promise<PaginatedResponse<NetworkRole>> {
      return apiConfig.httpClient.get<PaginatedResponse<NetworkRole>>(`${networkPath(params.network_id)}/roles`, {
        ...options, params: { limit: params.limit, cursor: params.cursor },
      });
    },
    get(params: GetNetworkRoleParams, options?: RequestOptions): Promise<NetworkRole> {
      return apiConfig.httpClient.get<NetworkRole>(rolePath(params.network_id, params.id), options);
    },
    create(params: CreateNetworkRoleParams, options?: RequestOptions): Promise<NetworkRole> {
      requireId(params.id, "network role");
      return apiConfig.httpClient.post<NetworkRole>(`${networkPath(params.network_id)}/roles`, {
        id: params.id,
        key: params.key,
        permissions: params.permissions,
      }, options);
    },
    update(params: UpdateNetworkRoleParams, options?: RequestOptions): Promise<NetworkRole> {
      return apiConfig.httpClient.put<NetworkRole>(rolePath(params.network_id, params.id), {
        expected_updated_at: params.expected_updated_at,
        key: params.key,
        permissions: params.permissions,
      }, options);
    },
    delete(params: DeleteNetworkRoleParams, options?: RequestOptions): Promise<NetworkRole> {
      return apiConfig.httpClient.delete<NetworkRole>(rolePath(params.network_id, params.id), {
        ...options, params: { expected_updated_at: params.expected_updated_at },
      });
    },
  },
  member: {
    find(params: FindNetworkMembersParams, options?: RequestOptions): Promise<PaginatedResponse<NetworkMember>> {
      return apiConfig.httpClient.get<PaginatedResponse<NetworkMember>>(`${networkPath(params.network_id)}/members`, {
        ...options, params: { limit: params.limit, cursor: params.cursor },
      });
    },
    invite(params: InviteNetworkMemberParams, options?: RequestOptions): Promise<NetworkMembership> {
      requireId(params.id, "network membership");
      return apiConfig.httpClient.post<NetworkMembership>(`${networkPath(params.network_id)}/members`, {
        id: params.id,
        contact: params.contact,
        role_ids: params.role_ids,
      }, options);
    },
    updateRoles(params: UpdateNetworkMemberRolesParams, options?: RequestOptions): Promise<NetworkMembership> {
      return apiConfig.httpClient.put<NetworkMembership>(`${memberPath(params.network_id, params.id)}/roles`, {
        expected_updated_at: params.expected_updated_at,
        role_ids: params.role_ids,
      }, options);
    },
    changeStatus(params: ChangeNetworkMemberStatusParams, options?: RequestOptions): Promise<NetworkMembership> {
      return apiConfig.httpClient.put<NetworkMembership>(`${memberPath(params.network_id, params.id)}/status`, {
        expected_updated_at: params.expected_updated_at,
        status: params.status,
      }, options);
    },
    remove(params: RemoveNetworkMemberParams, options?: RequestOptions): Promise<NetworkMembership> {
      return apiConfig.httpClient.delete<NetworkMembership>(memberPath(params.network_id, params.id), {
        ...options, params: { expected_updated_at: params.expected_updated_at },
      });
    },
    resetSecondFactor(params: ResetNetworkMemberSecondFactorParams, options?: RequestOptions): Promise<Account> {
      return apiConfig.httpClient.post<Account>(`${memberPath(params.network_id, params.id)}/second-factor/reset`, undefined, options);
    },
    getOwn(params: GetOwnNetworkMembershipParams, options?: RequestOptions): Promise<OwnNetworkMembership | null> {
      return apiConfig.httpClient.get<OwnNetworkMembership | null>(`${networkPath(params.network_id)}/membership`, options);
    },
    acceptInvite(params: AcceptNetworkInviteParams, options?: RequestOptions): Promise<NetworkMembership> {
      return apiConfig.httpClient.post<NetworkMembership>(
        `${networkPath(params.network_id)}/membership/accept`,
        { expected_updated_at: params.expected_updated_at },
        options,
      );
    },
  },
});
