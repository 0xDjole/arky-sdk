import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type { CreateReturnParams, ExecuteReturnParams, FindReturnsParams, GetReturnParams, Return } from "../types/return";

export const createReturnApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/returns`;

  return {
    create(params: CreateReturnParams, options?: RequestOptions): Promise<Return> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<Return>(basePath(store_id), payload, options);
    },
    get(params: GetReturnParams, options?: RequestOptions): Promise<Return> {
      const { store_id, return_id } = params;
      return apiConfig.httpClient.get<Return>(`${basePath(store_id)}/${encodeURIComponent(return_id)}`, options);
    },
    find(params: FindReturnsParams = {}, options?: RequestOptions): Promise<PaginatedResponse<Return>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Return>>(basePath(store_id), { ...options, params: query });
    },
    execute(params: ExecuteReturnParams, options?: RequestOptions): Promise<Return> {
      const { store_id, return_id, ...payload } = params;
      return apiConfig.httpClient.post<Return>(`${basePath(store_id)}/${encodeURIComponent(return_id)}/execute`, payload, options);
    },
  };
};
