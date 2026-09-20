import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  FulfillmentRoutingPolicy,
  CreateFulfillmentRoutingPolicyParams,
  UpdateFulfillmentRoutingPolicyParams,
  GetFulfillmentRoutingPolicyParams,
  GetFulfillmentRoutingPolicyByKeyParams,
  FindFulfillmentRoutingPoliciesParams,
  DeleteFulfillmentRoutingPolicyParams,
} from "../types/fulfillmentRouting";

export const createFulfillmentRoutingPolicyApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/fulfillment-routing-policies`;

  return {
    getByKey(
      params: GetFulfillmentRoutingPolicyByKeyParams,
      options?: RequestOptions,
    ): Promise<FulfillmentRoutingPolicy> {
      return apiConfig.httpClient.get<FulfillmentRoutingPolicy>(
        `${basePath(params.store_id)}/by-key/${encodeURIComponent(params.key)}`,
        options,
      );
    },
    create(
      params: CreateFulfillmentRoutingPolicyParams,
      options?: RequestOptions,
    ): Promise<FulfillmentRoutingPolicy> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<FulfillmentRoutingPolicy>(
        basePath(store_id),
        payload,
        options,
      );
    },
    update(
      params: UpdateFulfillmentRoutingPolicyParams,
      options?: RequestOptions,
    ): Promise<FulfillmentRoutingPolicy> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<FulfillmentRoutingPolicy>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },
    get(
      params: GetFulfillmentRoutingPolicyParams,
      options?: RequestOptions,
    ): Promise<FulfillmentRoutingPolicy> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<FulfillmentRoutingPolicy>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    find(
      params: FindFulfillmentRoutingPoliciesParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<FulfillmentRoutingPolicy>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<FulfillmentRoutingPolicy>>(
        basePath(store_id),
        { ...options, params: query },
      );
    },
    delete(
      params: DeleteFulfillmentRoutingPolicyParams,
      options?: RequestOptions,
    ): Promise<FulfillmentRoutingPolicy> {
      const { store_id, id, expected_updated_at } = params;
      return apiConfig.httpClient.delete<FulfillmentRoutingPolicy>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        { ...options, params: { expected_updated_at } },
      );
    },
  };
};
