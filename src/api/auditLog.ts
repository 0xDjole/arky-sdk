import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type { AuditLog, FindAuditLogsParams } from "../types/auditLog";
import { storePath } from "./paths";

export const createAuditLogApi = (apiConfig: ApiConfig) => ({
  find(params: FindAuditLogsParams, options?: RequestOptions): Promise<PaginatedResponse<AuditLog>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<AuditLog>>(storePath(store_id, "audit-logs"), {
      ...options,
      params: query,
    });
  },
});
