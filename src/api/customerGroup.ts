import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  CustomerGroup,
  CreateCustomerGroupParams,
  GetCustomerGroupParams,
  FindCustomerGroupsParams,
  DeleteCustomerGroupParams,
  UpdateCustomerGroupParams,
  CustomerGroupUsage,
} from "../types/customerGroup";

export const createCustomerGroupApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/customer-groups`;
  return {
    create(
      params: CreateCustomerGroupParams,
      options?: RequestOptions,
    ): Promise<CustomerGroup> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<CustomerGroup>(
        basePath(store_id),
        payload,
        options,
      );
    },
    get(
      params: GetCustomerGroupParams,
      options?: RequestOptions,
    ): Promise<CustomerGroup> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<CustomerGroup>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    find(
      params: FindCustomerGroupsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<CustomerGroup>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<CustomerGroup>>(
        basePath(store_id),
        { ...options, params: query },
      );
    },
    update(
      params: UpdateCustomerGroupParams,
      options?: RequestOptions,
    ): Promise<CustomerGroup> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<CustomerGroup>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },
    delete(
      params: DeleteCustomerGroupParams,
      options?: RequestOptions,
    ): Promise<CustomerGroup> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.delete<CustomerGroup>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        { ...options, params: query },
      );
    },
    usage(
      params: GetCustomerGroupParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupUsage> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<CustomerGroupUsage>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/usage`,
        options,
      );
    },
  };
};
