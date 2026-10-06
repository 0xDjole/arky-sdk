import { requireStoreId } from "../utils/storeTarget";
import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type {
  FulfillmentRouting,
  GetFulfillmentRoutingParams,
  UpdateFulfillmentRoutingParams,
} from "../types/fulfillmentRouting";

export const createFulfillmentRoutingApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId: string) =>
    `/v1/stores/${encodeURIComponent(requireStoreId(storeId))}/fulfillment-routing`;

  return {
    get(params: GetFulfillmentRoutingParams, options?: RequestOptions): Promise<FulfillmentRouting> {
      return apiConfig.httpClient.get<FulfillmentRouting>(basePath(params.store_id), options);
    },
    update(params: UpdateFulfillmentRoutingParams, options?: RequestOptions): Promise<FulfillmentRouting> {
      const { store_id, expected_updated_at, rules, otherwise } = params;
      return apiConfig.httpClient.put<FulfillmentRouting>(
        basePath(store_id),
        { expected_updated_at, rules, otherwise },
        options,
      );
    },
  };
};
