import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  OrderCredit,
  CreateOrderCreditParams,
  GetOrderCreditParams,
  FindOrderCreditsParams,
} from "../types/orderCredit";

export const createOrderCreditApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId: string | undefined, orderId: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/orders/${encodeURIComponent(orderId)}/credits`;

  return {
    create(params: CreateOrderCreditParams, options?: RequestOptions): Promise<OrderCredit> {
      const { store_id, order_id, ...payload } = params;
      return apiConfig.httpClient.post<OrderCredit>(
        basePath(store_id, order_id),
        payload,
        options,
      );
    },
    get(params: GetOrderCreditParams, options?: RequestOptions): Promise<OrderCredit> {
      const { store_id, order_id, credit_id } = params;
      return apiConfig.httpClient.get<OrderCredit>(
        `${basePath(store_id, order_id)}/${encodeURIComponent(credit_id)}`,
        options,
      );
    },
    find(
      params: FindOrderCreditsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<OrderCredit>> {
      const { store_id, order_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<OrderCredit>>(
        basePath(store_id, order_id),
        { ...options, params: query },
      );
    },
  };
};
