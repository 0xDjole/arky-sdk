import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  PaymentTerms,
  CreatePaymentTermsParams,
  UpdatePaymentTermsParams,
  GetPaymentTermsParams,
  FindPaymentTermsParams,
  DeletePaymentTermsParams,
} from "../types/paymentTerms";

export const createPaymentTermsApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/payment-terms`;

  return {
    create(params: CreatePaymentTermsParams, options?: RequestOptions): Promise<PaymentTerms> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<PaymentTerms>(basePath(store_id), payload, options);
    },
    update(params: UpdatePaymentTermsParams, options?: RequestOptions): Promise<PaymentTerms> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<PaymentTerms>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },
    get(params: GetPaymentTermsParams, options?: RequestOptions): Promise<PaymentTerms> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<PaymentTerms>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    find(
      params: FindPaymentTermsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<PaymentTerms>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<PaymentTerms>>(basePath(store_id), {
        ...options,
        params: query,
      });
    },
    delete(params: DeletePaymentTermsParams, options?: RequestOptions): Promise<PaymentTerms> {
      const { store_id, id, expected_updated_at } = params;
      return apiConfig.httpClient.delete<PaymentTerms>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        { ...options, params: { expected_updated_at } },
      );
    },
  };
};
