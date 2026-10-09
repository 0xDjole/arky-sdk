import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  CreatePromotionCodeParams,
  CreatePromotionParams,
  DeletePromotionCodeParams,
  DeletePromotionParams,
  FindPromotionCodesParams,
  FindPromotionsParams,
  GetPromotionByKeyParams,
  GetPromotionCodeByCodeParams,
  GetPromotionCodeParams,
  GetPromotionParams,
  Promotion,
  PromotionCode,
  UpdatePromotionCodeParams,
  UpdatePromotionParams,
} from "../types/promotion";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";

export const createPromotionApi = (apiConfig: ApiConfig) => ({
  find(params: FindPromotionsParams, options?: RequestOptions): Promise<PaginatedResponse<Promotion>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<Promotion>>(storePath(store_id, "promotions"), {
      ...options,
      params: query,
    });
  },

  get(params: GetPromotionParams, options?: RequestOptions): Promise<Promotion> {
    return apiConfig.httpClient.get<Promotion>(storeRecordPath(params.store_id, "promotions", params.id), options);
  },

  getByKey(params: GetPromotionByKeyParams, options?: RequestOptions): Promise<Promotion> {
    return apiConfig.httpClient.get<Promotion>(
      storePath(params.store_id, `promotions/by-key/${segment(params.key)}`),
      options,
    );
  },

  create(params: CreatePromotionParams, options?: RequestOptions): Promise<Promotion> {
    requireId(params.id, "promotion");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<Promotion>(storePath(store_id, "promotions"), body, options);
  },

  update(params: UpdatePromotionParams, options?: RequestOptions): Promise<Promotion> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<Promotion>(storeRecordPath(store_id, "promotions", id), body, options);
  },

  delete(params: DeletePromotionParams, options?: RequestOptions): Promise<Promotion | undefined> {
    return apiConfig.httpClient.delete<Promotion | undefined>(
      storeRecordPath(params.store_id, "promotions", params.id),
      { ...options, params: { expected_updated_at: params.expected_updated_at } },
    );
  },
});

export const createPromotionCodeApi = (apiConfig: ApiConfig) => ({
  find(params: FindPromotionCodesParams, options?: RequestOptions): Promise<PaginatedResponse<PromotionCode>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<PromotionCode>>(storePath(store_id, "promotion-codes"), {
      ...options,
      params: query,
    });
  },

  get(params: GetPromotionCodeParams, options?: RequestOptions): Promise<PromotionCode> {
    return apiConfig.httpClient.get<PromotionCode>(storeRecordPath(params.store_id, "promotion-codes", params.id), options);
  },

  getByCode(params: GetPromotionCodeByCodeParams, options?: RequestOptions): Promise<PromotionCode> {
    return apiConfig.httpClient.get<PromotionCode>(
      storePath(params.store_id, `promotion-codes/by-code/${segment(params.code)}`),
      options,
    );
  },

  create(params: CreatePromotionCodeParams, options?: RequestOptions): Promise<PromotionCode> {
    requireId(params.id, "promotion code");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<PromotionCode>(storePath(store_id, "promotion-codes"), body, options);
  },

  update(params: UpdatePromotionCodeParams, options?: RequestOptions): Promise<PromotionCode> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<PromotionCode>(storeRecordPath(store_id, "promotion-codes", id), body, options);
  },

  delete(params: DeletePromotionCodeParams, options?: RequestOptions): Promise<PromotionCode | undefined> {
    return apiConfig.httpClient.delete<PromotionCode | undefined>(
      storeRecordPath(params.store_id, "promotion-codes", params.id),
      { ...options, params: { expected_updated_at: params.expected_updated_at } },
    );
  },
});
