import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  CreateTenantLocationParams,
  DeleteTenantLocationParams,
  FindTenantLocationsParams,
  GetCountryParams,
  LocationCountry,
  SetTenantLocationFiscalParams,
  TenantLocation,
  TenantRecordByKeyParams,
  TenantRecordParams,
  UpdateTenantLocationParams,
} from "../types/market";
import { requireId } from "../utils/ids";
import { segment, tenantPath, tenantRecordPath } from "./paths";

export const createCountryApi = (apiConfig: Pick<ApiConfig, "httpClient">) => ({
  find(options?: RequestOptions): Promise<PaginatedResponse<LocationCountry>> {
    return apiConfig.httpClient.get<PaginatedResponse<LocationCountry>>("/v1/platform/countries", options);
  },

  get(params: GetCountryParams, options?: RequestOptions): Promise<LocationCountry> {
    return apiConfig.httpClient.get<LocationCountry>(`/v1/platform/countries/${segment(params.code)}`, options);
  },
});

export const createLocationApi = (apiConfig: ApiConfig) => ({

  find(params: FindTenantLocationsParams, options?: RequestOptions): Promise<PaginatedResponse<TenantLocation>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<TenantLocation>>(tenantPath(tenant_id, "locations"), {
      ...options,
      params: query,
    });
  },

  get(params: TenantRecordParams, options?: RequestOptions): Promise<TenantLocation> {
    return apiConfig.httpClient.get<TenantLocation>(tenantRecordPath(params.tenant_id, "locations", params.id), options);
  },

  getByKey(params: TenantRecordByKeyParams, options?: RequestOptions): Promise<TenantLocation> {
    return apiConfig.httpClient.get<TenantLocation>(
      tenantPath(params.tenant_id, `locations/by-key/${segment(params.key)}`),
      options,
    );
  },

  create(params: CreateTenantLocationParams, options?: RequestOptions): Promise<TenantLocation> {
    requireId(params.id, "location");
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<TenantLocation>(tenantPath(tenant_id, "locations"), body, options);
  },

  update(params: UpdateTenantLocationParams, options?: RequestOptions): Promise<TenantLocation> {
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.put<TenantLocation>(tenantRecordPath(tenant_id, "locations", id), body, options);
  },

  setFiscal(params: SetTenantLocationFiscalParams, options?: RequestOptions): Promise<TenantLocation> {
    return apiConfig.httpClient.put<TenantLocation>(
      `${tenantRecordPath(params.tenant_id, "locations", params.id)}/fiscal`,
      { expected_updated_at: params.expected_updated_at, fiscal: params.fiscal },
      options,
    );
  },

  delete(params: DeleteTenantLocationParams, options?: RequestOptions): Promise<TenantLocation> {
    return apiConfig.httpClient.delete<TenantLocation>(tenantRecordPath(params.tenant_id, "locations", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});
