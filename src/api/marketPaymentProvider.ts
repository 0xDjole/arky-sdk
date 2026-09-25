import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  MarketPaymentProvider,
  CreateMarketPaymentProviderParams,
  GetMarketPaymentProviderParams,
  GetMarketPaymentProviderByBindingParams,
  FindMarketPaymentProvidersParams,
  RemoveMarketPaymentProviderParams,
} from "../types/marketPaymentProvider";

export const createMarketPaymentProviderApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/market-payment-providers`;

  return {
    create(
      params: CreateMarketPaymentProviderParams,
      options?: RequestOptions,
    ): Promise<MarketPaymentProvider> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<MarketPaymentProvider>(basePath(store_id), payload, options);
    },
    get(params: GetMarketPaymentProviderParams, options?: RequestOptions): Promise<MarketPaymentProvider> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<MarketPaymentProvider>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    getByBinding(
      params: GetMarketPaymentProviderByBindingParams,
      options?: RequestOptions,
    ): Promise<MarketPaymentProvider> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<MarketPaymentProvider>(`${basePath(store_id)}/by-binding`, {
        ...options,
        params: query,
      });
    },
    find(
      params: FindMarketPaymentProvidersParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<MarketPaymentProvider>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<MarketPaymentProvider>>(basePath(store_id), {
        ...options,
        params: query,
      });
    },
    remove(
      params: RemoveMarketPaymentProviderParams,
      options?: RequestOptions,
    ): Promise<MarketPaymentProvider | void> {
      const { store_id, id, expected_updated_at } = params;
      return apiConfig.httpClient.delete<MarketPaymentProvider | void>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        { ...options, params: { expected_updated_at } },
      );
    },
  };
};
