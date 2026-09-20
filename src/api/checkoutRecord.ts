import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { Checkout, GetCheckoutParams } from "../types/checkout";
import type { OrderCheckoutResult } from "../types";

export const createCheckoutApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/checkouts`;

  return {
    resumePayment(params: GetCheckoutParams, options?: RequestOptions): Promise<OrderCheckoutResult> {
      const { store_id, id } = params;
      return apiConfig.httpClient.post<OrderCheckoutResult>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/payment-action`,
        {},
        options,
      );
    },
    get(params: GetCheckoutParams, options?: RequestOptions): Promise<Checkout> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<Checkout>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
  };
};
