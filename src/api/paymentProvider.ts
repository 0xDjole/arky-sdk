import type { ApiConfig } from "../services/clientTypes";
import type {
  ConnectStripePaymentProviderParams,
  DeletePaymentProviderParams,
  GetPaymentProviderConnectionParams,
  OpenStripeDashboardParams,
  ListPaymentProviderConnectionsParams,
  ListPaymentProvidersParams,
  RefreshStripePaymentProviderParams,
  RequestOptions,
} from "../types/api";
import type {
  PaymentProvider,
  PaymentProviderConnection,
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

    async listConnections(
      params?: ListPaymentProviderConnectionsParams,
      options?: RequestOptions,
    ): Promise<PaymentProviderConnection[]> {
      return apiConfig.httpClient.get<PaymentProviderConnection[]>(
        `/v1/stores/${storeId(params?.store_id)}/payment-providers/connections`,
        options,
      );
    },

    async getConnection(
      params: GetPaymentProviderConnectionParams,
      options?: RequestOptions,
    ): Promise<PaymentProviderConnection> {
      return apiConfig.httpClient.get<PaymentProviderConnection>(
        `/v1/stores/${storeId(params.store_id)}/payment-providers/connections/${params.id}`,
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

    async delete(
      params: DeletePaymentProviderParams,
      options?: RequestOptions,
    ): Promise<{ disabled: boolean }> {
      return apiConfig.httpClient.delete<{ disabled: boolean }>(
        `/v1/stores/${storeId(params.store_id)}/payment-providers/${params.id}`,
        options,
      );
    },
  };
};
