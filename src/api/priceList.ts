import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  PriceList,
  PriceListUsage,
  CreatePriceListParams,
  UpdatePriceListParams,
  GetPriceListParams,
  DeletePriceListParams,
  FindPriceListsParams,
} from "../types/priceList";

export const createPriceListApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/price-lists`;

  return {
    usage(
      params: GetPriceListParams,
      options?: RequestOptions,
    ): Promise<PriceListUsage> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<PriceListUsage>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/usage`,
        options,
      );
    },
    create(
      params: CreatePriceListParams,
      options?: RequestOptions,
    ): Promise<PriceList> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<PriceList>(
        basePath(store_id),
        payload,
        options,
      );
    },
    update(
      params: UpdatePriceListParams,
      options?: RequestOptions,
    ): Promise<PriceList> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<PriceList>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },
    get(
      params: GetPriceListParams,
      options?: RequestOptions,
    ): Promise<PriceList> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<PriceList>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    find(
      params: FindPriceListsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<PriceList>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<PriceList>>(
        basePath(store_id),
        { ...options, params: query },
      );
    },
    delete(
      params: DeletePriceListParams,
      options?: RequestOptions,
    ): Promise<PriceList> {
      const { store_id, id, expected_updated_at } = params;
      return apiConfig.httpClient.delete<PriceList>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        { ...options, params: { expected_updated_at } },
      );
    },
  };
};
