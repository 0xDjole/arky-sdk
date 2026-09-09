import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { Payment } from "../types/payment";
import type {
  FindPaymentsParams,
  GetPaymentParams,
  MarkCashOnDeliveryPaidParams,
  RequestOptions,
} from "../types/api";

export const createPaymentApi = (apiConfig: ApiConfig) => {
  const storeId = (store_id?: string) => store_id || apiConfig.storeId;
  return {
    async find(
      params: FindPaymentsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Payment>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Payment>>(
        `/v1/stores/${storeId(store_id)}/payments`,
        { ...options, params: query },
      );
    },
    async get(params: GetPaymentParams, options?: RequestOptions): Promise<Payment> {
      return apiConfig.httpClient.get<Payment>(
        `/v1/stores/${storeId(params.store_id)}/payments/${params.id}`,
        options,
      );
    },
    async markCashOnDeliveryPaid(
      params: MarkCashOnDeliveryPaidParams,
      options?: RequestOptions,
    ): Promise<Payment> {
      return apiConfig.httpClient.post<Payment>(
        `/v1/stores/${storeId(params.store_id)}/payments/${params.id}/cash-on-delivery/mark-paid`,
        {},
        options,
      );
    },
  };
};
