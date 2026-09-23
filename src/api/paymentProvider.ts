import type { ApiConfig } from "../services/clientTypes";
import type {
  ConnectStripePaymentProviderParams,
  CreateLocalPaymentProviderParams,
  CreateMonriPaymentProviderParams,
  OpenStripeDashboardParams,
  ListPaymentProvidersParams,
  GetStoreConfigurationByKeyParams,
  GetPaymentProviderParams,
  GetPaymentProviderByConfigurationParams,
  GetStripeConnectionOperationParams,
  RefreshStripePaymentProviderParams,
  RequestOptions,
} from "../types/api";
import type {
  PaymentProvider,
  PaginatedResponse,
  PaymentProviderConnectResponse,
  StripeConnectionOperation,
} from "../types";

export const createPaymentProviderApi = (apiConfig: ApiConfig) => {
  const storeId = (store_id?: string) => store_id || apiConfig.storeId;

  return {
    async list(
      params?: ListPaymentProvidersParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<PaymentProvider>> {
      const { store_id, ...query } = params ?? {};
      return apiConfig.httpClient.get<PaginatedResponse<PaymentProvider>>(
        `/v1/stores/${storeId(store_id)}/payment-providers`,
        { ...options, params: query },
      );
    },

    async get(params: GetPaymentProviderParams, options?: RequestOptions): Promise<PaymentProvider> {
      return apiConfig.httpClient.get<PaymentProvider>(
        `/v1/stores/${encodeURIComponent(storeId(params.store_id))}/payment-providers/${encodeURIComponent(params.id)}`, options,
      );
    },
    async getByKey(params: GetStoreConfigurationByKeyParams, options?: RequestOptions): Promise<PaymentProvider> {
      return apiConfig.httpClient.get<PaymentProvider>(
        `/v1/stores/${encodeURIComponent(storeId(params.store_id))}/payment-providers/key/${encodeURIComponent(params.key)}`, options,
      );
    },
    async getByConfiguration(params: GetPaymentProviderByConfigurationParams, options?: RequestOptions): Promise<PaymentProvider> {
      return apiConfig.httpClient.get<PaymentProvider>(
        `/v1/stores/${encodeURIComponent(storeId(params.store_id))}/payment-providers/by-configuration/${params.configuration_type}`, options,
      );
    },
    async create(
      params: CreateLocalPaymentProviderParams,
      options?: RequestOptions,
    ): Promise<PaymentProvider> {
      const targetStoreId = storeId(params.store_id);
      const { store_id: _store_id, ...rest } = params;
      return apiConfig.httpClient.post<PaymentProvider>(
        `/v1/stores/${targetStoreId}/payment-providers`,
        { store_id: targetStoreId, ...rest },
        options,
      );
    },

    async createMonri(
      params: CreateMonriPaymentProviderParams,
      options?: RequestOptions,
    ): Promise<PaymentProvider> {
      const targetStoreId = storeId(params.store_id);
      const { store_id: _store_id, ...input } = params;
      return apiConfig.httpClient.post<PaymentProvider>(
        `/v1/stores/${encodeURIComponent(targetStoreId)}/payment-providers/monri`,
        { store_id: targetStoreId, ...input },
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
        `/v1/stores/${encodeURIComponent(targetStoreId)}/payment-providers/stripe/connect`,
        { ...params, store_id: targetStoreId },
        options,
      );
    },

    async getStripeConnection(
      params: GetStripeConnectionOperationParams,
      options?: RequestOptions,
    ): Promise<StripeConnectionOperation> {
      return apiConfig.httpClient.get<StripeConnectionOperation>(
        `/v1/stores/${encodeURIComponent(storeId(params.store_id))}/payment-providers/stripe/connections/${encodeURIComponent(params.operation_id)}`,
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
