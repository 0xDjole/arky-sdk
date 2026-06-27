import type { ApiConfig } from "../index";
import type {
  ConnectStripePaymentProviderParams,
  DeletePaymentProviderParams,
  ListPaymentProvidersParams,
  RefreshPaymentProvidersParams,
  RequestOptions,
} from "../types/api";
import type { PaymentProvider, StripePaymentProviderConnectResponse } from "../types";

export const createPaymentProviderApi = (apiConfig: ApiConfig) => {
  const storeId = (store_id?: string) => store_id || apiConfig.storeId;

  return {
    async list(
      params?: ListPaymentProvidersParams,
      options?: RequestOptions,
    ): Promise<PaymentProvider[]> {
      return apiConfig.httpClient.get<PaymentProvider[]>(
        `/v1/stores/${storeId(params?.store_id)}/payment-providers`,
        options,
      );
    },

    async refresh(
      params?: RefreshPaymentProvidersParams,
      options?: RequestOptions,
    ): Promise<PaymentProvider[]> {
      const targetStoreId = storeId(params?.store_id);
      return apiConfig.httpClient.post<PaymentProvider[]>(
        `/v1/stores/${targetStoreId}/payment-providers/refresh`,
        { store_id: targetStoreId },
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

    async delete(
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
