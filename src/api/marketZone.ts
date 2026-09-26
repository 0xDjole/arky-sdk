import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  MarketZone,
  CreateMarketZoneParams,
  UpdateMarketZoneParams,
  GetMarketZoneParams,
  LookupMarketZoneParams,
  FindMarketZonesParams,
  DeleteMarketZoneParams,
} from "../types/zone";

export const createMarketZoneApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/market-zones`;

  return {
    create(params: CreateMarketZoneParams, options?: RequestOptions): Promise<MarketZone> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<MarketZone>(basePath(store_id), payload, options);
    },
    update(params: UpdateMarketZoneParams, options?: RequestOptions): Promise<MarketZone> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<MarketZone>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },
    get(params: GetMarketZoneParams, options?: RequestOptions): Promise<MarketZone> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<MarketZone>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    lookup(params:LookupMarketZoneParams, options?:RequestOptions):Promise<MarketZone> {
      const {store_id,...query}=params;
      return apiConfig.httpClient.get<MarketZone>(`${basePath(store_id)}/lookup`,{...options,params:query});
    },
    find(
      params: FindMarketZonesParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<MarketZone>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<MarketZone>>(basePath(store_id), {
        ...options,
        params: query,
      });
    },
    delete(params: DeleteMarketZoneParams, options?: RequestOptions): Promise<MarketZone | void> {
      const { store_id, id, expected_updated_at } = params;
      return apiConfig.httpClient.delete<MarketZone | void>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        { ...options, params: { expected_updated_at } },
      );
    },
  };
};
