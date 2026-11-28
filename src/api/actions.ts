import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type { UserAction, FindUserActionsParams } from "../types/userAction";
import { tenantPath } from "./paths";

export const createActionsApi = (apiConfig: ApiConfig) => ({
  find(params: FindUserActionsParams, options?: RequestOptions): Promise<PaginatedResponse<UserAction>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<UserAction>>(tenantPath(tenant_id, "actions"), {
      ...options,
      params: query,
    });
  },
});
