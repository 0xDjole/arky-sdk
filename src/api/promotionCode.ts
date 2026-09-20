import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  PromotionCode,
  CreatePromotionCodeParams,
  UpdatePromotionCodeParams,
  GetPromotionCodeParams,
  GetPromotionCodeByCodeParams,
  FindPromotionCodesParams,
  DeletePromotionCodeParams,
} from "../types/promotion";

export const createPromotionCodeApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/promotion-codes`;

  return {
    create(params: CreatePromotionCodeParams, options?: RequestOptions): Promise<PromotionCode> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<PromotionCode>(basePath(store_id), payload, options);
    },
    update(params: UpdatePromotionCodeParams, options?: RequestOptions): Promise<PromotionCode> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<PromotionCode>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },
    get(params: GetPromotionCodeParams, options?: RequestOptions): Promise<PromotionCode> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<PromotionCode>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    getByCode(params: GetPromotionCodeByCodeParams, options?: RequestOptions): Promise<PromotionCode> {
      const { store_id, code } = params;
      return apiConfig.httpClient.get<PromotionCode>(
        `${basePath(store_id)}/by-code/${encodeURIComponent(code)}`,
        options,
      );
    },
    find(
      params: FindPromotionCodesParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<PromotionCode>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<PromotionCode>>(basePath(store_id), {
        ...options,
        params: query,
      });
    },
    delete(params: DeletePromotionCodeParams, options?: RequestOptions): Promise<PromotionCode | undefined> {
      const { store_id, id, expected_updated_at } = params;
      return apiConfig.httpClient.delete<PromotionCode | undefined>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        { ...options, params: { expected_updated_at } },
      );
    },
  };
};
