import { requireStoreId } from "../utils/storeTarget";
import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  CreateStoreRoleParams,
  DeleteStoreRoleParams,
  FindStoreRolesParams,
  GetStoreRoleParams,
  StoreRole,
  UpdateStoreRoleParams,
} from "../types/storeRole";

export const createStoreRoleApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId: string) =>
    `/v1/stores/${encodeURIComponent(requireStoreId(storeId))}/roles`;

  return {
    create(params: CreateStoreRoleParams, options?: RequestOptions): Promise<StoreRole> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<StoreRole>(basePath(store_id), payload, options);
    },
    update(params: UpdateStoreRoleParams, options?: RequestOptions): Promise<StoreRole> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<StoreRole>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },
    get(params: GetStoreRoleParams, options?: RequestOptions): Promise<StoreRole> {
      return apiConfig.httpClient.get<StoreRole>(
        `${basePath(params.store_id)}/${encodeURIComponent(params.id)}`,
        options,
      );
    },
    find(
      params: FindStoreRolesParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<StoreRole>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<StoreRole>>(basePath(store_id), {
        ...options,
        params: query,
      });
    },
    delete(params: DeleteStoreRoleParams, options?: RequestOptions): Promise<StoreRole> {
      const { store_id, id, expected_updated_at } = params;
      return apiConfig.httpClient.delete<StoreRole>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        { ...options, params: { expected_updated_at } },
      );
    },
  };
};
