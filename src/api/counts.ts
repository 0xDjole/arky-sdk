import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type {
  GetTenantStatusCountsParams,
  GetTenantCountReportParams,
  TenantCountReport,
  TenantStatusCounts,
} from "../types/tenantCount";
import { tenantPath } from "./paths";

export const createCountsApi = (apiConfig: ApiConfig) => ({
  getStatuses(params: GetTenantStatusCountsParams, options?: RequestOptions): Promise<TenantStatusCounts> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<TenantStatusCounts>(tenantPath(tenant_id, "counts/statuses"), {
      ...options,
      params: query,
    });
  },

  getReport(params: GetTenantCountReportParams, options?: RequestOptions): Promise<TenantCountReport> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<TenantCountReport>(tenantPath(tenant_id, "counts/report"), {
      ...options,
      params: query,
    });
  },
});
