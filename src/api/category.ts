import { requireStoreId } from "../utils/storeTarget";
import type { ApiConfig } from "../services/clientTypes";
import type {
  CreateCategoryParams,
  UpdateCategoryParams,
  DeleteCategoryParams,
  GetCategoryParams,
  GetCategoriesParams,
  GetCategoryChildrenParams,
  RequestOptions,
} from "../types/api";
import type { Category } from "../types";

export const createCategoryApi = (apiConfig: ApiConfig) => {
  return {
    async createCategory(
      params: CreateCategoryParams,
      options?: RequestOptions,
    ): Promise<Category> {
      const { store_id, ...payload } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.post<Category>(
        `/v1/stores/${requireStoreId(target_store_id)}/categories`,
        payload,
        options,
      );
    },

    async updateCategory(
      params: UpdateCategoryParams,
      options?: RequestOptions,
    ): Promise<Category> {
      const { store_id, id, ...payload } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.put<Category>(
        `/v1/stores/${requireStoreId(target_store_id)}/categories/${id}`,
        payload,
        options,
      );
    },

    async deleteCategory(
      params: DeleteCategoryParams,
      options?: RequestOptions,
    ): Promise<boolean> {
      const target_store_id = requireStoreId(params.store_id);
      return apiConfig.httpClient.delete<boolean>(
        `/v1/stores/${requireStoreId(target_store_id)}/categories/${params.id}`,
        options,
      );
    },

    async getCategory(
      params: GetCategoryParams,
      options?: RequestOptions,
    ): Promise<Category> {
      const target_store_id = requireStoreId(params.store_id);
      return apiConfig.httpClient.get<Category>(
        `/v1/stores/${requireStoreId(target_store_id)}/categories/${params.id}`,
        options,
      );
    },

    async getCategories(
      params: GetCategoriesParams,
      options?: RequestOptions,
    ): Promise<{ items: Category[]; cursor: string | null }> {
      const { store_id, ...queryParams } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.get<{ items: Category[]; cursor: string | null }>(
        `/v1/stores/${requireStoreId(target_store_id)}/categories`,
        {
          ...options,
          params: queryParams,
        }
      );
    },

    async getCategoryChildren(
      params: GetCategoryChildrenParams,
      options?: RequestOptions,
    ): Promise<{ items: Category[]; cursor: string | null }> {
      const { id, store_id, ...queryParams } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.get<{ items: Category[]; cursor: string | null }>(
        `/v1/stores/${requireStoreId(target_store_id)}/categories/${id}/children`,
        { ...options, params: queryParams },
      );
    },
  };
};
