import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  CreateSubscriptionOfferingParams,
  FindSubscriptionOfferingsParams,
  GetSubscriptionOfferingByKeyParams,
  GetSubscriptionOfferingParams,
  SubscriptionOffering,
  UpdateSubscriptionOfferingParams,
} from "../types/subscriptionOffering";

export const createSubscriptionOfferingApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/subscription-offerings`;
  return {
    create(
      params: CreateSubscriptionOfferingParams,
      options?: RequestOptions,
    ): Promise<SubscriptionOffering> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<SubscriptionOffering>(basePath(store_id), payload, options);
    },
    get(
      params: GetSubscriptionOfferingParams,
      options?: RequestOptions,
    ): Promise<SubscriptionOffering> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<SubscriptionOffering>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    getByKey(
      params: GetSubscriptionOfferingByKeyParams,
      options?: RequestOptions,
    ): Promise<SubscriptionOffering> {
      const { store_id, key } = params;
      return apiConfig.httpClient.get<SubscriptionOffering>(
        `${basePath(store_id)}/by-key/${encodeURIComponent(key)}`,
        options,
      );
    },
    find(
      params: FindSubscriptionOfferingsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<SubscriptionOffering>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<SubscriptionOffering>>(basePath(store_id), {
        ...options,
        params: query,
      });
    },
    update(
      params: UpdateSubscriptionOfferingParams,
      options?: RequestOptions,
    ): Promise<SubscriptionOffering> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<SubscriptionOffering>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },
  };
};
