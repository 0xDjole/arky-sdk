import { requireStoreId } from "../utils/storeTarget";
import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  BatchCatalogItemsParams,
  CatalogItem,
  CreateCatalogItemParams,
  DeleteCatalogItemParams,
  FindCatalogItemsParams,
  GetCatalogItemParams,
  UpdateCatalogItemParams,
} from "../types/catalogItem";

export const createCatalogItemApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId: string) =>
    `/v1/stores/${encodeURIComponent(requireStoreId(storeId))}/catalog-items`;

  return {
    create(params: CreateCatalogItemParams, options?: RequestOptions): Promise<CatalogItem> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<CatalogItem>(basePath(store_id), payload, options);
    },
    update(params: UpdateCatalogItemParams, options?: RequestOptions): Promise<CatalogItem> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<CatalogItem>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },
    get(params: GetCatalogItemParams, options?: RequestOptions): Promise<CatalogItem> {
      return apiConfig.httpClient.get<CatalogItem>(
        `${basePath(params.store_id)}/${encodeURIComponent(params.id)}`,
        options,
      );
    },
    find(
      params: FindCatalogItemsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<CatalogItem>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<CatalogItem>>(basePath(store_id), {
        ...options,
        params: query,
      });
    },
    batch(params: BatchCatalogItemsParams, options?: RequestOptions): Promise<CatalogItem[]> {
      const { store_id, operations } = params;
      return apiConfig.httpClient.post<CatalogItem[]>(`${basePath(store_id)}/batch`, { operations }, options);
    },
    delete(params: DeleteCatalogItemParams, options?: RequestOptions): Promise<void> {
      const { store_id, id, expected_updated_at } = params;
      return apiConfig.httpClient.delete<void>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        { ...options, params: { expected_updated_at } },
      );
    },
  };
};
