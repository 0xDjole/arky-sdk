import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type { AuditLog, FindAuditLogsParams } from "../types/auditLog";
import { tenantPath } from "./paths";

export const createAuditLogApi = (apiConfig: ApiConfig) => ({
  find(params: FindAuditLogsParams, options?: RequestOptions): Promise<PaginatedResponse<AuditLog>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<AuditLog>>(tenantPath(tenant_id, "audit-logs"), {
      ...options,
      params: query,
    });
  },
});
