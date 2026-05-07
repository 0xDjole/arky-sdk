import type { ApiConfig } from "../index";
import type {
  CreateMarketParams,
  DeleteMarketParams,
  RequestOptions,
  UpdateMarketParams,
} from "../types/api";
import type { Market } from "../types";


export const createMarketApi = (apiConfig: ApiConfig) => {
  return {
    async list(options?: RequestOptions): Promise<Market[]> {
      return apiConfig.httpClient.get<Market[]>(
        `/v1/stores/${apiConfig.storeId}/markets`,
        options,
      );
    },

    async get(id: string, options?: RequestOptions): Promise<Market> {
      return apiConfig.httpClient.get<Market>(
        `/v1/stores/${apiConfig.storeId}/markets/${id}`,
        options,
      );
    },

    async create(
      params: CreateMarketParams,
      options?: RequestOptions,
    ): Promise<Market> {
      return apiConfig.httpClient.post<Market>(
        `/v1/stores/${apiConfig.storeId}/markets`,
        { ...params, store_id: apiConfig.storeId },
        options,
      );
    },

    async update(
      params: UpdateMarketParams,
      options?: RequestOptions,
    ): Promise<Market> {
      return apiConfig.httpClient.put<Market>(
        `/v1/stores/${apiConfig.storeId}/markets/${params.id}`,
        { ...params, store_id: apiConfig.storeId },
        options,
      );
    },

    async delete(
      params: DeleteMarketParams,
      options?: RequestOptions,
    ): Promise<{ deleted: boolean }> {
      return apiConfig.httpClient.delete<{ deleted: boolean }>(
        `/v1/stores/${apiConfig.storeId}/markets/${params.id}`,
        options,
      );
    },
  };
};
