import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  InventoryItem,
  CreateInventoryItemParams,
  UpdateInventoryItemParams,
  GetInventoryItemParams,
  GetInventoryItemByKeyParams,
  FindInventoryItemsParams,
  DeleteInventoryItemParams,
} from "../types/inventoryItem";

export const createInventoryItemApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/inventory-items`;

  return {
    create(
      params: CreateInventoryItemParams,
      options?: RequestOptions,
    ): Promise<InventoryItem> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<InventoryItem>(basePath(store_id), payload, options);
    },
    update(
      params: UpdateInventoryItemParams,
      options?: RequestOptions,
    ): Promise<InventoryItem> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<InventoryItem>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },
    get(params: GetInventoryItemParams, options?: RequestOptions): Promise<InventoryItem> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<InventoryItem>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    find(
      params: FindInventoryItemsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<InventoryItem>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<InventoryItem>>(basePath(store_id), {
        ...options,
        params: query,
      });
    },
    getByKey(params: GetInventoryItemByKeyParams, options?: RequestOptions): Promise<InventoryItem> {
      const { store_id, key } = params;
      return apiConfig.httpClient.get<InventoryItem>(`${basePath(store_id)}/by-key/${encodeURIComponent(key)}`, options);
    },
    delete(
      params: DeleteInventoryItemParams,
      options?: RequestOptions,
    ): Promise<InventoryItem> {
      const { store_id, id, expected_updated_at } = params;
      return apiConfig.httpClient.delete<InventoryItem>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        { ...options, params: { expected_updated_at } },
      );
    },
  };
};
