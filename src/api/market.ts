import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  CreateMarketParams,
  DeleteMarketParams,
  FindMarketsParams,
  Market,
  TenantRecordByKeyParams,
  TenantRecordParams,
  UpdateMarketParams,
} from "../types/market";
import { requireId } from "../utils/ids";
import { segment, tenantPath, tenantRecordPath } from "./paths";

export const createMarketApi = (apiConfig: ApiConfig) => ({
  find(params: FindMarketsParams, options?: RequestOptions): Promise<PaginatedResponse<Market>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<Market>>(tenantPath(tenant_id, "markets"), { ...options, params: query });
  },

  get(params: TenantRecordParams, options?: RequestOptions): Promise<Market> {
    return apiConfig.httpClient.get<Market>(tenantRecordPath(params.tenant_id, "markets", params.id), options);
  },

  getByKey(params: TenantRecordByKeyParams, options?: RequestOptions): Promise<Market> {
    return apiConfig.httpClient.get<Market>(tenantPath(params.tenant_id, `markets/by-key/${segment(params.key)}`), options);
  },

  create(params: CreateMarketParams, options?: RequestOptions): Promise<Market> {
    requireId(params.id, "market");
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<Market>(tenantPath(tenant_id, "markets"), body, options);
  },

  update(params: UpdateMarketParams, options?: RequestOptions): Promise<Market> {
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.put<Market>(tenantRecordPath(tenant_id, "markets", id), body, options);
  },

  delete(params: DeleteMarketParams, options?: RequestOptions): Promise<Market> {
    return apiConfig.httpClient.delete<Market>(tenantRecordPath(params.tenant_id, "markets", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});
