import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  ChangeSetAsideParams,
  CreateInventoryLevelParams,
  FindInventoryLevelsParams,
  GetInventoryLevelParams,
  InventoryLevel,
  MoveInventoryParams,
  RemoveInventoryLevelParams,
} from "../types/inventory";

export const createInventoryLevelApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/inventory-levels`;

  return {
    create(
      params: CreateInventoryLevelParams,
      options?: RequestOptions,
    ): Promise<InventoryLevel> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<InventoryLevel>(basePath(store_id), payload, options);
    },
    get(params: GetInventoryLevelParams, options?: RequestOptions): Promise<InventoryLevel> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<InventoryLevel>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    find(
      params: FindInventoryLevelsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<InventoryLevel>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<InventoryLevel>>(basePath(store_id), {
        ...options,
        params: query,
      });
    },
    setAside(params: ChangeSetAsideParams, options?: RequestOptions): Promise<InventoryLevel> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.post<InventoryLevel>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/set-aside`,
        payload,
        options,
      );
    },
    makeAvailable(params: ChangeSetAsideParams, options?: RequestOptions): Promise<InventoryLevel> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.post<InventoryLevel>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/make-available`,
        payload,
        options,
      );
    },
    move(params: MoveInventoryParams, options?: RequestOptions): Promise<InventoryLevel> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.post<InventoryLevel>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/move`,
        payload,
        options,
      );
    },
    remove(params: RemoveInventoryLevelParams, options?: RequestOptions): Promise<void> {
      const { store_id, id, expected_updated_at } = params;
      return apiConfig.httpClient.delete<void>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        { ...options, params: { expected_updated_at } },
      );
    },
  };
};
