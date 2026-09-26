import type { ApiConfig } from "../services/clientTypes";
import type {
  ConnectStripePaymentOptionParams,
  CreateLocalPaymentOptionParams,
  CreateMonriPaymentOptionParams,
  UpdatePaymentOptionParams,
  OpenStripeDashboardParams,
  ListPaymentOptionsParams,
  GetStoreConfigurationByKeyParams,
  GetPaymentOptionParams,
  GetPaymentOptionByTypeParams,
  GetStripeConnectionOperationParams,
  RefreshStripePaymentOptionParams,
  RequestOptions,
} from "../types/api";
import type {
  PaymentOption,
  PaginatedResponse,
  PaymentOptionConnectResponse,
  StripeConnectionOperation,
} from "../types";

export const createPaymentOptionApi = (apiConfig: ApiConfig) => {
  const storeId = (store_id?: string) => store_id || apiConfig.storeId;

  return {
    async list(
      params?: ListPaymentOptionsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<PaymentOption>> {
      const { store_id, ...query } = params ?? {};
      return apiConfig.httpClient.get<PaginatedResponse<PaymentOption>>(
        `/v1/stores/${storeId(store_id)}/payment-options`,
        { ...options, params: query },
      );
    },

    async get(params: GetPaymentOptionParams, options?: RequestOptions): Promise<PaymentOption> {
      return apiConfig.httpClient.get<PaymentOption>(
        `/v1/stores/${encodeURIComponent(storeId(params.store_id))}/payment-options/${encodeURIComponent(params.id)}`, options,
      );
    },
    async getByKey(params: GetStoreConfigurationByKeyParams, options?: RequestOptions): Promise<PaymentOption> {
      return apiConfig.httpClient.get<PaymentOption>(
        `/v1/stores/${encodeURIComponent(storeId(params.store_id))}/payment-options/key/${encodeURIComponent(params.key)}`, options,
      );
    },
    async getByType(params: GetPaymentOptionByTypeParams, options?: RequestOptions): Promise<PaymentOption> {
      return apiConfig.httpClient.get<PaymentOption>(
        `/v1/stores/${encodeURIComponent(storeId(params.store_id))}/payment-options/by-type/${params.type_name}`, options,
      );
    },
    async create(
      params: CreateLocalPaymentOptionParams,
      options?: RequestOptions,
    ): Promise<PaymentOption> {
      const targetStoreId = storeId(params.store_id);
      const { store_id: _store_id, ...rest } = params;
      return apiConfig.httpClient.post<PaymentOption>(
        `/v1/stores/${targetStoreId}/payment-options`,
        { store_id: targetStoreId, ...rest },
        options,
      );
    },

    async createMonri(
      params: CreateMonriPaymentOptionParams,
      options?: RequestOptions,
    ): Promise<PaymentOption> {
      const targetStoreId = storeId(params.store_id);
      const { store_id: _store_id, ...input } = params;
      return apiConfig.httpClient.post<PaymentOption>(
        `/v1/stores/${encodeURIComponent(targetStoreId)}/payment-options/monri`,
        { store_id: targetStoreId, ...input },
        options,
      );
    },

    async update(params: UpdatePaymentOptionParams, options?: RequestOptions): Promise<PaymentOption> {
      const targetStoreId = storeId(params.store_id);
      const { store_id: _store_id, ...input } = params;
      return apiConfig.httpClient.put<PaymentOption>(
        `/v1/stores/${encodeURIComponent(targetStoreId)}/payment-options/${encodeURIComponent(params.id)}`,
        { store_id: targetStoreId, ...input }, options,
      );
    },

    async refreshStripe(
      params?: RefreshStripePaymentOptionParams,
      options?: RequestOptions,
    ): Promise<PaymentOption> {
      const targetStoreId = storeId(params?.store_id);
      return apiConfig.httpClient.post<PaymentOption>(
        `/v1/stores/${targetStoreId}/payment-options/stripe/refresh`,
        { store_id: targetStoreId },
        options,
      );
    },

    async connectStripe(
      params: ConnectStripePaymentOptionParams,
      options?: RequestOptions,
    ): Promise<PaymentOptionConnectResponse> {
      const targetStoreId = storeId(params.store_id);
      return apiConfig.httpClient.post<PaymentOptionConnectResponse>(
        `/v1/stores/${encodeURIComponent(targetStoreId)}/payment-options/stripe/connect`,
        { ...params, store_id: targetStoreId },
        options,
      );
    },

    async getStripeConnection(
      params: GetStripeConnectionOperationParams,
      options?: RequestOptions,
    ): Promise<StripeConnectionOperation> {
      return apiConfig.httpClient.get<StripeConnectionOperation>(
        `/v1/stores/${encodeURIComponent(storeId(params.store_id))}/payment-options/stripe/connections/${encodeURIComponent(params.operation_id)}`,
        options,
      );
    },

    async openDashboard(
      params: OpenStripeDashboardParams,
      options?: RequestOptions,
    ): Promise<{ dashboard_url: string }> {
      return apiConfig.httpClient.post<{ dashboard_url: string }>(
        `/v1/stores/${storeId(params.store_id)}/payment-options/stripe/${params.id}/dashboard`,
        {},
        options,
      );
    },

  };
};
