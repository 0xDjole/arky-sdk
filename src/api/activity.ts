import type { ApiConfig } from "../services/clientTypes";
import type { FindActivitiesParams, RequestOptions } from "../types/api";
import type { Activity } from "../types";

export interface ActivityTimelineParams {
  customer_id: string;
  store_id?: string;
  limit?: number;
  cursor?: string;
}

export const createActivityAdminApi = (apiConfig: ApiConfig) => ({
  async timeline(
    params: ActivityTimelineParams,
    options?: RequestOptions,
  ): Promise<{ items: Activity[]; cursor: string | null }> {
    const store_id = params.store_id || apiConfig.storeId;
    const queryParams: Record<string, unknown> = {
      customer_id: params.customer_id,
    };
    if (params.limit !== undefined) queryParams.limit = params.limit;
    if (params.cursor) queryParams.cursor = params.cursor;
    return apiConfig.httpClient.get<{
      items: Activity[];
      cursor: string | null;
    }>(
      `/v1/stores/${store_id}/customers/${params.customer_id}/activities`,
      { ...options, params: queryParams },
    );
  },

  async find(
    params: FindActivitiesParams,
    options?: RequestOptions,
  ): Promise<{ items: Activity[]; cursor: string | null }> {
    const store_id = params.store_id || apiConfig.storeId;
    const queryParams: Record<string, unknown> = {};
    if (params.customer_id) queryParams.customer_id = params.customer_id;
    if (params.limit !== undefined) queryParams.limit = params.limit;
    if (params.cursor) queryParams.cursor = params.cursor;
    return apiConfig.httpClient.get<{
      items: Activity[];
      cursor: string | null;
    }>(
      `/v1/stores/${store_id}/activities`,
      { ...options, params: queryParams },
    );
  },
});
