import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type {
  CreateSubscriptionPlanEntitlementParams,
  SubscriptionPlanEntitlement,
  DeleteSubscriptionPlanEntitlementParams,
  FindSubscriptionPlanEntitlementsParams,
  UpdateSubscriptionPlanEntitlementParams,
} from "../types/subscriptionPlanEntitlement";

export const createSubscriptionPlanEntitlementApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId: string | undefined, planId: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/subscription-plans/${encodeURIComponent(planId)}/entitlements`;
  return {
    find(
      params: FindSubscriptionPlanEntitlementsParams,
      options?: RequestOptions,
    ): Promise<{ items: SubscriptionPlanEntitlement[] }> {
      const { store_id, subscription_plan_id } = params;
      return apiConfig.httpClient.get<{ items: SubscriptionPlanEntitlement[] }>(
        basePath(store_id, subscription_plan_id),
        options,
      );
    },
    create(
      params: CreateSubscriptionPlanEntitlementParams,
      options?: RequestOptions,
    ): Promise<SubscriptionPlanEntitlement> {
      const { store_id, subscription_plan_id, ...payload } = params;
      return apiConfig.httpClient.post<SubscriptionPlanEntitlement>(
        basePath(store_id, subscription_plan_id),
        payload,
        options,
      );
    },
    update(
      params: UpdateSubscriptionPlanEntitlementParams,
      options?: RequestOptions,
    ): Promise<SubscriptionPlanEntitlement> {
      const { store_id, subscription_plan_id, id, ...payload } = params;
      return apiConfig.httpClient.put<SubscriptionPlanEntitlement>(
        `${basePath(store_id, subscription_plan_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },
    delete(
      params: DeleteSubscriptionPlanEntitlementParams,
      options?: RequestOptions,
    ): Promise<void> {
      const { store_id, subscription_plan_id, id, expected_updated_at } = params;
      return apiConfig.httpClient.delete<void>(
        `${basePath(store_id, subscription_plan_id)}/${encodeURIComponent(id)}`,
        { ...options, params: { expected_updated_at } },
      );
    },
  };
};
