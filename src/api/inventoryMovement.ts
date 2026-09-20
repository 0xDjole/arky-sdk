import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  FindInventoryMovementsParams,
  GetInventoryMovementParams,
  InventoryMovement,
  RecordInventoryMovementParams,
} from "../types/inventory";

export const createInventoryMovementApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/inventory-movements`;

  return {
    record(
      params: RecordInventoryMovementParams,
      options?: RequestOptions,
    ): Promise<InventoryMovement> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<InventoryMovement>(basePath(store_id), payload, options);
    },
    get(params: GetInventoryMovementParams, options?: RequestOptions): Promise<InventoryMovement> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<InventoryMovement>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    find(
      params: FindInventoryMovementsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<InventoryMovement>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<InventoryMovement>>(basePath(store_id), {
        ...options,
        params: query,
      });
    },
  };
};
