import type { ApiConfig } from "../index";
import type {
  RequestOptions,
  CreateNetworkParams,
  UpdateNetworkParams,
  GetNetworkParams,
  FindNetworksParams,
  DeleteNetworkParams,
  Network,
} from "../types/api";

export const createNetworkApi = (apiConfig: ApiConfig) => {
  return {
    async create(params: CreateNetworkParams, options?: RequestOptions) {
      return apiConfig.httpClient.post(`/v1/networks`, params, options);
    },

    async get(params: GetNetworkParams, options?: RequestOptions) {
      return apiConfig.httpClient.get(`/v1/networks/${params.id}`, options);
    },

    async find(params?: FindNetworksParams, options?: RequestOptions) {
      const queryParams: Record<string, any> = {};

      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.cursor) queryParams.cursor = params.cursor;
      if (params?.query) queryParams.query = params.query;

      return apiConfig.httpClient.get(`/v1/networks`, {
        ...options,
        params: queryParams,
      });
    },

    async update(params: UpdateNetworkParams, options?: RequestOptions) {
      const { id, ...body } = params;
      return apiConfig.httpClient.put(`/v1/networks/${id}`, body, options);
    },

    async delete(params: DeleteNetworkParams, options?: RequestOptions) {
      return apiConfig.httpClient.delete(
        `/v1/networks/${params.id}`,
        options
      );
    },
  };
};
