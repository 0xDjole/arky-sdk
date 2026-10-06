import { requireStoreId } from "../utils/storeTarget";
import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  CatalogAccess,
  CreateCatalogAccessParams,
  DeleteCatalogAccessParams,
  FindCatalogAccessesParams,
  GetCatalogAccessParams,
} from "../types/catalogAccess";

export const createCatalogAccessApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId: string) =>
    `/v1/stores/${encodeURIComponent(requireStoreId(storeId))}/catalog-accesses`;

  return {
    create(params: CreateCatalogAccessParams, options?: RequestOptions): Promise<CatalogAccess> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<CatalogAccess>(basePath(store_id), payload, options);
    },
    get(params: GetCatalogAccessParams, options?: RequestOptions): Promise<CatalogAccess> {
      return apiConfig.httpClient.get<CatalogAccess>(
        `${basePath(params.store_id)}/${encodeURIComponent(params.id)}`,
        options,
      );
    },
    find(
      params: FindCatalogAccessesParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<CatalogAccess>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<CatalogAccess>>(basePath(store_id), {
        ...options,
        params: query,
      });
    },
    delete(params: DeleteCatalogAccessParams, options?: RequestOptions): Promise<void> {
      const { store_id, id, expected_updated_at } = params;
      return apiConfig.httpClient.delete<void>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        { ...options, params: { expected_updated_at } },
      );
    },
  };
};
