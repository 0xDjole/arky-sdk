import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  ArchiveDigitalAssetParams,
  DigitalAsset,
  FindDigitalAssetsParams,
  GetDigitalAssetParams,
  UploadDigitalAssetParams,
} from "../types/product";
import { requireId } from "../utils/ids";
import { tenantPath, tenantRecordPath } from "./paths";

const collection = "digital-assets";

export const createDigitalAssetApi = (apiConfig: ApiConfig) => ({
  upload(params: UploadDigitalAssetParams, options?: RequestOptions): Promise<DigitalAsset> {
    requireId(params.id, "digital asset");
    const formData = new FormData();
    formData.append("id", params.id);
    formData.append("file", params.file);
    return apiConfig.httpClient.post<DigitalAsset>(tenantPath(params.tenant_id, collection), formData, options);
  },

  get(params: GetDigitalAssetParams, options?: RequestOptions): Promise<DigitalAsset> {
    return apiConfig.httpClient.get<DigitalAsset>(tenantRecordPath(params.tenant_id, collection, params.id), options);
  },

  find(params: FindDigitalAssetsParams, options?: RequestOptions): Promise<PaginatedResponse<DigitalAsset>> {
    const { tenant_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<DigitalAsset>>(tenantPath(tenant_id, collection), {
      ...options,
      params: query,
    });
  },

  archive(params: ArchiveDigitalAssetParams, options?: RequestOptions): Promise<DigitalAsset> {
    return apiConfig.httpClient.post<DigitalAsset>(
      `${tenantRecordPath(params.tenant_id, collection, params.id)}/archive`,
      { expected_updated_at: params.expected_updated_at },
      options,
    );
  },
});
