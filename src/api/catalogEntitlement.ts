import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  CatalogEntitlement,
  CreateCatalogEntitlementParams,
  UpdateCatalogEntitlementParams,
  DeleteCatalogEntitlementParams,
  GetCatalogEntitlementParams,
  FindCatalogEntitlementsParams,
} from "../types/catalogEntitlement";

export const createCatalogEntitlementApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/catalog-entitlements`;

  return {
    create(
      params: CreateCatalogEntitlementParams,
      options?: RequestOptions,
    ): Promise<CatalogEntitlement> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<CatalogEntitlement>(
        basePath(store_id),
        payload,
        options,
      );
    },

    update(
      params: UpdateCatalogEntitlementParams,
      options?: RequestOptions,
    ): Promise<CatalogEntitlement> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<CatalogEntitlement>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },

    get(
      params: GetCatalogEntitlementParams,
      options?: RequestOptions,
    ): Promise<CatalogEntitlement> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<CatalogEntitlement>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },

    find(
      params: FindCatalogEntitlementsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<CatalogEntitlement>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<CatalogEntitlement>>(
        basePath(store_id),
        { ...options, params: query },
      );
    },

    delete(
      params: DeleteCatalogEntitlementParams,
      options?: RequestOptions,
    ): Promise<CatalogEntitlement> {
      const { store_id, id, expected_updated_at } = params;
      return apiConfig.httpClient.delete<CatalogEntitlement>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        {
          ...options,
          params: { expected_updated_at },
        },
      );
    },
  };
};
