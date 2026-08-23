import type { ApiConfig } from "../services/clientTypes";
import type {
  CreateClassificationParams,
  UpdateClassificationParams,
  DeleteClassificationParams,
  GetClassificationParams,
  GetClassificationsParams,
  GetClassificationChildrenParams,
  RequestOptions,
} from "../types/api";
import type { Classification, PaginatedResponse } from "../types";

export const createClassificationApi = (apiConfig: ApiConfig) => {
  return {
    async createClassification(
      params: CreateClassificationParams,
      options?: RequestOptions,
    ): Promise<Classification> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Classification>(
        `/v1/stores/${target_store_id}/classifications`,
        payload,
        options,
      );
    },

    async updateClassification(
      params: UpdateClassificationParams,
      options?: RequestOptions,
    ): Promise<Classification> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<Classification>(
        `/v1/stores/${target_store_id}/classifications/${params.id}`,
        payload,
        options,
      );
    },

    async deleteClassification(
      params: DeleteClassificationParams,
      options?: RequestOptions,
    ): Promise<{ deleted: boolean }> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<{ deleted: boolean }>(
        `/v1/stores/${target_store_id}/classifications/${params.id}`,
        options,
      );
    },

    async getClassification(
      params: GetClassificationParams,
      options?: RequestOptions,
    ): Promise<Classification> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<Classification>(
        `/v1/stores/${target_store_id}/classifications/${params.id}`,
        options,
      );
    },

    async getClassifications(
      params: GetClassificationsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Classification>> {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<Classification>>(
        `/v1/stores/${target_store_id}/classifications`,
        {
          ...options,
          params: queryParams,
        }
      );
    },

    async getClassificationChildren(
      params: GetClassificationChildrenParams,
      options?: RequestOptions,
    ): Promise<Classification[]> {
      const { id, store_id } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<Classification[]>(
        `/v1/stores/${target_store_id}/classifications/${id}/children`,
        options,
      );
    },
  };
};
