import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
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
import { storePath, storeRecordPath } from "./paths";

const collection = "inventory-levels";

export const createInventoryLevelApi = (apiConfig: ApiConfig) => {
  const action = <T>(storeId: string, id: string, verb: string, body: object, options?: RequestOptions) =>
    apiConfig.httpClient.post<T>(`${storeRecordPath(storeId, collection, id)}/${verb}`, body, options);

  return {
    create(params: CreateInventoryLevelParams, options?: RequestOptions): Promise<InventoryLevel> {
      requireId(params.id, "inventory level");
      const { store_id, ...body } = params;
      return apiConfig.httpClient.post<InventoryLevel>(storePath(store_id, collection), body, options);
    },

    get(params: GetInventoryLevelParams, options?: RequestOptions): Promise<InventoryLevel> {
      return apiConfig.httpClient.get<InventoryLevel>(storeRecordPath(params.store_id, collection, params.id), options);
    },

    find(params: FindInventoryLevelsParams, options?: RequestOptions): Promise<PaginatedResponse<InventoryLevel>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<InventoryLevel>>(storePath(store_id, collection), {
        ...options,
        params: query,
      });
    },

    stock(params: FindInventoryLevelsParams, options?: RequestOptions): Promise<PaginatedResponse<InventoryStockLevel>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<InventoryStockLevel>>(storePath(store_id, `${collection}/stock`), {
        ...options,
        params: query,
      });
    },

    setAside(params: ChangeSetAsideParams, options?: RequestOptions): Promise<InventoryLevel> {
      requireId(params.action_id, "action");
      const { store_id, id, ...body } = params;
      return action<InventoryLevel>(store_id, id, "set-aside", body, options);
    },

    makeAvailable(params: ChangeSetAsideParams, options?: RequestOptions): Promise<InventoryLevel> {
      requireId(params.action_id, "action");
      const { store_id, id, ...body } = params;
      return action<InventoryLevel>(store_id, id, "make-available", body, options);
    },

    move(params: MoveInventoryParams, options?: RequestOptions): Promise<InventoryLevel> {
      requireId(params.action_id, "action");
      const { store_id, id, ...body } = params;
      return action<InventoryLevel>(store_id, id, "move", body, options);
    },

    receiveMove(params: ReceiveStockMoveParams, options?: RequestOptions): Promise<InventoryLevel> {
      requireId(params.action_id, "action");
      const { store_id, id, ...body } = params;
      return action<InventoryLevel>(store_id, id, "incoming", body, options);
    },

    remove(params: RemoveInventoryLevelParams, options?: RequestOptions): Promise<void> {
      return apiConfig.httpClient.delete<void>(storeRecordPath(params.store_id, collection, params.id), {
        ...options,
        params: { expected_updated_at: params.expected_updated_at },
      });
    },
  };
};
