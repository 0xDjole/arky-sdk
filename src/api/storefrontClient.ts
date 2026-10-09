import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  CreateStorefrontClientParams,
  FindStorefrontClientsParams,
  RevokeStorefrontClientParams,
  StoreRecordParams,
  StorefrontClientRegistration,
  UpdateStorefrontClientParams,
} from "../types/market";
import { requireId } from "../utils/ids";
import { storePath, storeRecordPath } from "./paths";

const collection = "storefront-clients";

export const createStorefrontClientApi = (apiConfig: ApiConfig) => ({
  find(params: FindStorefrontClientsParams, options?: RequestOptions): Promise<PaginatedResponse<StorefrontClientRegistration>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<StorefrontClientRegistration>>(storePath(store_id, collection), {
      ...options,
      params: query,
    });
  },

  get(params: StoreRecordParams, options?: RequestOptions): Promise<StorefrontClientRegistration> {
    return apiConfig.httpClient.get<StorefrontClientRegistration>(storeRecordPath(params.store_id, collection, params.id), options);
  },

  create(params: CreateStorefrontClientParams, options?: RequestOptions): Promise<StorefrontClientRegistration> {
    requireId(params.id, "storefront client");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<StorefrontClientRegistration>(storePath(store_id, collection), body, options);
  },

  update(params: UpdateStorefrontClientParams, options?: RequestOptions): Promise<StorefrontClientRegistration> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.put<StorefrontClientRegistration>(storeRecordPath(store_id, collection, id), body, options);
  },

  revoke(params: RevokeStorefrontClientParams, options?: RequestOptions): Promise<StorefrontClientRegistration> {
    return apiConfig.httpClient.post<StorefrontClientRegistration>(
      `${storeRecordPath(params.store_id, collection, params.id)}/revoke`,
      { expected_updated_at: params.expected_updated_at },
      options,
    );
  },
});
