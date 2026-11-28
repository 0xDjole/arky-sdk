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
import { tenantPath, tenantRecordPath } from "./paths";

const collection = "inventory-movements";

export const createInventoryMovementApi = (apiConfig: ApiConfig) => ({
  record(params: RecordInventoryMovementParams, options?: RequestOptions): Promise<InventoryMovement> {
    requireId(params.action_id, "action");
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<InventoryMovement>(tenantPath(tenant_id, collection), body, options);
  },

  get(params: GetInventoryMovementParams, options?: RequestOptions): Promise<InventoryMovement> {
    return apiConfig.httpClient.get<InventoryMovement>(tenantRecordPath(params.tenant_id, collection, params.id), options);
  },

  find(params: FindInventoryMovementsParams, options?: RequestOptions): Promise<PaginatedResponse<InventoryMovement>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<InventoryMovement>>(tenantPath(tenant_id, collection), {
      ...options,
      params: query,
    });
  },
});
