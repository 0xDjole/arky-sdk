import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  CreateCustomerGroupPlanParams,
  CustomerGroupPlan,
  FindCustomerGroupPlansParams,
  GetCustomerGroupPlanParams,
  UpdateCustomerGroupPlanParams,
} from "../types/customerGroupPlan";

export const createCustomerGroupPlanApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/customer-group-plans`;
  return {
    create(
      params: CreateCustomerGroupPlanParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupPlan> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<CustomerGroupPlan>(
        basePath(store_id),
        payload,
        options,
      );
    },
    get(
      params: GetCustomerGroupPlanParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupPlan> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<CustomerGroupPlan>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    find(
      params: FindCustomerGroupPlansParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<CustomerGroupPlan>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<CustomerGroupPlan>>(
        basePath(store_id),
        { ...options, params: query },
      );
    },
    update(
      params: UpdateCustomerGroupPlanParams & { store_id?: string },
      options?: RequestOptions,
    ): Promise<CustomerGroupPlan> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<CustomerGroupPlan>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },
  };
};
