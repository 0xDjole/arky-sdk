import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { DeletedResponse, PaginatedResponse } from "../types/common";
import type {
  CreateShippingProfileParams,
  DeleteShippingProfileParams,
  FindShippingProfilesParams,
  ShippingProfile,
  UpdateShippingProfileParams,
} from "../types/shipping";
import type { TenantRecordByKeyParams, TenantRecordParams } from "../types/market";
import { requireId } from "../utils/ids";
import { segment, tenantPath, tenantRecordPath } from "./paths";

const collection = "shipping-profiles";

export const createShippingProfileApi = (apiConfig: ApiConfig) => ({
  find(params: FindShippingProfilesParams, options?: RequestOptions): Promise<PaginatedResponse<ShippingProfile>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<ShippingProfile>>(tenantPath(tenant_id, collection), { ...options, params: query });
  },

  get(params: TenantRecordParams, options?: RequestOptions): Promise<ShippingProfile> {
    return apiConfig.httpClient.get<ShippingProfile>(tenantRecordPath(params.tenant_id, collection, params.id), options);
  },

  getByKey(params: TenantRecordByKeyParams, options?: RequestOptions): Promise<ShippingProfile> {
    return apiConfig.httpClient.get<ShippingProfile>(tenantPath(params.tenant_id, `${collection}/by-key/${segment(params.key)}`), options);
  },

  create(params: CreateShippingProfileParams, options?: RequestOptions): Promise<ShippingProfile> {
    requireId(params.id, "shipping profile");
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<ShippingProfile>(tenantPath(tenant_id, collection), body, options);
  },

  update(params: UpdateShippingProfileParams, options?: RequestOptions): Promise<ShippingProfile> {
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.put<ShippingProfile>(tenantRecordPath(tenant_id, collection, id), body, options);
  },

  delete(params: DeleteShippingProfileParams, options?: RequestOptions): Promise<DeletedResponse> {
    return apiConfig.httpClient.delete<DeletedResponse>(tenantRecordPath(params.tenant_id, collection, params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});
