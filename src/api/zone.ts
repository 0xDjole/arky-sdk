import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { DeletedResponse, PaginatedResponse } from "../types/common";
import type {
  CreateZoneParams,
  DeleteZoneParams,
  FindZonesParams,
  Zone,
  TenantRecordByKeyParams,
  TenantRecordParams,
  UpdateZoneParams,
} from "../types/market";
import { requireId } from "../utils/ids";
import { segment, tenantPath, tenantRecordPath } from "./paths";

const collection = "zones";

export const createZoneApi = (apiConfig: ApiConfig) => ({
  find(params: FindZonesParams, options?: RequestOptions): Promise<PaginatedResponse<Zone>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<Zone>>(tenantPath(tenant_id, collection), { ...options, params: query });
  },

  get(params: TenantRecordParams, options?: RequestOptions): Promise<Zone> {
    return apiConfig.httpClient.get<Zone>(tenantRecordPath(params.tenant_id, collection, params.id), options);
  },

  getByKey(params: TenantRecordByKeyParams, options?: RequestOptions): Promise<Zone> {
    return apiConfig.httpClient.get<Zone>(tenantPath(params.tenant_id, `${collection}/by-key/${segment(params.key)}`), options);
  },

  create(params: CreateZoneParams, options?: RequestOptions): Promise<Zone> {
    requireId(params.id, "zone");
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<Zone>(tenantPath(tenant_id, collection), body, options);
  },

  update(params: UpdateZoneParams, options?: RequestOptions): Promise<Zone> {
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.put<Zone>(tenantRecordPath(tenant_id, collection, id), body, options);
  },

  delete(params: DeleteZoneParams, options?: RequestOptions): Promise<DeletedResponse> {
    return apiConfig.httpClient.delete<DeletedResponse>(tenantRecordPath(params.tenant_id, collection, params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});
