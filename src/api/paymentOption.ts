import { requireRequestId } from "../utils/requestId";
import { requireStoreId } from "../utils/storeTarget";
import type { ApiConfig } from "../services/clientTypes";
import type {
  ConfigureStripePaymentOptionParams,
  CancelStripeConfigurationParams,
  GetStripeConfigurationChangeParams,
  CreateLocalPaymentOptionParams,
  CreateMonriPaymentOptionParams,
  UpdatePaymentOptionParams,
  ListPaymentOptionsParams,
  GetStoreConfigurationByKeyParams,
  GetPaymentOptionParams,
  RefreshStripePaymentOptionParams,
  RequestOptions,
} from "../types/api";
import type {
  StripeConfigurationChange,
  StripeConfigurationResolution,
  StripeMerchantSetup,
  PaymentOption,
  PaginatedResponse,
} from "../types";

export const createPaymentOptionApi = (apiConfig: ApiConfig) => {
  const storeId = (store_id: string) => requireStoreId(store_id);

  return {
    async list(
      params: ListPaymentOptionsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<PaymentOption>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<PaymentOption>>(
        `/v1/stores/${requireStoreId(storeId(store_id))}/payment-options`,
        { ...options, params: query },
      );
    },

    async get(params: GetPaymentOptionParams, options?: RequestOptions): Promise<PaymentOption> {
      return apiConfig.httpClient.get<PaymentOption>(
        `/v1/stores/${requireStoreId(encodeURIComponent(storeId(params.store_id)))}/payment-options/${encodeURIComponent(params.id)}`, options,
      );
    },
    async getByKey(params: GetStoreConfigurationByKeyParams, options?: RequestOptions): Promise<PaymentOption> {
      return apiConfig.httpClient.get<PaymentOption>(
        `/v1/stores/${requireStoreId(encodeURIComponent(storeId(params.store_id)))}/payment-options/key/${encodeURIComponent(params.key)}`, options,
      );
    },
    async create(
      params: CreateLocalPaymentOptionParams,
      options?: RequestOptions,
    ): Promise<PaymentOption> {
      const targetStoreId = storeId(params.store_id);
      const { store_id: _store_id, ...rest } = params;
      return apiConfig.httpClient.post<PaymentOption>(
        `/v1/stores/${requireStoreId(targetStoreId)}/payment-options`,
        rest,
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
        `/v1/stores/${requireStoreId(targetStoreId)}/payment-options/monri`,
        input,
        options,
      );
    },

    async update(params: UpdatePaymentOptionParams, options?: RequestOptions): Promise<PaymentOption> {
      const targetStoreId = storeId(params.store_id);
      const { store_id: _store_id, id, ...input } = params;
      return apiConfig.httpClient.put<PaymentOption>(
        `/v1/stores/${requireStoreId(targetStoreId)}/payment-options/${encodeURIComponent(params.id)}`,
        input, options,
      );
    },

    async refreshStripe(
      params: RefreshStripePaymentOptionParams,
      options?: RequestOptions,
    ): Promise<PaymentOption> {
      const targetStoreId = storeId(params.store_id);
      return apiConfig.httpClient.post<PaymentOption>(
        `/v1/stores/${requireStoreId(targetStoreId)}/payment-options/stripe/${encodeURIComponent(params.id)}/refresh`,
        undefined,
        options,
      );
    },

    async stripeSetup(
      params: GetPaymentOptionParams,
      options?: RequestOptions,
    ): Promise<StripeMerchantSetup> {
      return apiConfig.httpClient.get<StripeMerchantSetup>(
        `/v1/stores/${storeId(params.store_id)}/payment-options/stripe/${encodeURIComponent(params.id)}/setup`,
        options,
      );
    },

    async configureStripe(
      params: ConfigureStripePaymentOptionParams,
      options?: RequestOptions,
    ): Promise<StripeConfigurationChange> {
      requireRequestId(params.request_id);
      const { store_id, id, ...input } = params;
      return apiConfig.httpClient.post<StripeConfigurationChange>(
        `/v1/stores/${storeId(store_id)}/payment-options/stripe/${encodeURIComponent(id)}/configuration`,
        input,
        options,
      );
    },

    async cancelStripeConfiguration(
      params: CancelStripeConfigurationParams,
      options?: RequestOptions,
    ): Promise<StripeConfigurationResolution> {
      requireRequestId(params.request_id);
      return apiConfig.httpClient.post<StripeConfigurationResolution>(
        `/v1/stores/${storeId(params.store_id)}/payment-options/stripe/${encodeURIComponent(params.id)}/configuration/requests/${encodeURIComponent(params.request_id)}/cancel`,
        { expected_updated_at: params.expected_updated_at },
        options,
      );
    },

    async getStripeConfigurationChange(
      params: GetStripeConfigurationChangeParams,
      options?: RequestOptions,
    ): Promise<StripeConfigurationChange> {
      requireRequestId(params.request_id);
      return apiConfig.httpClient.get<StripeConfigurationChange>(
        `/v1/stores/${storeId(params.store_id)}/payment-options/stripe/${encodeURIComponent(params.id)}/configuration/requests/${encodeURIComponent(params.request_id)}`,
        options,
      );
    },
  };
};
