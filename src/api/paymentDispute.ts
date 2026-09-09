import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse, PaymentDispute } from "../types";
import type { FindPaymentDisputesParams, GetPaymentDisputeParams, RequestOptions } from "../types/api";

export const createPaymentDisputeApi = (apiConfig: ApiConfig) => {
  const storeId = (store_id?: string) => store_id || apiConfig.storeId;
  return {
    async get(params: GetPaymentDisputeParams, options?: RequestOptions): Promise<PaymentDispute> {
      return apiConfig.httpClient.get<PaymentDispute>(
        `/v1/stores/${storeId(params.store_id)}/disputes/${params.dispute_id}`, options,
      );
    },
    async find(params: FindPaymentDisputesParams = {}, options?: RequestOptions): Promise<PaginatedResponse<PaymentDispute>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<PaymentDispute>>(
        `/v1/stores/${storeId(store_id)}/disputes`, { ...options, params: query },
      );
    },
  };
};
