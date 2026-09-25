import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type {
  CreateCustomerGroupPlanBenefitParams,
  CustomerGroupPlanBenefit,
  DeleteCustomerGroupPlanBenefitParams,
  FindCustomerGroupPlanBenefitsParams,
  UpdateCustomerGroupPlanBenefitParams,
} from "../types/customerGroupPlanBenefit";

export const createCustomerGroupPlanBenefitApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId: string | undefined, planId: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/customer-group-plans/${encodeURIComponent(planId)}/benefits`;
  return {
    find(
      params: FindCustomerGroupPlanBenefitsParams,
      options?: RequestOptions,
    ): Promise<{ items: CustomerGroupPlanBenefit[] }> {
      const { store_id, customer_group_plan_id } = params;
      return apiConfig.httpClient.get<{ items: CustomerGroupPlanBenefit[] }>(
        basePath(store_id, customer_group_plan_id),
        options,
      );
    },
    create(
      params: CreateCustomerGroupPlanBenefitParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupPlanBenefit> {
      const { store_id, customer_group_plan_id, ...payload } = params;
      return apiConfig.httpClient.post<CustomerGroupPlanBenefit>(
        basePath(store_id, customer_group_plan_id),
        payload,
        options,
      );
    },
    update(
      params: UpdateCustomerGroupPlanBenefitParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupPlanBenefit> {
      const { store_id, customer_group_plan_id, id, ...payload } = params;
      return apiConfig.httpClient.put<CustomerGroupPlanBenefit>(
        `${basePath(store_id, customer_group_plan_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },
    delete(
      params: DeleteCustomerGroupPlanBenefitParams,
      options?: RequestOptions,
    ): Promise<void> {
      const { store_id, customer_group_plan_id, id, expected_updated_at } = params;
      return apiConfig.httpClient.delete<void>(
        `${basePath(store_id, customer_group_plan_id)}/${encodeURIComponent(id)}`,
        { ...options, params: { expected_updated_at } },
      );
    },
  };
};
