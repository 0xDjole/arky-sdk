import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types";
import type { OrderPickup, FindOrderPickupsParams, GetOrderPickupParams } from "../types/orderPickup";

export const createOrderPickupApi = (config: ApiConfig) => ({
  find(params: FindOrderPickupsParams, options?: RequestOptions): Promise<PaginatedResponse<OrderPickup>> {
    const { store_id, order_id, ...query } = params;
    return config.httpClient.get<PaginatedResponse<OrderPickup>>(
      `/v1/stores/${encodeURIComponent(store_id || config.storeId)}/orders/${encodeURIComponent(order_id)}/pickups`,
      { ...options, params: query },
    );
  },
  get(params: GetOrderPickupParams, options?: RequestOptions): Promise<OrderPickup> {
    return config.httpClient.get<OrderPickup>(
      `/v1/stores/${encodeURIComponent(params.store_id || config.storeId)}/orders/${encodeURIComponent(params.order_id)}/pickups/${encodeURIComponent(params.pickup_id)}`,
      options,
    );
  },
});
