import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  AllocateInventoryUnitParams,
  FindInventoryUnitsParams,
  GetInventoryUnitParams,
  InventoryUnit,
  MoveInventoryUnitParams,
  ReceiveInventoryUnitParams,
  UnassignInventoryUnitParams,
  WriteOffInventoryUnitParams,
} from "../types/inventoryUnit";

export const createInventoryUnitApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/inventory-units`;

  return {
    receive(params: ReceiveInventoryUnitParams, options?: RequestOptions): Promise<InventoryUnit> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<InventoryUnit>(basePath(store_id), payload, options);
    },
    get(params: GetInventoryUnitParams, options?: RequestOptions): Promise<InventoryUnit> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<InventoryUnit>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    find(
      params: FindInventoryUnitsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<InventoryUnit>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<InventoryUnit>>(basePath(store_id), {
        ...options,
        params: query,
      });
    },
    allocate(params: AllocateInventoryUnitParams, options?: RequestOptions): Promise<InventoryUnit> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.post<InventoryUnit>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/allocate`,
        payload,
        options,
      );
    },
    move(params: MoveInventoryUnitParams, options?: RequestOptions): Promise<InventoryUnit> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.post<InventoryUnit>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/move`,
        payload,
        options,
      );
    },
    writeOff(params: WriteOffInventoryUnitParams, options?: RequestOptions): Promise<InventoryUnit> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.post<InventoryUnit>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/write-off`,
        payload,
        options,
      );
    },
    unassign(params: UnassignInventoryUnitParams, options?: RequestOptions): Promise<InventoryUnit> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.post<InventoryUnit>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/unassign`,
        payload,
        options,
      );
    },
  };
};
