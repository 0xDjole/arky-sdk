import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type { CustomerAction, FindCustomerActionsParams } from "../types/customerAction";
import { storePath } from "./paths";

export const createActionsApi = (apiConfig: ApiConfig) => ({
  find(params: FindCustomerActionsParams, options?: RequestOptions): Promise<PaginatedResponse<CustomerAction>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<CustomerAction>>(storePath(store_id, "actions"), {
      ...options,
      params: query,
    });
  },
});
