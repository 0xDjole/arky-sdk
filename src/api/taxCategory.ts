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
import type { TenantRecordByKeyParams, TenantRecordParams } from "../types/market";
import { requireId } from "../utils/ids";
import { segment, tenantPath, tenantRecordPath } from "./paths";

const collection = "tax-categories";

export const createTaxCategoryApi = (apiConfig: ApiConfig) => ({
  find(params: FindTaxCategoriesParams, options?: RequestOptions): Promise<PaginatedResponse<TaxCategory>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<TaxCategory>>(tenantPath(tenant_id, collection), { ...options, params: query });
  },

  get(params: TenantRecordParams, options?: RequestOptions): Promise<TaxCategory> {
    return apiConfig.httpClient.get<TaxCategory>(tenantRecordPath(params.tenant_id, collection, params.id), options);
  },

  getByKey(params: TenantRecordByKeyParams, options?: RequestOptions): Promise<TaxCategory> {
    return apiConfig.httpClient.get<TaxCategory>(tenantPath(params.tenant_id, `${collection}/by-key/${segment(params.key)}`), options);
  },

  create(params: CreateTaxCategoryParams, options?: RequestOptions): Promise<TaxCategory> {
    requireId(params.id, "tax category");
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<TaxCategory>(tenantPath(tenant_id, collection), body, options);
  },

  update(params: UpdateTaxCategoryParams, options?: RequestOptions): Promise<TaxCategory> {
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.put<TaxCategory>(tenantRecordPath(tenant_id, collection, id), body, options);
  },

  delete(params: DeleteTaxCategoryParams, options?: RequestOptions): Promise<DeletedResponse> {
    return apiConfig.httpClient.delete<DeletedResponse>(tenantRecordPath(params.tenant_id, collection, params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});
