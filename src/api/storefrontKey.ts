import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  CreateStorefrontKeyParams,
  FindStorefrontKeysParams,
  GetStorefrontKeyParams,
  RevokeStorefrontKeyParams,
  StorefrontKey,
} from "../types/market";
import { requireId } from "../utils/ids";
import { storePath, storeRecordPath } from "./paths";

const collection = "storefront-keys";

export const createStorefrontKeyApi = (apiConfig: ApiConfig) => ({
  find(params: FindStorefrontKeysParams, options?: RequestOptions): Promise<PaginatedResponse<StorefrontKey>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<StorefrontKey>>(storePath(store_id, collection), {
      ...options,
      params: query,
    });
  },

  get(params: GetStorefrontKeyParams, options?: RequestOptions): Promise<StorefrontKey> {
    return apiConfig.httpClient.get<StorefrontKey>(storeRecordPath(params.store_id, collection, params.id), options);
  },

  create(params: CreateStorefrontKeyParams, options?: RequestOptions): Promise<StorefrontKey> {
    requireId(params.id, "storefront key");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<StorefrontKey>(storePath(store_id, collection), body, options);
  },

  revoke(params: RevokeStorefrontKeyParams, options?: RequestOptions): Promise<StorefrontKey> {
    return apiConfig.httpClient.post<StorefrontKey>(
      `${storeRecordPath(params.store_id, collection, params.id)}/revoke`,
      { expected_updated_at: params.expected_updated_at },
      options,
    );
  },
});
