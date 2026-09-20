import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  TaxCategory,
  CreateTaxCategoryParams,
  UpdateTaxCategoryParams,
  GetTaxCategoryParams,
  GetTaxCategoryByKeyParams,
  FindTaxCategoriesParams,
  DeleteTaxCategoryParams,
} from "../types/tax";

export const createTaxCategoryApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/tax-categories`;

  return {
    create(params: CreateTaxCategoryParams, options?: RequestOptions): Promise<TaxCategory> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<TaxCategory>(basePath(store_id), payload, options);
    },
    update(params: UpdateTaxCategoryParams, options?: RequestOptions): Promise<TaxCategory> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<TaxCategory>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },
    get(params: GetTaxCategoryParams, options?: RequestOptions): Promise<TaxCategory> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<TaxCategory>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    getByKey(params: GetTaxCategoryByKeyParams, options?: RequestOptions): Promise<TaxCategory> {
      const { store_id, key } = params;
      return apiConfig.httpClient.get<TaxCategory>(`${basePath(store_id)}/by-key/${encodeURIComponent(key)}`, options);
    },
    find(
      params: FindTaxCategoriesParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<TaxCategory>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<TaxCategory>>(basePath(store_id), {
        ...options,
        params: query,
      });
    },
    delete(params: DeleteTaxCategoryParams, options?: RequestOptions): Promise<TaxCategory> {
      const { store_id, id, expected_updated_at } = params;
      return apiConfig.httpClient.delete<TaxCategory>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        { ...options, params: { expected_updated_at } },
      );
    },
  };
};
