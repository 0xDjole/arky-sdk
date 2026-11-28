import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  CreateSalesChannelParams,
  DeleteSalesChannelParams,
  FindSalesChannelsParams,
  SalesChannel,
  TenantRecordByKeyParams,
  TenantRecordParams,
  UpdateSalesChannelParams,
} from "../types/market";
import { requireId } from "../utils/ids";
import { segment, tenantPath, tenantRecordPath } from "./paths";

const collection = "sales-channels";

export const createSalesChannelApi = (apiConfig: ApiConfig) => ({
  find(params: FindSalesChannelsParams, options?: RequestOptions): Promise<PaginatedResponse<SalesChannel>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<SalesChannel>>(tenantPath(tenant_id, collection), {
      ...options,
      params: query,
    });
  },

  get(params: TenantRecordParams, options?: RequestOptions): Promise<SalesChannel> {
    return apiConfig.httpClient.get<SalesChannel>(tenantRecordPath(params.tenant_id, collection, params.id), options);
  },

  getByKey(params: TenantRecordByKeyParams, options?: RequestOptions): Promise<SalesChannel> {
    return apiConfig.httpClient.get<SalesChannel>(
      tenantPath(params.tenant_id, `${collection}/by-key/${segment(params.key)}`),
      options,
    );
  },

  create(params: CreateSalesChannelParams, options?: RequestOptions): Promise<SalesChannel> {
    requireId(params.id, "sales channel");
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<SalesChannel>(tenantPath(tenant_id, collection), body, options);
  },

  update(params: UpdateSalesChannelParams, options?: RequestOptions): Promise<SalesChannel> {
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.put<SalesChannel>(tenantRecordPath(tenant_id, collection, id), body, options);
  },

  delete(params: DeleteSalesChannelParams, options?: RequestOptions): Promise<{ deleted: true }> {
    return apiConfig.httpClient.delete<{ deleted: true }>(tenantRecordPath(params.tenant_id, collection, params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});
