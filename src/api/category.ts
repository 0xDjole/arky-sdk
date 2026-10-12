import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  Category,
  CreateCategoryParams,
  DeleteCategoryParams,
  FindCategoriesParams,
  FindCategoryChildrenParams,
  GetCategoryParams,
  UpdateCategoryParams,
} from "../types/content";
import { requireId } from "../utils/ids";
import { storePath, storeRecordPath } from "./paths";

export const createCategoryApi = (apiConfig: ApiConfig) => ({
  find(params: FindCategoriesParams, options?: RequestOptions): Promise<PaginatedResponse<Category>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<Category>>(storePath(store_id, "categories"), {
      ...options,
      params: query,
    });
  },

  get(params: GetCategoryParams, options?: RequestOptions): Promise<Category> {
    return apiConfig.httpClient.get<Category>(storeRecordPath(params.store_id, "categories", params.id), options);
  },

  getChildren(params: FindCategoryChildrenParams, options?: RequestOptions): Promise<PaginatedResponse<Category>> {
    const { store_id, id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<Category>>(`${storeRecordPath(store_id, "categories", id)}/children`, {
      ...options,
      params: query,
    });
  },

  create(params: CreateCategoryParams, options?: RequestOptions): Promise<Category> {
    requireId(params.id, "category");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<Category>(storePath(store_id, "categories"), body, options);
  },

  update(params: UpdateCategoryParams, options?: RequestOptions): Promise<Category> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<Category>(storeRecordPath(store_id, "categories", id), body, options);
  },

  delete(params: DeleteCategoryParams, options?: RequestOptions): Promise<Category> {
    return apiConfig.httpClient.delete<Category>(storeRecordPath(params.store_id, "categories", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});
