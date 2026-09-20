import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  ShippingProfile,
  CreateShippingProfileParams,
  UpdateShippingProfileParams,
  GetShippingProfileParams,
  GetShippingProfileByKeyParams,
  FindShippingProfilesParams,
  DeleteShippingProfileParams,
} from "../types/shippingProfile";

export const createShippingProfileApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/shipping-profiles`;

  return {
    create(
      params: CreateShippingProfileParams,
      options?: RequestOptions,
    ): Promise<ShippingProfile> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<ShippingProfile>(basePath(store_id), payload, options);
    },
    update(
      params: UpdateShippingProfileParams,
      options?: RequestOptions,
    ): Promise<ShippingProfile> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<ShippingProfile>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },
    get(params: GetShippingProfileParams, options?: RequestOptions): Promise<ShippingProfile> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<ShippingProfile>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    getByKey(params: GetShippingProfileByKeyParams, options?: RequestOptions): Promise<ShippingProfile> {
      const { store_id, key } = params;
      return apiConfig.httpClient.get<ShippingProfile>(
        `${basePath(store_id)}/by-key/${encodeURIComponent(key)}`, options,
      );
    },
    find(
      params: FindShippingProfilesParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<ShippingProfile>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<ShippingProfile>>(basePath(store_id), {
        ...options,
        params: query,
      });
    },
    delete(
      params: DeleteShippingProfileParams,
      options?: RequestOptions,
    ): Promise<ShippingProfile> {
      const { store_id, id, expected_updated_at } = params;
      return apiConfig.httpClient.delete<ShippingProfile>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        { ...options, params: { expected_updated_at } },
      );
    },
  };
};
