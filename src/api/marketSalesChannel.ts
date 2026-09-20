import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  MarketSalesChannel,
  CreateMarketSalesChannelParams,
  GetMarketSalesChannelParams,
  GetMarketSalesChannelByBindingParams,
  FindMarketSalesChannelsParams,
  RemoveMarketSalesChannelParams,
} from "../types/marketSalesChannel";

export const createMarketSalesChannelApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/market-sales-channels`;

  return {
    create(
      params: CreateMarketSalesChannelParams,
      options?: RequestOptions,
    ): Promise<MarketSalesChannel> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<MarketSalesChannel>(basePath(store_id), payload, options);
    },
    get(params: GetMarketSalesChannelParams, options?: RequestOptions): Promise<MarketSalesChannel> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<MarketSalesChannel>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    getByBinding(params:GetMarketSalesChannelByBindingParams, options?:RequestOptions):Promise<MarketSalesChannel> {
      const {store_id,...query}=params;
      return apiConfig.httpClient.get<MarketSalesChannel>(`${basePath(store_id)}/by-binding`,{...options,params:query});
    },
    find(
      params: FindMarketSalesChannelsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<MarketSalesChannel>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<MarketSalesChannel>>(basePath(store_id), {
        ...options,
        params: query,
      });
    },
    remove(
      params: RemoveMarketSalesChannelParams,
      options?: RequestOptions,
    ): Promise<MarketSalesChannel | void> {
      const { store_id, id, expected_updated_at } = params;
      return apiConfig.httpClient.delete<MarketSalesChannel | void>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        { ...options, params: { expected_updated_at } },
      );
    },
  };
};
