import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  CustomerGroupMember,
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
    ): Promise<CustomerGroupMember> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<CustomerGroupMember>(
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
    ): Promise<CustomerGroupMember | null> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<CustomerGroupMember | null>(
        `${basePath(store_id)}/current`,
        { ...options, params: query },
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
