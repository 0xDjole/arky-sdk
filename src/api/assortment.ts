import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  Assortment,
  AssortmentUsage,
  CreateAssortmentParams,
  UpdateAssortmentParams,
  DeleteAssortmentParams,
  GetAssortmentParams,
  FindAssortmentsParams,
} from "../types/assortment";

export const createAssortmentApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/assortments`;

  return {
    create(
      params: CreateAssortmentParams,
      options?: RequestOptions,
    ): Promise<Assortment> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<Assortment>(
        basePath(store_id),
        payload,
        options,
      );
    },

    update(
      params: UpdateAssortmentParams,
      options?: RequestOptions,
    ): Promise<Assortment> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<Assortment>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },

    get(
      params: GetAssortmentParams,
      options?: RequestOptions,
    ): Promise<Assortment> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<Assortment>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },

    find(
      params: FindAssortmentsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Assortment>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Assortment>>(
        basePath(store_id),
        { ...options, params: query },
      );
    },

    usage(
      params: GetAssortmentParams,
      options?: RequestOptions,
    ): Promise<AssortmentUsage> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<AssortmentUsage>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/usage`,
        options,
      );
    },

    delete(
      params: DeleteAssortmentParams,
      options?: RequestOptions,
    ): Promise<Assortment> {
      const { store_id, id, expected_updated_at } = params;
      return apiConfig.httpClient.delete<Assortment>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        {
          ...options,
          params: { expected_updated_at },
        },
      );
    },
  };
};
