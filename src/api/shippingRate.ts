import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  ShippingRate,
  CreateShippingRateParams,
  UpdateShippingRateParams,
  GetShippingRateParams,
  FindShippingRatesParams,
  DeleteShippingRateParams,
} from "../types/shipping";

export const createShippingRateApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/shipping-rates`;

  return {
    create(params: CreateShippingRateParams, options?: RequestOptions): Promise<ShippingRate> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<ShippingRate>(basePath(store_id), payload, options);
    },
    update(params: UpdateShippingRateParams, options?: RequestOptions): Promise<ShippingRate> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<ShippingRate>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },
    get(params: GetShippingRateParams, options?: RequestOptions): Promise<ShippingRate> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<ShippingRate>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    find(
      params: FindShippingRatesParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<ShippingRate>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<ShippingRate>>(basePath(store_id), {
        ...options,
        params: query,
      });
    },
    delete(params: DeleteShippingRateParams, options?: RequestOptions): Promise<ShippingRate | void> {
      const { store_id, id, expected_updated_at } = params;
      return apiConfig.httpClient.delete<ShippingRate | void>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        { ...options, params: { expected_updated_at } },
      );
    },
  };
};
