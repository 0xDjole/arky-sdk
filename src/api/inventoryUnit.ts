import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  AllocateInventoryUnitParams,
  FindInventoryUnitsParams,
  GetInventoryUnitParams,
  InventoryUnit,
  InventoryUnitExecution,
  MoveInventoryUnitParams,
  ReceiveInventoryUnitParams,
  UnassignInventoryUnitParams,
  WriteOffInventoryUnitParams,
} from "../types/inventory";
import { requireId } from "../utils/ids";
import { storePath, storeRecordPath } from "./paths";

const collection = "inventory-units";

export const createInventoryUnitApi = (apiConfig: ApiConfig) => ({
  receive(params: ReceiveInventoryUnitParams, options?: RequestOptions): Promise<InventoryUnit> {
    requireId(params.id, "inventory unit");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<InventoryUnit>(storePath(store_id, collection), body, options);
  },

  find(params: FindInventoryUnitsParams, options?: RequestOptions): Promise<PaginatedResponse<InventoryUnit>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<InventoryUnit>>(storePath(store_id, collection), {
      ...options,
      params: query,
    });
  },

  get(params: GetInventoryUnitParams, options?: RequestOptions): Promise<InventoryUnit> {
    return apiConfig.httpClient.get<InventoryUnit>(storeRecordPath(params.store_id, collection, params.id), options);
  },

  allocate(params: AllocateInventoryUnitParams, options?: RequestOptions): Promise<InventoryUnit> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.post<InventoryUnit>(`${storeRecordPath(store_id, collection, id)}/allocate`, body, options);
  },

  unassign(params: UnassignInventoryUnitParams, options?: RequestOptions): Promise<InventoryUnit> {
    return apiConfig.httpClient.post<InventoryUnit>(
      `${storeRecordPath(params.store_id, collection, params.id)}/unassign`,
      { expected_updated_at: params.expected_updated_at },
      options,
    );
  },

  execution(params: GetInventoryUnitParams, options?: RequestOptions): Promise<InventoryUnitExecution | null> {
    return apiConfig.httpClient.get<InventoryUnitExecution | null>(
      `${storeRecordPath(params.store_id, collection, params.id)}/execution`,
      options,
    );
  },

  move(params: MoveInventoryUnitParams, options?: RequestOptions): Promise<InventoryUnit> {
    requireId(params.action_id, "action");
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.post<InventoryUnit>(`${storeRecordPath(store_id, collection, id)}/move`, body, options);
  },

  writeOff(params: WriteOffInventoryUnitParams, options?: RequestOptions): Promise<InventoryUnit> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.post<InventoryUnit>(`${storeRecordPath(store_id, collection, id)}/write-off`, body, options);
  },
});
