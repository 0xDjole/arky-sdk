import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  CreateInventoryItemParams,
  DeleteInventoryItemParams,
  FindInventoryItemsParams,
  GetInventoryItemByKeyParams,
  GetInventoryItemParams,
  InventoryItem,
  UpdateInventoryItemParams,
} from "../types/inventory";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";

const collection = "inventory-items";

export const createInventoryItemApi = (apiConfig: ApiConfig) => ({
  create(params: CreateInventoryItemParams, options?: RequestOptions): Promise<InventoryItem> {
    requireId(params.id, "inventory item");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<InventoryItem>(storePath(store_id, collection), body, options);
  },

  update(params: UpdateInventoryItemParams, options?: RequestOptions): Promise<InventoryItem> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<InventoryItem>(storeRecordPath(store_id, collection, id), body, options);
  },

  get(params: GetInventoryItemParams, options?: RequestOptions): Promise<InventoryItem> {
    return apiConfig.httpClient.get<InventoryItem>(storeRecordPath(params.store_id, collection, params.id), options);
  },

  getByKey(params: GetInventoryItemByKeyParams, options?: RequestOptions): Promise<InventoryItem> {
    return apiConfig.httpClient.get<InventoryItem>(
      storePath(params.store_id, `${collection}/by-key/${segment(params.key)}`),
      options,
    );
  },

  find(params: FindInventoryItemsParams, options?: RequestOptions): Promise<PaginatedResponse<InventoryItem>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<InventoryItem>>(storePath(store_id, collection), {
      ...options,
      params: query,
    });
  },

  delete(params: DeleteInventoryItemParams, options?: RequestOptions): Promise<InventoryItem | undefined> {
    return apiConfig.httpClient.delete<InventoryItem | undefined>(storeRecordPath(params.store_id, collection, params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});
