import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  Catalog,
  CatalogUsage,
  CreateCatalogParams,
  UpdateCatalogParams,
  DeleteCatalogParams,
  GetCatalogParams,
  FindCatalogsParams,
} from "../types/catalog";

export const createCatalogApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/catalogs`;

  return {
    create(
      params: CreateCatalogParams,
      options?: RequestOptions,
    ): Promise<Catalog> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<Catalog>(
        basePath(store_id),
        payload,
        options,
      );
    },

    update(
      params: UpdateCatalogParams,
      options?: RequestOptions,
    ): Promise<Catalog> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<Catalog>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },

    get(params: GetCatalogParams, options?: RequestOptions): Promise<Catalog> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<Catalog>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },

    find(
      params: FindCatalogsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Catalog>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Catalog>>(
        basePath(store_id),
        { ...options, params: query },
      );
    },

    usage(
      params: GetCatalogParams,
      options?: RequestOptions,
    ): Promise<CatalogUsage> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<CatalogUsage>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/usage`,
        options,
      );
    },

    delete(
      params: DeleteCatalogParams,
      options?: RequestOptions,
    ): Promise<Catalog> {
      const { store_id, id, expected_updated_at } = params;
      return apiConfig.httpClient.delete<Catalog>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        {
          ...options,
          params: { expected_updated_at },
        },
      );
    },
  };
};
