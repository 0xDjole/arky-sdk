import type { ApiConfig } from "../services/clientTypes";
import type { FindCustomerActionsParams, RequestOptions } from "../types/api";
import type { CustomerAction, PaginatedResponse } from "../types";

export const createActionsApi = (apiConfig: ApiConfig) => ({
  async find(
    params: FindCustomerActionsParams,
    options?: RequestOptions,
  ): Promise<PaginatedResponse<CustomerAction>> {
    const store_id = params.store_id || apiConfig.storeId;
    const queryParams: Record<string, unknown> = {};
    if (params.customer_id) queryParams.customer_id = params.customer_id;
    if (params.limit !== undefined) queryParams.limit = params.limit;
    if (params.cursor) queryParams.cursor = params.cursor;
    return apiConfig.httpClient.get<PaginatedResponse<CustomerAction>>(
      `/v1/stores/${store_id}/actions`,
      { ...options, params: queryParams },
    );
  },
});
