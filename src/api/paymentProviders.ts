import type { ApiConfig } from "../index";
import type {
  ConnectStripePaymentProviderParams,
  DeletePaymentProviderParams,
  ListPaymentProvidersParams,
  RequestOptions,
} from "../types/api";
import type { PaymentProvider, StripePaymentProviderConnectResponse } from "../types";

export const createPaymentProvidersApi = (apiConfig: ApiConfig) => {
  const storeId = (store_id?: string) => store_id || apiConfig.storeId;

  return {
    async listProviders(
      params?: ListPaymentProvidersParams,
      options?: RequestOptions,
    ): Promise<PaymentProvider[]> {
      return apiConfig.httpClient.get<PaymentProvider[]>(
        `/v1/stores/${storeId(params?.store_id)}/payment-providers`,
        options,
      );
    },

    async connectStripe(
      params: ConnectStripePaymentProviderParams,
      options?: RequestOptions,
    ): Promise<StripePaymentProviderConnectResponse> {
      return apiConfig.httpClient.post<StripePaymentProviderConnectResponse>(
        `/v1/stores/${storeId(params.store_id)}/payment-providers/stripe/connect`,
        params,
        options,
      );
    },

    async deleteProvider(
      params: DeletePaymentProviderParams,
      options?: RequestOptions,
    ): Promise<{ deleted: boolean }> {
      return apiConfig.httpClient.delete<{ deleted: boolean }>(
        `/v1/stores/${storeId(params.store_id)}/payment-providers/${params.id}`,
        options,
      );
    },
  };
};
