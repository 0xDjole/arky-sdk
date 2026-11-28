import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  Category,
  CreateCategoryParams,
  DeleteCategoryParams,
  FindCategoriesParams,
  FindCategoryChildrenParams,
  GetCategoryByKeyParams,
  GetCategoryParams,
  UpdateCategoryParams,
} from "../types/content";
import { requireId } from "../utils/ids";
import { segment, tenantPath, tenantRecordPath } from "./paths";

export const createCategoryApi = (apiConfig: ApiConfig) => ({
  find(params: FindCategoriesParams, options?: RequestOptions): Promise<PaginatedResponse<Category>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<Category>>(tenantPath(tenant_id, "categories"), {
      ...options,
      params: query,
    });
  },

  get(params: GetCategoryParams, options?: RequestOptions): Promise<Category> {
    return apiConfig.httpClient.get<Category>(tenantRecordPath(params.tenant_id, "categories", params.id), options);
  },

  getByKey(params: GetCategoryByKeyParams, options?: RequestOptions): Promise<Category> {
    return apiConfig.httpClient.get<Category>(tenantPath(params.tenant_id, `categories/by-key/${segment(params.key)}`), options);
  },

  findChildren(params: FindCategoryChildrenParams, options?: RequestOptions): Promise<PaginatedResponse<Category>> {
    const { tenant_id, id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<Category>>(`${tenantRecordPath(tenant_id, "categories", id)}/children`, {
      ...options,
      params: query,
    });
  },

  create(params: CreateCategoryParams, options?: RequestOptions): Promise<Category> {
    requireId(params.id, "category");
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<Category>(tenantPath(tenant_id, "categories"), body, options);
  },

  update(params: UpdateCategoryParams, options?: RequestOptions): Promise<Category> {
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.put<Category>(tenantRecordPath(tenant_id, "categories", id), body, options);
  },

  delete(params: DeleteCategoryParams, options?: RequestOptions): Promise<Category> {
    return apiConfig.httpClient.delete<Category>(tenantRecordPath(params.tenant_id, "categories", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});
