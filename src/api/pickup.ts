import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types";
import type { Pickup, FindPickupsParams, GetPickupParams, CreatePickupParams, ExecutePickupParams } from "../types/pickup";

export const createPickupApi = (config: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId || config.storeId)}/pickups`;

  return {
    create(params: CreatePickupParams, options?: RequestOptions): Promise<Pickup> {
      const { store_id, ...payload } = params;
      return config.httpClient.post<Pickup>(basePath(store_id), payload, options);
    },
    execute(params: ExecutePickupParams, options?: RequestOptions): Promise<Pickup> {
      const { store_id, pickup_id, ...payload } = params;
      return config.httpClient.post<Pickup>(
        `${basePath(store_id)}/${encodeURIComponent(pickup_id)}/commands`,
        payload, options,
      );
    },
    find(params: FindPickupsParams, options?: RequestOptions): Promise<PaginatedResponse<Pickup>> {
      const { store_id, ...query } = params;
      return config.httpClient.get<PaginatedResponse<Pickup>>(basePath(store_id), { ...options, params: query });
    },
    get(params: GetPickupParams, options?: RequestOptions): Promise<Pickup> {
      return config.httpClient.get<Pickup>(
        `${basePath(params.store_id)}/${encodeURIComponent(params.pickup_id)}`,
        options,
      );
    },
  };
};
