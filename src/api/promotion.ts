import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  Promotion,
  CreatePromotionParams,
  UpdatePromotionParams,
  GetPromotionParams,
  GetPromotionByKeyParams,
  FindPromotionsParams,
  DeletePromotionParams,
} from "../types/promotion";

export const createPromotionApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/promotions`;

  return {
    create(params: CreatePromotionParams, options?: RequestOptions): Promise<Promotion> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<Promotion>(basePath(store_id), payload, options);
    },
    update(params: UpdatePromotionParams, options?: RequestOptions): Promise<Promotion> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<Promotion>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },
    get(params: GetPromotionParams, options?: RequestOptions): Promise<Promotion> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<Promotion>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    getByKey(params: GetPromotionByKeyParams, options?: RequestOptions): Promise<Promotion> {
      const { store_id, key } = params;
      return apiConfig.httpClient.get<Promotion>(
        `${basePath(store_id)}/by-key/${encodeURIComponent(key)}`,
        options,
      );
    },
    find(
      params: FindPromotionsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Promotion>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Promotion>>(basePath(store_id), {
        ...options,
        params: query,
      });
    },
    delete(params: DeletePromotionParams, options?: RequestOptions): Promise<Promotion | undefined> {
      const { store_id, id, expected_updated_at } = params;
      return apiConfig.httpClient.delete<Promotion | undefined>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        { ...options, params: { expected_updated_at } },
      );
    },
  };
};
