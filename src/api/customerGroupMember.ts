import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  CustomerGroupMember,
  CustomerGroupMemberSelf,
  CustomerGroupJoinResult,
  CustomerGroupMemberCommandResponse,
  LookupCustomerGroupMemberParams,
  ExecuteCustomerGroupMemberCommandParams,
  FindCustomerGroupMemberCommandsParams,
  FindCustomerGroupMembersParams,
  GetCurrentCustomerGroupMemberParams,
  GetCustomerGroupMemberParams,
  JoinCustomerGroupParams,
} from "../types/customerGroupMember";

export const createCustomerGroupMemberApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/customer-group-members`;
  return {
    join(
      params: JoinCustomerGroupParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupJoinResult> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<CustomerGroupJoinResult>(
        `${basePath(store_id)}/join`,
        payload,
        options,
      );
    },
    get(
      params: GetCustomerGroupMemberParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupMember> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<CustomerGroupMember>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    lookup(params: LookupCustomerGroupMemberParams, options?: RequestOptions): Promise<CustomerGroupMember> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<CustomerGroupMember>(`${basePath(store_id)}/lookup`, { ...options, params: query });
    },
    find(
      params: FindCustomerGroupMembersParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<CustomerGroupMember>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<CustomerGroupMember>>(
        basePath(store_id),
        { ...options, params: query },
      );
    },
    current(
      params: GetCurrentCustomerGroupMemberParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupMemberSelf | null> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<CustomerGroupMemberSelf | null>(
        `${basePath(store_id)}/current`,
        { ...options, params: query },
      );
    },
    execute(
      params: ExecuteCustomerGroupMemberCommandParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupMemberCommandResponse> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<CustomerGroupMemberCommandResponse>(
        `${basePath(store_id)}/commands`,
        payload,
        options,
      );
    },
    findCommands(
      params: FindCustomerGroupMemberCommandsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<unknown>> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<unknown>>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/commands`,
        { ...options, params: query },
      );
    },
  };
};
