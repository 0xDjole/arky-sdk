import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { DeletedResponse, PaginatedResponse } from "../types/common";
import type {
  CreateTaxCategoryParams,
  DeleteTaxCategoryParams,
  FindTaxCategoriesParams,
  TaxCategory,
  UpdateTaxCategoryParams,
} from "../types/tax";
import type { StoreRecordByKeyParams, StoreRecordParams } from "../types/market";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";

const collection = "tax-categories";

export const createTaxCategoryApi = (apiConfig: ApiConfig) => ({
  find(params: FindTaxCategoriesParams, options?: RequestOptions): Promise<PaginatedResponse<TaxCategory>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<TaxCategory>>(storePath(store_id, collection), { ...options, params: query });
  },

  get(params: StoreRecordParams, options?: RequestOptions): Promise<TaxCategory> {
    return apiConfig.httpClient.get<TaxCategory>(storeRecordPath(params.store_id, collection, params.id), options);
  },

  getByKey(params: StoreRecordByKeyParams, options?: RequestOptions): Promise<TaxCategory> {
    return apiConfig.httpClient.get<TaxCategory>(storePath(params.store_id, `${collection}/by-key/${segment(params.key)}`), options);
  },

  create(params: CreateTaxCategoryParams, options?: RequestOptions): Promise<TaxCategory> {
    requireId(params.id, "tax category");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<TaxCategory>(storePath(store_id, collection), body, options);
  },

  update(params: UpdateTaxCategoryParams, options?: RequestOptions): Promise<TaxCategory> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<TaxCategory>(storeRecordPath(store_id, collection, id), body, options);
  },

  delete(params: DeleteTaxCategoryParams, options?: RequestOptions): Promise<DeletedResponse> {
    return apiConfig.httpClient.delete<DeletedResponse>(storeRecordPath(params.store_id, collection, params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});
