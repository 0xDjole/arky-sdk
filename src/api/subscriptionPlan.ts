import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  CreateSubscriptionPlanParams,
  SubscriptionPlan,
  FindSubscriptionPlansParams,
  GetSubscriptionPlanParams,
  UpdateSubscriptionPlanParams,
} from "../types/subscriptionPlan";

export const createSubscriptionPlanApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/subscription-plans`;
  return {
    create(
      params: CreateSubscriptionPlanParams,
      options?: RequestOptions,
    ): Promise<SubscriptionPlan> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<SubscriptionPlan>(
        basePath(store_id),
        payload,
        options,
      );
    },
    get(
      params: GetSubscriptionPlanParams,
      options?: RequestOptions,
    ): Promise<SubscriptionPlan> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<SubscriptionPlan>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    find(
      params: FindSubscriptionPlansParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<SubscriptionPlan>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<SubscriptionPlan>>(
        basePath(store_id),
        { ...options, params: query },
      );
    },
    update(
      params: UpdateSubscriptionPlanParams & { store_id?: string },
      options?: RequestOptions,
    ): Promise<SubscriptionPlan> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<SubscriptionPlan>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },
  };
};
