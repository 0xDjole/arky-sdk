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
import { segment, tenantPath, tenantRecordPath } from "./paths";

export const createProductApi = (apiConfig: ApiConfig) => ({
  find(params: FindProductsParams, options?: RequestOptions): Promise<PaginatedResponse<Product>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<Product>>(tenantPath(tenant_id, "products"), {
      ...options,
      params: query,
    });
  },

  get(params: GetProductParams, options?: RequestOptions): Promise<Product> {
    return apiConfig.httpClient.get<Product>(tenantRecordPath(params.tenant_id, "products", params.id), options);
  },

  getByKey(params: GetProductByKeyParams, options?: RequestOptions): Promise<Product> {
    return apiConfig.httpClient.get<Product>(tenantPath(params.tenant_id, `products/by-key/${segment(params.key)}`), options);
  },

  create(params: CreateProductParams, options?: RequestOptions): Promise<Product> {
    requireId(params.id, "product");
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<Product>(tenantPath(tenant_id, "products"), body, options);
  },

  update(params: UpdateProductParams, options?: RequestOptions): Promise<Product> {
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.put<Product>(tenantRecordPath(tenant_id, "products", id), body, options);
  },

  delete(params: DeleteProductParams, options?: RequestOptions): Promise<Product> {
    return apiConfig.httpClient.delete<Product>(tenantRecordPath(params.tenant_id, "products", params.id), {
      ...options,
      params: { expected_updated_at: params.expected_updated_at },
    });
  },
});

export const createProductVariantApi = (apiConfig: ApiConfig) => ({
  find(params: FindProductVariantsParams, options?: RequestOptions): Promise<PaginatedResponse<ProductVariant>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<ProductVariant>>(tenantPath(tenant_id, "product-variants"), {
      ...options,
      params: query,
    });
  },

  get(params: GetProductVariantParams, options?: RequestOptions): Promise<ProductVariant> {
    return apiConfig.httpClient.get<ProductVariant>(
      tenantRecordPath(params.tenant_id, "product-variants", params.id),
      options,
    );
  },

  create(params: CreateProductVariantParams, options?: RequestOptions): Promise<ProductVariant> {
    requireId(params.id, "product variant");
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<ProductVariant>(tenantPath(tenant_id, "product-variants"), body, options);
  },

  update(params: UpdateProductVariantParams, options?: RequestOptions): Promise<ProductVariant> {
    const { tenant_id, id, ...body } = params;
    return apiConfig.httpClient.put<ProductVariant>(tenantRecordPath(tenant_id, "product-variants", id), body, options);
  },

  delete(params: DeleteProductVariantParams, options?: RequestOptions): Promise<ProductVariant> {
    return apiConfig.httpClient.delete<ProductVariant>(
      tenantRecordPath(params.tenant_id, "product-variants", params.id),
      { ...options, params: { expected_updated_at: params.expected_updated_at } },
    );
  },
});
