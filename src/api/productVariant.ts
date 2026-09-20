import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse, ProductVariant } from "../types";
import type {
  RequestOptions,
  CreateProductVariantParams,
  UpdateProductVariantParams,
  GetProductVariantParams,
  FindProductVariantsParams,
  DeleteProductVariantParams,
} from "../types/api";

export const createProductVariantApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/product-variants`;

  return {
    create(
      params: CreateProductVariantParams,
      options?: RequestOptions,
    ): Promise<ProductVariant> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<ProductVariant>(
        basePath(store_id),
        payload,
        options,
      );
    },
    update(
      params: UpdateProductVariantParams,
      options?: RequestOptions,
    ): Promise<ProductVariant> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.put<ProductVariant>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },
    get(
      params: GetProductVariantParams,
      options?: RequestOptions,
    ): Promise<ProductVariant> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<ProductVariant>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    find(
      params: FindProductVariantsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<ProductVariant>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<ProductVariant>>(
        basePath(store_id),
        { ...options, params: query },
      );
    },
    delete(
      params: DeleteProductVariantParams,
      options?: RequestOptions,
    ): Promise<ProductVariant | void> {
      const { store_id, id, expected_updated_at } = params;
      return apiConfig.httpClient.delete<ProductVariant | void>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        { ...options, params: { expected_updated_at } },
      );
    },
  };
};
