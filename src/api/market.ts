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
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/markets`,
        options,
      );
    },

    async get(id: string, options?: RequestOptions): Promise<Market> {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/markets/${id}`,
        options,
      );
    },

    async create(
      params: CreateMarketParams,
      options?: RequestOptions,
    ): Promise<Market> {
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/markets`,
        { ...params, businessId: apiConfig.businessId },
        options,
      );
    },

    async update(
      params: UpdateMarketParams,
      options?: RequestOptions,
    ): Promise<Market> {
      return apiConfig.httpClient.put(
        `/v1/businesses/${apiConfig.businessId}/markets/${params.id}`,
        { ...params, businessId: apiConfig.businessId },
        options,
      );
    },

    async delete(
      params: DeleteMarketParams,
      options?: RequestOptions,
    ): Promise<{ deleted: boolean }> {
      return apiConfig.httpClient.delete(
        `/v1/businesses/${apiConfig.businessId}/markets/${params.id}`,
        options,
      );
    },
  };
};
