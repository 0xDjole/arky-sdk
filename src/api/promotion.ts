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
import { segment, tenantPath, tenantRecordPath } from "./paths";

export const createPromotionApi = (apiConfig: ApiConfig) => ({
  find(params: FindPromotionsParams, options?: RequestOptions): Promise<PaginatedResponse<Promotion>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<Promotion>>(tenantPath(tenant_id, "promotions"), {
      ...options,
      params: query,
    });
  },

  get(params: GetPromotionParams, options?: RequestOptions): Promise<Promotion> {
    return apiConfig.httpClient.get<Promotion>(tenantRecordPath(params.tenant_id, "promotions", params.id), options);
  },

  getByKey(params: GetPromotionByKeyParams, options?: RequestOptions): Promise<Promotion> {
    return apiConfig.httpClient.get<Promotion>(
      tenantPath(params.tenant_id, `promotions/by-key/${segment(params.key)}`),
      options,
    );
  },

  create(params: CreatePromotionParams, options?: RequestOptions): Promise<Promotion> {
    requireId(params.id, "promotion");
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<Promotion>(tenantPath(tenant_id, "promotions"), body, options);
  },

  update(params: UpdatePromotionParams, options?: RequestOptions): Promise<Promotion> {
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.put<Promotion>(tenantRecordPath(tenant_id, "promotions", id), body, options);
  },

  delete(params: DeletePromotionParams, options?: RequestOptions): Promise<Promotion> {
    return apiConfig.httpClient.delete<Promotion>(
      tenantRecordPath(params.tenant_id, "promotions", params.id),
      { ...options, params: { expected_updated_at: params.expected_updated_at } },
    );
  },
});

export const createPromotionCodeApi = (apiConfig: ApiConfig) => ({
  find(params: FindPromotionCodesParams, options?: RequestOptions): Promise<PaginatedResponse<PromotionCode>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<PromotionCode>>(tenantPath(tenant_id, "promotion-codes"), {
      ...options,
      params: query,
    });
  },

  get(params: GetPromotionCodeParams, options?: RequestOptions): Promise<PromotionCode> {
    return apiConfig.httpClient.get<PromotionCode>(tenantRecordPath(params.tenant_id, "promotion-codes", params.id), options);
  },

  getByCode(params: GetPromotionCodeByCodeParams, options?: RequestOptions): Promise<PromotionCode> {
    return apiConfig.httpClient.get<PromotionCode>(
      tenantPath(params.tenant_id, `promotion-codes/by-code/${segment(params.code)}`),
      options,
    );
  },

  create(params: CreatePromotionCodeParams, options?: RequestOptions): Promise<PromotionCode> {
    requireId(params.id, "promotion code");
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<PromotionCode>(tenantPath(tenant_id, "promotion-codes"), body, options);
  },

  update(params: UpdatePromotionCodeParams, options?: RequestOptions): Promise<PromotionCode> {
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.put<PromotionCode>(tenantRecordPath(tenant_id, "promotion-codes", id), body, options);
  },

  delete(params: DeletePromotionCodeParams, options?: RequestOptions): Promise<PromotionCode> {
    return apiConfig.httpClient.delete<PromotionCode>(
      tenantRecordPath(params.tenant_id, "promotion-codes", params.id),
      { ...options, params: { expected_updated_at: params.expected_updated_at } },
    );
  },
});
