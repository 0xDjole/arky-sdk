import { requireStoreId } from "../utils/storeTarget";
import type { ApiConfig } from "../services/clientTypes";
import type {
  ArchiveDigitalAssetParams,
  CreateDigitalProductParams,
  FindDigitalAssetsParams,
  FindDigitalProductsParams,
  GetDigitalProductParams,
  GetDigitalProductByKeyParams,
  GetDigitalAssetParams,
  RequestOptions,
  UpdateDigitalProductParams,
  UploadDigitalAssetParams,
} from "../types/api";
import type {
  DigitalAsset,
  DigitalProduct,
  PaginatedResponse,
} from "../types";

export const createDigitalApi = (apiConfig: ApiConfig) => ({
  createProduct(
    params: CreateDigitalProductParams,
    options?: RequestOptions,
  ): Promise<DigitalProduct> {
    const { store_id, ...payload } = params;
    const storeId = requireStoreId(store_id);
    return apiConfig.httpClient.post<DigitalProduct>(
      `/v1/stores/${requireStoreId(storeId)}/digital-products`,
      payload,
      options,
    );
  },

  updateProduct(
    params: UpdateDigitalProductParams,
    options?: RequestOptions,
  ): Promise<DigitalProduct> {
    const { store_id, digital_product_id, ...payload } = params;
    const storeId = requireStoreId(store_id);
    return apiConfig.httpClient.put<DigitalProduct>(
      `/v1/stores/${requireStoreId(storeId)}/digital-products/${digital_product_id}`,
      payload,
      options,
    );
  },

  getProduct(
    params: GetDigitalProductParams,
    options?: RequestOptions,
  ): Promise<DigitalProduct> {
    const storeId = requireStoreId(params.store_id);
    return apiConfig.httpClient.get<DigitalProduct>(
      `/v1/stores/${requireStoreId(storeId)}/digital-products/${params.digital_product_id}`,
      options,
    );
  },

  getProductByKey(
    params: GetDigitalProductByKeyParams,
    options?: RequestOptions,
  ): Promise<DigitalProduct> {
    const storeId = requireStoreId(params.store_id);
    return apiConfig.httpClient.get<DigitalProduct>(
      `/v1/stores/${requireStoreId(storeId)}/digital-products/by-key/${encodeURIComponent(params.key)}`,
      options,
    );
  },

  findProducts(
    params: FindDigitalProductsParams,
    options?: RequestOptions,
  ): Promise<PaginatedResponse<DigitalProduct>> {
    const { store_id, ...query } = params;
    const storeId = requireStoreId(store_id);
    return apiConfig.httpClient.get<PaginatedResponse<DigitalProduct>>(
      `/v1/stores/${requireStoreId(storeId)}/digital-products`,
      {
        ...options,
        params: query,
      },
    );
  },

  deleteProduct(
    params: GetDigitalProductParams,
    options?: RequestOptions,
  ): Promise<boolean> {
    const storeId = requireStoreId(params.store_id);
    return apiConfig.httpClient.delete<boolean>(
      `/v1/stores/${requireStoreId(storeId)}/digital-products/${params.digital_product_id}`,
      options,
    );
  },

  async uploadAsset(
    params: UploadDigitalAssetParams,
    options?: RequestOptions,
  ): Promise<DigitalAsset> {
    const storeId = requireStoreId(params.store_id);
    const body = new FormData();
    body.append("file", params.file);
    const tokens = apiConfig.authStorage.getTokens();
    const response = await fetch(
      `${apiConfig.baseUrl}/v1/stores/${requireStoreId(storeId)}/digital-assets`,
      {
        method: "POST",
        body,
        headers: { Authorization: `Bearer ${tokens?.access_token || ""}` },
        signal: options?.signal,
      },
    );
    if (!response.ok) throw new Error("Digital Asset upload failed");
    return response.json();
  },

  getAsset(
    params: GetDigitalAssetParams,
    options?: RequestOptions,
  ): Promise<DigitalAsset> {
    const storeId = requireStoreId(params.store_id);
    return apiConfig.httpClient.get<DigitalAsset>(
      `/v1/stores/${requireStoreId(storeId)}/digital-assets/${params.asset_id}`,
      options,
    );
  },

  findAssets(
    params: FindDigitalAssetsParams,
    options?: RequestOptions,
  ): Promise<PaginatedResponse<DigitalAsset>> {
    const { store_id, ...query } = params;
    const storeId = requireStoreId(store_id);
    return apiConfig.httpClient.get<PaginatedResponse<DigitalAsset>>(
      `/v1/stores/${requireStoreId(storeId)}/digital-assets`,
      { ...options, params: query },
    );
  },

  archiveAsset(
    params: ArchiveDigitalAssetParams,
    options?: RequestOptions,
  ): Promise<DigitalAsset> {
    const storeId = requireStoreId(params.store_id);
    return apiConfig.httpClient.delete<DigitalAsset>(
      `/v1/stores/${requireStoreId(storeId)}/digital-assets/${params.asset_id}`,
      options,
    );
  },
});
