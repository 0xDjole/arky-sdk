import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { DeletedResponse, PaginatedResponse } from "../types/common";
import type {
  CreateShippingMethodParams,
  DeleteShippingMethodParams,
  FindShippingMethodsParams,
  ShippingMethod,
  UpdateShippingMethodParams,
} from "../types/shipping";
import type { TenantRecordByKeyParams, TenantRecordParams } from "../types/market";
import { requireId } from "../utils/ids";
import { segment, tenantPath, tenantRecordPath } from "./paths";

const collection = "shipping-methods";

export const createShippingMethodApi = (apiConfig: ApiConfig) => ({
  find(params: FindShippingMethodsParams, options?: RequestOptions): Promise<PaginatedResponse<ShippingMethod>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<ShippingMethod>>(tenantPath(tenant_id, collection), { ...options, params: query });
  },

  get(params: TenantRecordParams, options?: RequestOptions): Promise<ShippingMethod> {
    return apiConfig.httpClient.get<ShippingMethod>(tenantRecordPath(params.tenant_id, collection, params.id), options);
  },

  getByKey(params: TenantRecordByKeyParams, options?: RequestOptions): Promise<ShippingMethod> {
    return apiConfig.httpClient.get<ShippingMethod>(tenantPath(params.tenant_id, `${collection}/by-key/${segment(params.key)}`), options);
  },

  create(params: CreateShippingMethodParams, options?: RequestOptions): Promise<ShippingMethod> {
    requireId(params.id, "shipping method");
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<ShippingMethod>(tenantPath(tenant_id, collection), body, options);
  },

  update(params: UpdateShippingMethodParams, options?: RequestOptions): Promise<ShippingMethod> {
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.put<ShippingMethod>(tenantRecordPath(tenant_id, collection, id), body, options);
  },

  delete(params: DeleteShippingMethodParams, options?: RequestOptions): Promise<DeletedResponse> {
    return apiConfig.httpClient.delete<DeletedResponse>(tenantRecordPath(params.tenant_id, collection, params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});
