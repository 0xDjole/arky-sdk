import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  ShippingMethod,
  CreateShippingMethodParams,
  UpdateShippingMethodParams,
  GetShippingMethodParams,
  GetShippingMethodByKeyParams,
  FindShippingMethodsParams,
  DeleteShippingMethodParams,
} from "../types/shipping";

export const createShippingMethodApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/shipping-methods`;

  return {
    create(params: CreateShippingMethodParams, options?: RequestOptions): Promise<ShippingMethod> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<ShippingMethod>(basePath(store_id), payload, options);
    },
    update(params: UpdateShippingMethodParams, options?: RequestOptions): Promise<ShippingMethod> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<ShippingMethod>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },
    get(params: GetShippingMethodParams, options?: RequestOptions): Promise<ShippingMethod> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<ShippingMethod>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    getByKey(params:GetShippingMethodByKeyParams, options?:RequestOptions):Promise<ShippingMethod> {
      const {store_id,key}=params;
      return apiConfig.httpClient.get<ShippingMethod>(`${basePath(store_id)}/by-key/${encodeURIComponent(key)}`,options);
    },
    find(
      params: FindShippingMethodsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<ShippingMethod>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<ShippingMethod>>(basePath(store_id), {
        ...options,
        params: query,
      });
    },
    delete(params: DeleteShippingMethodParams, options?: RequestOptions): Promise<ShippingMethod | void> {
      const { store_id, id, expected_updated_at } = params;
      return apiConfig.httpClient.delete<ShippingMethod | void>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        { ...options, params: { expected_updated_at } },
      );
    },
  };
};
