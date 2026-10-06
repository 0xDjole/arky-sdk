import { requireStoreId } from "../utils/storeTarget";
import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  FindMessageDeliveriesParams,
  GetMessageDeliveryParams,
  MessageDelivery,
  StopMessageDeliveryParams,
} from "../types/messageDelivery";

export const createMessageDeliveryApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId: string) =>
    `/v1/stores/${encodeURIComponent(requireStoreId(storeId))}/message-deliveries`;

  return {
    find(
      params: FindMessageDeliveriesParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<MessageDelivery>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<MessageDelivery>>(basePath(store_id), {
        ...options,
        params: query,
      });
    },
    get(params: GetMessageDeliveryParams, options?: RequestOptions): Promise<MessageDelivery> {
      return apiConfig.httpClient.get<MessageDelivery>(
        `${basePath(params.store_id)}/${encodeURIComponent(params.id)}`,
        options,
      );
    },
    stop(params: StopMessageDeliveryParams, options?: RequestOptions): Promise<MessageDelivery> {
      const { store_id, id, expected_updated_at } = params;
      return apiConfig.httpClient.post<MessageDelivery>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/stop`,
        { expected_updated_at },
        options,
      );
    },
  };
};
