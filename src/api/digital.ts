import type { ApiConfig } from "../index";
import type {
  ArchiveDigitalAssetParams,
  CreateDigitalProductParams,
  FindDigitalAssetsParams,
  FindDigitalProductsParams,
  GetDigitalProductParams,
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
    const storeId = store_id || apiConfig.storeId;
    return apiConfig.httpClient.post(
      `/v1/stores/${storeId}/digital-products`,
      payload,
      options,
    );
  },

  updateProduct(
    params: UpdateDigitalProductParams,
    options?: RequestOptions,
  ): Promise<DigitalProduct> {
    const { store_id, digital_product_id, ...payload } = params;
    const storeId = store_id || apiConfig.storeId;
    return apiConfig.httpClient.put(
      `/v1/stores/${storeId}/digital-products/${digital_product_id}`,
      payload,
      options,
    );
  },

  getProduct(
    params: GetDigitalProductParams,
    options?: RequestOptions,
  ): Promise<DigitalProduct> {
    const storeId = params.store_id || apiConfig.storeId;
    return apiConfig.httpClient.get(
      `/v1/stores/${storeId}/digital-products/${params.digital_product_id}`,
      options,
    );
  },

  findProducts(
    params: FindDigitalProductsParams = {},
    options?: RequestOptions,
  ): Promise<PaginatedResponse<DigitalProduct>> {
    const { store_id, ...query } = params;
    const storeId = store_id || apiConfig.storeId;
    return apiConfig.httpClient.get(`/v1/stores/${storeId}/digital-products`, {
      ...options,
      params: query,
    });
  },

  deleteProduct(
    params: GetDigitalProductParams,
    options?: RequestOptions,
  ): Promise<boolean> {
    const storeId = params.store_id || apiConfig.storeId;
    return apiConfig.httpClient.delete(
      `/v1/stores/${storeId}/digital-products/${params.digital_product_id}`,
      options,
    );
  },

  async uploadAsset(
    params: UploadDigitalAssetParams,
    options?: RequestOptions,
  ): Promise<DigitalAsset> {
    const storeId = params.store_id || apiConfig.storeId;
    const body = new FormData();
    body.append("file", params.file);
    const tokens = apiConfig.authStorage.getTokens();
    const response = await fetch(
      `${apiConfig.baseUrl}/v1/stores/${storeId}/digital-products/assets`,
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

  findAssets(
    params: FindDigitalAssetsParams = {},
    options?: RequestOptions,
  ): Promise<PaginatedResponse<DigitalAsset>> {
    const { store_id, ...query } = params;
    const storeId = store_id || apiConfig.storeId;
    return apiConfig.httpClient.get(
      `/v1/stores/${storeId}/digital-products/assets`,
      { ...options, params: query },
    );
  },

  archiveAsset(
    params: ArchiveDigitalAssetParams,
    options?: RequestOptions,
  ): Promise<DigitalAsset> {
    const storeId = params.store_id || apiConfig.storeId;
    return apiConfig.httpClient.delete(
      `/v1/stores/${storeId}/digital-products/assets/${params.asset_id}`,
      options,
    );
  },
});
