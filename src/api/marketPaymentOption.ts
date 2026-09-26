import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  MarketPaymentOption,
  CreateMarketPaymentOptionParams,
  GetMarketPaymentOptionParams,
  LookupMarketPaymentOptionParams,
  FindMarketPaymentOptionsParams,
  RemoveMarketPaymentOptionParams,
} from "../types/marketPaymentOption";

export const createMarketPaymentOptionApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/market-payment-options`;

  return {
    create(
      params: CreateMarketPaymentOptionParams,
      options?: RequestOptions,
    ): Promise<MarketPaymentOption> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<MarketPaymentOption>(basePath(store_id), payload, options);
    },
    get(params: GetMarketPaymentOptionParams, options?: RequestOptions): Promise<MarketPaymentOption> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<MarketPaymentOption>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    lookup(
      params: LookupMarketPaymentOptionParams,
      options?: RequestOptions,
    ): Promise<MarketPaymentOption> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<MarketPaymentOption>(`${basePath(store_id)}/lookup`, {
        ...options,
        params: query,
      });
    },
    find(
      params: FindMarketPaymentOptionsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<MarketPaymentOption>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<MarketPaymentOption>>(basePath(store_id), {
        ...options,
        params: query,
      });
    },
    remove(
      params: RemoveMarketPaymentOptionParams,
      options?: RequestOptions,
    ): Promise<MarketPaymentOption | void> {
      const { store_id, id, expected_updated_at } = params;
      return apiConfig.httpClient.delete<MarketPaymentOption | void>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        { ...options, params: { expected_updated_at } },
      );
    },
  };
};
