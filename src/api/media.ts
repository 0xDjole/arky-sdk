import type { ApiConfig } from "../services/clientTypes";
import type {
  CreateMediaParams,
  DeleteMediaParams,
  FindMediaParams,
  GetMediaParams,
  ReplaceMediaContentParams,
  RequestOptions,
} from "../types/api";
import type { Media, PaginatedResponse } from "../types";

function storeId(apiConfig: ApiConfig, explicit?: string): string | undefined {
  return explicit || apiConfig.storeId;
}

function mediaPath(
  apiConfig: ApiConfig,
  explicitStoreId?: string,
  mediaId?: string,
): string {
  const base = `/v1/stores/${storeId(apiConfig, explicitStoreId)}/media`;
  return mediaId ? `${base}/${mediaId}` : base;
}

async function mediaMultipartRequest(
  apiConfig: ApiConfig,
  path: string,
  formData: FormData,
  options?: RequestOptions,
): Promise<Media> {
  const tokens = apiConfig.authStorage.getTokens();
  const response = await fetch(`${apiConfig.baseUrl}${path}`, {
    method: "PUT",
    body: formData,
    headers: tokens?.access_token
      ? { Authorization: `Bearer ${tokens.access_token}` }
      : undefined,
    signal: options?.signal,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || `Media request failed (${response.status})`);
  }
  return response.json() as Promise<Media>;
}

export const createMediaApi = (apiConfig: ApiConfig) => ({
  async create(
    params: CreateMediaParams,
    options?: RequestOptions,
  ): Promise<Media> {
    const formData = new FormData();
    if (params.file) {
      formData.append("file", params.file);
    } else {
      formData.append("source_url", params.source_url);
    }
    return mediaMultipartRequest(
      apiConfig,
      mediaPath(apiConfig, params.store_id, params.media_id),
      formData,
      options,
    );
  },

  async find(
    params: FindMediaParams = {},
    options?: RequestOptions,
  ): Promise<PaginatedResponse<Media>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<Media>>(
      mediaPath(apiConfig, store_id),
      { ...options, params: query },
    );
  },

  async get(
    params: GetMediaParams,
    options?: RequestOptions,
  ): Promise<Media> {
    return apiConfig.httpClient.get<Media>(
      mediaPath(apiConfig, params.store_id, params.media_id),
      options,
    );
  },

  async replaceContent(
    params: ReplaceMediaContentParams,
    options?: RequestOptions,
  ): Promise<Media> {
    const formData = new FormData();
    formData.append("file", params.file);
    return mediaMultipartRequest(
      apiConfig,
      `${mediaPath(apiConfig, params.store_id, params.media_id)}/content`,
      formData,
      options,
    );
  },

  async delete(
    params: DeleteMediaParams,
    options?: RequestOptions,
  ): Promise<boolean> {
    return apiConfig.httpClient.delete<boolean>(
      mediaPath(apiConfig, params.store_id, params.media_id),
      options,
    );
  },
});
