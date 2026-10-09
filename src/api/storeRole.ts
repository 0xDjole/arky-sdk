import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { DeletedResponse, PaginatedResponse } from "../types/common";
import type {
  CreateStoreRoleParams,
  DeleteStoreRoleParams,
  FindStoreRolesParams,
  GetStoreRoleParams,
  StoreRole,
  UpdateStoreRoleParams,
} from "../types/storeRole";
import { requireId } from "../utils/ids";
import { storePath, storeRecordPath } from "./paths";

export const createStoreRoleApi = (apiConfig: ApiConfig) => ({
  find(params: FindStoreRolesParams, options?: RequestOptions): Promise<PaginatedResponse<StoreRole>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<StoreRole>>(storePath(store_id, "roles"), { ...options, params: query });
  },

  get(params: GetStoreRoleParams, options?: RequestOptions): Promise<StoreRole> {
    return apiConfig.httpClient.get<StoreRole>(storeRecordPath(params.store_id, "roles", params.id), options);
  },

  create(params: CreateStoreRoleParams, options?: RequestOptions): Promise<StoreRole> {
    requireId(params.id, "role");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<StoreRole>(storePath(store_id, "roles"), body, options);
  },

  update(params: UpdateStoreRoleParams, options?: RequestOptions): Promise<StoreRole> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<StoreRole>(storeRecordPath(store_id, "roles", id), body, options);
  },

  delete(params: DeleteStoreRoleParams, options?: RequestOptions): Promise<DeletedResponse> {
    return apiConfig.httpClient.delete<DeletedResponse>(storeRecordPath(params.store_id, "roles", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});
