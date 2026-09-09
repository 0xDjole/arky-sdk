import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  AssortmentItem,
  CreateAssortmentItemParams,
  UpdateAssortmentItemParams,
  DeleteAssortmentItemParams,
  GetAssortmentItemParams,
  FindAssortmentItemsParams,
} from "../types/assortmentItem";

export const createAssortmentItemApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/assortment-items`;

  return {
    create(
      params: CreateAssortmentItemParams,
      options?: RequestOptions,
    ): Promise<AssortmentItem> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<AssortmentItem>(
        basePath(store_id),
        payload,
        options,
      );
    },

    update(
      params: UpdateAssortmentItemParams,
      options?: RequestOptions,
    ): Promise<AssortmentItem> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<AssortmentItem>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },

    get(
      params: GetAssortmentItemParams,
      options?: RequestOptions,
    ): Promise<AssortmentItem> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<AssortmentItem>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },

    find(
      params: FindAssortmentItemsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<AssortmentItem>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<AssortmentItem>>(
        basePath(store_id),
        { ...options, params: query },
      );
    },

    async delete(
      params: DeleteAssortmentItemParams,
      options?: RequestOptions,
    ): Promise<void> {
      const { store_id, id, expected_updated_at } = params;
      await apiConfig.httpClient.delete<unknown>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        {
          ...options,
          params: { expected_updated_at },
        },
      );
    },
  };
};
