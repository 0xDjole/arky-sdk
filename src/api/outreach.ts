import type { ApiConfig } from "../services/clientTypes";
import type {
  RequestOptions,
  CreateSuppressionParams,
  UpdateSuppressionParams,
  FindSuppressionsParams,
  GetSuppressionParams,
} from "../types/api";
import type { PaginatedResponse, Suppression } from "../types";

const storeId = (configured: string | undefined, explicit?: string) =>
  explicit || configured;

export const createOutreachApi = (apiConfig: ApiConfig) => ({
  suppression: {
    async create(
      params: CreateSuppressionParams,
      options?: RequestOptions,
    ): Promise<Suppression> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<Suppression>(
        `/v1/stores/${storeId(apiConfig.storeId, store_id)}/suppressions`,
        payload,
        options,
      );
    },

    async update(
      params: UpdateSuppressionParams,
      options?: RequestOptions,
    ): Promise<Suppression> {
      const { id, store_id, ...payload } = params;
      return apiConfig.httpClient.put<Suppression>(
        `/v1/stores/${storeId(apiConfig.storeId, store_id)}/suppressions/${id}`,
        payload,
        options,
      );
    },

    async get(
      params: GetSuppressionParams,
      options?: RequestOptions,
    ): Promise<Suppression> {
      return apiConfig.httpClient.get<Suppression>(
        `/v1/stores/${storeId(apiConfig.storeId, params.store_id)}/suppressions/${params.id}`,
        options,
      );
    },

    async find(
      params?: FindSuppressionsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Suppression>> {
      const { store_id, ...query } = params || {};
      return apiConfig.httpClient.get<PaginatedResponse<Suppression>>(
        `/v1/stores/${storeId(apiConfig.storeId, store_id)}/suppressions`,
        { ...options, params: query },
      );
    },
  },
});
