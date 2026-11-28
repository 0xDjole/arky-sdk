import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { DeletedResponse, PaginatedResponse } from "../types/common";
import type {
  ChangeSetAsideParams,
  CreateInventoryLevelParams,
  FindInventoryLevelsParams,
  GetInventoryLevelParams,
  InventoryLevel,
  InventoryStockLevel,
  MoveInventoryParams,
  ReceiveStockMoveParams,
  RemoveInventoryLevelParams,
} from "../types/inventory";
import { requireId } from "../utils/ids";
import { tenantPath, tenantRecordPath } from "./paths";

const collection = "inventory-levels";

export const createInventoryLevelApi = (apiConfig: ApiConfig) => {
  const action = <T>(tenantId: string, id: string, verb: string, body: object, options?: RequestOptions) =>
    apiConfig.httpClient.post<T>(`${tenantRecordPath(tenantId, collection, id)}/${verb}`, body, options);

  return {
    create(params: CreateInventoryLevelParams, options?: RequestOptions): Promise<InventoryLevel> {
      requireId(params.id, "inventory level");
      const { tenant_id, ...body } = params;
      return apiConfig.httpClient.post<InventoryLevel>(tenantPath(tenant_id, collection), body, options);
    },

    get(params: GetInventoryLevelParams, options?: RequestOptions): Promise<InventoryLevel> {
      return apiConfig.httpClient.get<InventoryLevel>(tenantRecordPath(params.tenant_id, collection, params.id), options);
    },

    find(params: FindInventoryLevelsParams, options?: RequestOptions): Promise<PaginatedResponse<InventoryLevel>> {
      const { tenant_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<InventoryLevel>>(tenantPath(tenant_id, collection), {
        ...options,
        params: query,
      });
    },

    findStock(params: FindInventoryLevelsParams, options?: RequestOptions): Promise<PaginatedResponse<InventoryStockLevel>> {
      const { tenant_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<InventoryStockLevel>>(tenantPath(tenant_id, `${collection}/stock`), {
        ...options,
        params: query,
      });
    },

    setAside(params: ChangeSetAsideParams, options?: RequestOptions): Promise<InventoryLevel> {
      requireId(params.action_id, "action");
      const { tenant_id, id, ...body } = params;
      return action<InventoryLevel>(tenant_id, id, "set-aside", body, options);
    },

    makeAvailable(params: ChangeSetAsideParams, options?: RequestOptions): Promise<InventoryLevel> {
      requireId(params.action_id, "action");
      const { tenant_id, id, ...body } = params;
      return action<InventoryLevel>(tenant_id, id, "make-available", body, options);
    },

    move(params: MoveInventoryParams, options?: RequestOptions): Promise<InventoryLevel> {
      requireId(params.action_id, "action");
      const { tenant_id, id, ...body } = params;
      return action<InventoryLevel>(tenant_id, id, "move", body, options);
    },

    receiveMove(params: ReceiveStockMoveParams, options?: RequestOptions): Promise<InventoryLevel> {
      requireId(params.action_id, "action");
      const { tenant_id, id, ...body } = params;
      return action<InventoryLevel>(tenant_id, id, "incoming", body, options);
    },

    remove(params: RemoveInventoryLevelParams, options?: RequestOptions): Promise<DeletedResponse> {
      return apiConfig.httpClient.delete<DeletedResponse>(tenantRecordPath(params.tenant_id, collection, params.id), {
        ...options,
        params: { expected_updated_at: params.expected_updated_at },
      });
    },
  };
};
