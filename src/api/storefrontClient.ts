import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  StorefrontClientRegistration,
  CreateStorefrontClientParams,
  UpdateStorefrontClientParams,
  RevokeStorefrontClientParams,
  GetStorefrontClientParams,
  FindStorefrontClientsParams,
} from "../types/storefrontClient";

export const createStorefrontClientApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/storefront-clients`;

  return {
    create(
      params: CreateStorefrontClientParams,
      options?: RequestOptions,
    ): Promise<StorefrontClientRegistration> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<StorefrontClientRegistration>(basePath(store_id), payload, options);
    },
    update(
      params: UpdateStorefrontClientParams,
      options?: RequestOptions,
    ): Promise<StorefrontClientRegistration> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<StorefrontClientRegistration>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },
    revoke(
      params: RevokeStorefrontClientParams,
      options?: RequestOptions,
    ): Promise<StorefrontClientRegistration> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.post<StorefrontClientRegistration>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/revoke`,
        payload,
        options,
      );
    },
    get(params: GetStorefrontClientParams, options?: RequestOptions): Promise<StorefrontClientRegistration> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<StorefrontClientRegistration>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    find(
      params: FindStorefrontClientsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<StorefrontClientRegistration>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<StorefrontClientRegistration>>(basePath(store_id), {
        ...options,
        params: query,
      });
    },
  };
};
