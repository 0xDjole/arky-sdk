import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  CustomerGroupCustomer,
  CreateCustomerGroupCustomerParams,
  GetCustomerGroupCustomerParams,
  FindCustomerGroupCustomersParams,
  DeleteCustomerGroupCustomerParams,
} from "../types/customerGroupCustomer";

export const createCustomerGroupCustomerApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/customer-group-customers`;
  return {
    create(
      params: CreateCustomerGroupCustomerParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupCustomer> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<CustomerGroupCustomer>(
        basePath(store_id),
        payload,
        options,
      );
    },
    get(
      params: GetCustomerGroupCustomerParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupCustomer> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<CustomerGroupCustomer>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    find(
      params: FindCustomerGroupCustomersParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<CustomerGroupCustomer>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<CustomerGroupCustomer>>(
        basePath(store_id),
        { ...options, params: query },
      );
    },

    delete(
      params: DeleteCustomerGroupCustomerParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupCustomer> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.delete<CustomerGroupCustomer>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        { ...options, params: query },
      );
    },
  };
};
