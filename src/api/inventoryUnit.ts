import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  AllocateInventoryUnitParams,
  FindInventoryUnitsParams,
  GetInventoryUnitParams,
  InventoryUnit,
  ChangeInventoryUnitSetAsideParams,
  MoveInventoryUnitParams,
  ReceiveInventoryUnitParams,
  UnassignInventoryUnitParams,
  WriteOffInventoryUnitParams,
} from "../types/inventory";
import { requireId } from "../utils/ids";
import { tenantPath, tenantRecordPath } from "./paths";

const collection = "inventory-units";

export const createInventoryUnitApi = (apiConfig: ApiConfig) => ({
  receive(params: ReceiveInventoryUnitParams, options?: RequestOptions): Promise<InventoryUnit> {
    requireId(params.id, "inventory unit");
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<InventoryUnit>(tenantPath(tenant_id, collection), body, options);
  },

  find(params: FindInventoryUnitsParams, options?: RequestOptions): Promise<PaginatedResponse<InventoryUnit>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<InventoryUnit>>(tenantPath(tenant_id, collection), {
      ...options,
      params: query,
    });
  },

  get(params: GetInventoryUnitParams, options?: RequestOptions): Promise<InventoryUnit> {
    return apiConfig.httpClient.get<InventoryUnit>(tenantRecordPath(params.tenant_id, collection, params.id), options);
  },

  allocate(params: AllocateInventoryUnitParams, options?: RequestOptions): Promise<InventoryUnit> {
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.post<InventoryUnit>(`${tenantRecordPath(tenant_id, collection, id)}/allocate`, body, options);
  },

  unassign(params: UnassignInventoryUnitParams, options?: RequestOptions): Promise<InventoryUnit> {
    return apiConfig.httpClient.post<InventoryUnit>(
      `${tenantRecordPath(params.tenant_id, collection, params.id)}/unassign`,
      { expected_updated_at: params.expected_updated_at },
      options,
    );
  },

  setAside(params: ChangeInventoryUnitSetAsideParams, options?: RequestOptions): Promise<InventoryUnit> {
    requireId(params.action_id, "action");
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.post<InventoryUnit>(`${tenantRecordPath(tenant_id, collection, id)}/set-aside`, body, options);
  },

  makeAvailable(params: ChangeInventoryUnitSetAsideParams, options?: RequestOptions): Promise<InventoryUnit> {
    requireId(params.action_id, "action");
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.post<InventoryUnit>(`${tenantRecordPath(tenant_id, collection, id)}/make-available`, body, options);
  },

  move(params: MoveInventoryUnitParams, options?: RequestOptions): Promise<InventoryUnit> {
    requireId(params.action_id, "action");
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.post<InventoryUnit>(`${tenantRecordPath(tenant_id, collection, id)}/move`, body, options);
  },

  writeOff(params: WriteOffInventoryUnitParams, options?: RequestOptions): Promise<InventoryUnit> {
    requireId(params.action_id, "action");
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.post<InventoryUnit>(`${tenantRecordPath(tenant_id, collection, id)}/write-off`, body, options);
  },
});
