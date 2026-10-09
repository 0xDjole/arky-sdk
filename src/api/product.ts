import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  CreateProductParams,
  CreateProductVariantParams,
  DeleteProductParams,
  DeleteProductVariantParams,
  FindProductsParams,
  FindProductVariantsParams,
  GetProductByKeyParams,
  GetProductParams,
  GetProductVariantParams,
  Product,
  ProductVariant,
  UpdateProductParams,
  UpdateProductVariantParams,
} from "../types/product";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";

export const createProductApi = (apiConfig: ApiConfig) => ({
  find(params: FindProductsParams, options?: RequestOptions): Promise<PaginatedResponse<Product>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<Product>>(storePath(store_id, "products"), {
      ...options,
      params: query,
    });
  },

  get(params: GetProductParams, options?: RequestOptions): Promise<Product> {
    return apiConfig.httpClient.get<Product>(storeRecordPath(params.store_id, "products", params.id), options);
  },

  getByKey(params: GetProductByKeyParams, options?: RequestOptions): Promise<Product> {
    return apiConfig.httpClient.get<Product>(storePath(params.store_id, `products/by-key/${segment(params.key)}`), options);
  },

  create(params: CreateProductParams, options?: RequestOptions): Promise<Product> {
    requireId(params.id, "product");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<Product>(storePath(store_id, "products"), body, options);
  },

  update(params: UpdateProductParams, options?: RequestOptions): Promise<Product> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<Product>(storeRecordPath(store_id, "products", id), body, options);
  },

  delete(params: DeleteProductParams, options?: RequestOptions): Promise<Product> {
    return apiConfig.httpClient.delete<Product>(storeRecordPath(params.store_id, "products", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});

export const createProductVariantApi = (apiConfig: ApiConfig) => ({
  find(params: FindProductVariantsParams, options?: RequestOptions): Promise<PaginatedResponse<ProductVariant>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<ProductVariant>>(storePath(store_id, "product-variants"), {
      ...options,
      params: query,
    });
  },

  get(params: GetProductVariantParams, options?: RequestOptions): Promise<ProductVariant> {
    return apiConfig.httpClient.get<ProductVariant>(
      storeRecordPath(params.store_id, "product-variants", params.id),
      options,
    );
  },

  create(params: CreateProductVariantParams, options?: RequestOptions): Promise<ProductVariant> {
    requireId(params.id, "product variant");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<ProductVariant>(storePath(store_id, "product-variants"), body, options);
  },

  update(params: UpdateProductVariantParams, options?: RequestOptions): Promise<ProductVariant> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<ProductVariant>(storeRecordPath(store_id, "product-variants", id), body, options);
  },

  delete(params: DeleteProductVariantParams, options?: RequestOptions): Promise<ProductVariant | undefined> {
    return apiConfig.httpClient.delete<ProductVariant | undefined>(
      storeRecordPath(params.store_id, "product-variants", params.id),
      { ...options, params: { expected_updated_at: params.expected_updated_at } },
    );
  },
});
