import type { ApiConfig } from "../services/clientTypes";
import type {
  CreateMarketParams,
  DeleteMarketParams,
  RequestOptions,
  UpdateMarketParams,
} from "../types/api";
import type { Market, MarketUsage } from "../types";

export const createMarketApi = (apiConfig: ApiConfig) => {
  const basePath = () =>
    `/v1/stores/${encodeURIComponent(apiConfig.storeId)}/markets`;
  return {
    async list(options?: RequestOptions): Promise<Market[]> {
      return apiConfig.httpClient.get<Market[]>(basePath(), options);
    },

    async get(id: string, options?: RequestOptions): Promise<Market> {
      return apiConfig.httpClient.get<Market>(
        `${basePath()}/${encodeURIComponent(id)}`,
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
      return apiConfig.httpClient.post<Market>(basePath(), params, options);
    },

    async update(
      params: UpdateMarketParams,
      options?: RequestOptions,
    ): Promise<Market> {
      const { id, ...payload } = params;
      return apiConfig.httpClient.put<Market>(
        `${basePath()}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },

    async delete(
      params: DeleteMarketParams,
      options?: RequestOptions,
    ): Promise<Market> {
      const { id, ...query } = params;
      return apiConfig.httpClient.delete<Market>(
        `${basePath()}/${encodeURIComponent(id)}`,
        {
          ...options,
          params: query,
        },
      );
    },
  };
};
