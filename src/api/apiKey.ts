import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { DeletedResponse, PaginatedResponse } from "../types/common";
import type {
  CreateApiKeyParams,
  FindApiKeysParams,
  GetApiKeyParams,
  RevokeApiKeyParams,
  ApiKey,
  ApiKeyCreated,
  DeleteApiKeyParams,
} from "../types/apiKey";
import { requireId } from "../utils/ids";
import { storePath, storeRecordPath } from "./paths";

const collection = "api-keys";

export const createApiKeyApi = (apiConfig: ApiConfig) => ({
  find(params: FindApiKeysParams, options?: RequestOptions): Promise<PaginatedResponse<ApiKey>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<ApiKey>>(storePath(store_id, collection), {
      ...options,
      params: query,
    });
  },

  get(params: GetApiKeyParams, options?: RequestOptions): Promise<ApiKey> {
    return apiConfig.httpClient.get<ApiKey>(storeRecordPath(params.store_id, collection, params.id), options);
  },

  create(params: CreateApiKeyParams, options?: RequestOptions): Promise<ApiKeyCreated> {
    requireId(params.id, "API key");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<ApiKeyCreated>(storePath(store_id, collection), body, options);
  },

  revoke(params: RevokeApiKeyParams, options?: RequestOptions): Promise<ApiKey> {
    return apiConfig.httpClient.post<ApiKey>(
      `${storeRecordPath(params.store_id, collection, params.id)}/revoke`,
      { expected_updated_at: params.expected_updated_at },
      options,
    );
  },
  delete(params: DeleteApiKeyParams, options?: RequestOptions): Promise<DeletedResponse> {
    return apiConfig.httpClient.delete<DeletedResponse>(storeRecordPath(params.store_id, collection, params.id), {
      ...options, params: { expected_updated_at: params.expected_updated_at },
    });
  },
});
