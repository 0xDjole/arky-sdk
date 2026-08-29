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
import {
  clearPendingMediaCreate,
  getOrCreatePendingMediaCreate,
  mediaCreateStorageKey,
} from "../utils/durableMediaCreate";
import {
  DurableRequestStorageError,
  withDurableRequestLock,
} from "../utils/durableRequest";

const mediaCreateLabel = "Media create";

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
    const failure = new Error(
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string"
        ? error.message
        : `Media request failed (${response.status})`,
    ) as Error & { statusCode?: number };
    failure.statusCode = response.status;
    throw failure;
  }
  return response.json() as Promise<Media>;
}

function browserHasDurableStorage(): boolean {
  return typeof globalThis.window !== "undefined";
}

function responseStatusCode(value: unknown): number | null {
  if (typeof value !== "object" || value === null || !("statusCode" in value)) {
    return null;
  }
  return typeof value.statusCode === "number" ? value.statusCode : null;
}

function isAmbiguousMediaResult(error: unknown): boolean {
  const status = responseStatusCode(error);
  return status === null || status >= 500;
}

function matchingMedia(media: Media, storeId: string, mediaId: string): boolean {
  return (
    typeof media === "object" &&
    media !== null &&
    media.id === mediaId &&
    media.store_id === storeId
  );
}

export const createMediaApi = (apiConfig: ApiConfig) => ({
  async create(
    params: CreateMediaParams,
    options?: RequestOptions,
  ): Promise<Media> {
    const targetStoreId = storeId(apiConfig, params.store_id);
    if (!targetStoreId) {
      throw new Error("Media create requires an exact Store ID");
    }
    const send = (exact: CreateMediaParams) => {
      const formData = new FormData();
      if (exact.file) {
        formData.append("file", exact.file);
      } else {
        formData.append("source_url", exact.source_url);
      }
      return mediaMultipartRequest(
        apiConfig,
        mediaPath(apiConfig, targetStoreId, exact.media_id),
        formData,
        options,
      );
    };
    if (!browserHasDurableStorage()) return send(params);

    const storageKey = mediaCreateStorageKey(targetStoreId);
    return withDurableRequestLock(storageKey, mediaCreateLabel, async () => {
      const pending = await getOrCreatePendingMediaCreate(targetStoreId, params);
      let result: Media;
      try {
        result = await send(pending.params);
      } catch (error) {
        if (isAmbiguousMediaResult(error)) {
          try {
            const reconciled = await apiConfig.httpClient.get<Media>(
              mediaPath(apiConfig, targetStoreId, pending.params.media_id),
            );
            if (
              matchingMedia(reconciled, targetStoreId, pending.params.media_id)
            ) {
              await clearPendingMediaCreate(pending.durable);
              return reconciled;
            }
          } catch {
            // The exact read did not prove the root; retain the request and original error.
          }
        }
        throw error;
      }
      if (!matchingMedia(result, targetStoreId, pending.params.media_id)) {
        throw new DurableRequestStorageError(
          `Cannot safely continue ${mediaCreateLabel} because Server returned a different Media root`,
        );
      }
      await clearPendingMediaCreate(pending.durable);
      return result;
    });
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
