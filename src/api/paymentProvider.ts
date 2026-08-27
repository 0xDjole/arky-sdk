import type { ApiConfig } from "../services/clientTypes";
import type {
  ConnectStripePaymentProviderParams,
  OpenStripeDashboardParams,
  ListPaymentProvidersParams,
  RefreshStripePaymentProviderParams,
  RequestOptions,
} from "../types/api";
import type {
  PaymentProvider,
  PaymentProviderConnectResponse,
} from "../types";

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

    async refreshStripe(
      params?: RefreshStripePaymentProviderParams,
      options?: RequestOptions,
    ): Promise<PaymentProvider> {
      const targetStoreId = storeId(params?.store_id);
      return apiConfig.httpClient.post<PaymentProvider>(
        `/v1/stores/${targetStoreId}/payment-providers/stripe/refresh`,
        { store_id: targetStoreId },
        options,
      );
    },

    async connectStripe(
      params: ConnectStripePaymentProviderParams,
      options?: RequestOptions,
    ): Promise<PaymentProviderConnectResponse> {
      const targetStoreId = storeId(params.store_id);
      return apiConfig.httpClient.post<PaymentProviderConnectResponse>(
        `/v1/stores/${targetStoreId}/payment-providers/stripe/connect`,
        { ...params, store_id: targetStoreId },
        options,
      );
    },

    async openDashboard(
      params: OpenStripeDashboardParams,
      options?: RequestOptions,
    ): Promise<{ dashboard_url: string }> {
      return apiConfig.httpClient.post<{ dashboard_url: string }>(
        `/v1/stores/${storeId(params.store_id)}/payment-providers/stripe/${params.id}/dashboard`,
        {},
        options,
      );
    },

  };
};
