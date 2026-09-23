import type { ApiConfig } from "../services/clientTypes";
import type {
  CreateMarketParams,
  FindMarketsParams,
  GetStoreConfigurationByKeyParams,
  GetStoreConfigurationParams,
  DeleteMarketParams,
  RequestOptions,
  UpdateMarketParams,
} from "../types/api";
import type { Market, MarketUsage, PaginatedResponse } from "../types";

export const createMarketApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId = apiConfig.storeId) =>
    `/v1/stores/${encodeURIComponent(storeId)}/markets`;
  return {
    async list(params: FindMarketsParams = {}, options?: RequestOptions): Promise<PaginatedResponse<Market>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Market>>(basePath(store_id), { ...options, params: query });
    },

    async getByKey(params: GetStoreConfigurationByKeyParams, options?: RequestOptions): Promise<Market> {
      return apiConfig.httpClient.get<Market>(`${basePath(params.store_id)}/by-key/${encodeURIComponent(params.key)}`, options);
    },
    async get(params: GetStoreConfigurationParams, options?: RequestOptions): Promise<Market> {
      return apiConfig.httpClient.get<Market>(
        `${basePath(params.store_id)}/${encodeURIComponent(params.id)}`,
        options,
      );
    },

    async usage(id: string, options?: RequestOptions): Promise<MarketUsage> {
      return apiConfig.httpClient.get<MarketUsage>(
        `${basePath()}/${encodeURIComponent(id)}/usage`,
        options,
      );
    },

    async create(
      params: CreateMarketParams,
      options?: RequestOptions,
    ): Promise<Market> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<Market>(basePath(store_id), payload, options);
    },

    async update(
      params: UpdateMarketParams,
      options?: RequestOptions,
    ): Promise<Market> {
      const { id, store_id, ...payload } = params;
      return apiConfig.httpClient.put<Market>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },

    async delete(
      params: DeleteMarketParams,
      options?: RequestOptions,
    ): Promise<Market> {
      const { id, store_id, ...query } = params;
      return apiConfig.httpClient.delete<Market>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        {
          ...options,
          params: query,
        },
      );
    },
  };
};
