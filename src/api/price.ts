import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  Price,
  CreatePriceParams,
  UpdatePriceParams,
  GetPriceParams,
  DeletePriceParams,
  FindPricesParams,
} from "../types/price";

export const createPriceApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/prices`;

  return {
    create(
      params: CreatePriceParams,
      options?: RequestOptions,
    ): Promise<Price> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<Price>(
        basePath(store_id),
        payload,
        options,
      );
    },
    update(
      params: UpdatePriceParams,
      options?: RequestOptions,
    ): Promise<Price> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<Price>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },
    get(params: GetPriceParams, options?: RequestOptions): Promise<Price> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<Price>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    find(
      params: FindPricesParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Price>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Price>>(
        basePath(store_id),
        { ...options, params: query },
      );
    },
    delete(
      params: DeletePriceParams,
      options?: RequestOptions,
    ): Promise<Price> {
      const { store_id, id, expected_updated_at } = params;
      return apiConfig.httpClient.delete<Price>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        { ...options, params: { expected_updated_at } },
      );
    },
  };
};
