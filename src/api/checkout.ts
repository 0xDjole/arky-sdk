import { requireStoreId } from "../utils/storeTarget";
import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { OrderCheckoutResult } from "../types";

export const createCheckoutApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId: string) =>
    `/v1/stores/${encodeURIComponent(requireStoreId(storeId))}/orders`;

  return {
    resumePayment(
      params: { store_id: string; order_id: string },
      options?: RequestOptions,
    ): Promise<OrderCheckoutResult> {
      const { store_id, order_id } = params;
      return apiConfig.httpClient.post<OrderCheckoutResult>(
        `${basePath(store_id)}/${encodeURIComponent(order_id)}/payment-action`,
        undefined,
        options,
      );
    },
  };
};
