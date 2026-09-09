import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  CustomerGroupCompany,
  CreateCustomerGroupCompanyParams,
  GetCustomerGroupCompanyParams,
  FindCustomerGroupCompaniesParams,
  DeleteCustomerGroupCompanyParams,
} from "../types/customerGroupCompany";

export const createCustomerGroupCompanyApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/customer-group-companies`;
  return {
    create(
      params: CreateCustomerGroupCompanyParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupCompany> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<CustomerGroupCompany>(
        basePath(store_id),
        payload,
        options,
      );
    },
    get(
      params: GetCustomerGroupCompanyParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupCompany> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<CustomerGroupCompany>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    find(
      params: FindCustomerGroupCompaniesParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<CustomerGroupCompany>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<CustomerGroupCompany>>(
        basePath(store_id),
        { ...options, params: query },
      );
    },

    delete(
      params: DeleteCustomerGroupCompanyParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupCompany> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.delete<CustomerGroupCompany>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        { ...options, params: query },
      );
    },
  };
};
