import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  FindInventoryMovementsParams,
  GetInventoryMovementParams,
  InventoryMovement,
  RecordInventoryMovementParams,
} from "../types/inventory";
import { requireId } from "../utils/ids";
import { storePath, storeRecordPath } from "./paths";

const collection = "inventory-movements";

export const createInventoryMovementApi = (apiConfig: ApiConfig) => ({
  record(params: RecordInventoryMovementParams, options?: RequestOptions): Promise<InventoryMovement> {
    requireId(params.action_id, "action");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<InventoryMovement>(storePath(store_id, collection), body, options);
  },

  get(params: GetInventoryMovementParams, options?: RequestOptions): Promise<InventoryMovement> {
    return apiConfig.httpClient.get<InventoryMovement>(storeRecordPath(params.store_id, collection, params.id), options);
  },

  find(params: FindInventoryMovementsParams, options?: RequestOptions): Promise<PaginatedResponse<InventoryMovement>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<InventoryMovement>>(storePath(store_id, collection), {
      ...options,
      params: query,
    });
  },
});
