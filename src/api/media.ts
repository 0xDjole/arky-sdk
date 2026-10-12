import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  CreateMediaParams,
  DeleteMediaParams,
  FindMediaParams,
  GetMediaParams,
  Media,
  ReplaceMediaContentParams,
  UpdateMediaParams,
} from "../types/content";
import {
  clearPendingMediaCreate,
  getOrCreatePendingMediaCreate,
  mediaCreateStorageKey,
} from "../utils/durableMediaCreate";
import { DurableRequestStorageError, isDefiniteRefusal, withDurableRequestLock } from "../utils/durableRequest";
import { requireId } from "../utils/ids";
import { requireStoreId } from "../utils/storeTarget";
import { storePath, storeRecordPath } from "./paths";

const mediaCreateLabel = "Media create";

function browserHasDurableStorage(): boolean {
  return typeof globalThis.window !== "undefined";
}

function responseStatusCode(value: unknown): number | null {
  if (typeof value !== "object" || value === null || !("statusCode" in value)) return null;
  return typeof value.statusCode === "number" ? value.statusCode : null;
}

function isAmbiguousMediaResult(error: unknown): boolean {
  const status = responseStatusCode(error);
  return status === null || status >= 500;
}

function matchingMedia(media: Media, storeId: string, mediaId: string): boolean {
  return typeof media === "object" && media !== null && media.id === mediaId && media.store_id === storeId;
}

export const createMediaApi = (apiConfig: ApiConfig) => {
  const send = (exact: CreateMediaParams, options?: RequestOptions) => {
    const formData = new FormData();
    if (exact.file) formData.append("file", exact.file);
    else formData.append("source_url", exact.source_url);
    if (exact.alt) formData.append("alt", JSON.stringify(exact.alt));
    return apiConfig.httpClient.put<Media>(storeRecordPath(exact.store_id, "media", exact.id), formData, options);
  };

  return {
    async create(params: CreateMediaParams, options?: RequestOptions): Promise<Media> {
      const storeId = requireStoreId(params.store_id);
      requireId(params.id, "media");
      if (!browserHasDurableStorage()) return send(params, options);
      const storageKey = mediaCreateStorageKey(storeId);
      return withDurableRequestLock(storageKey, mediaCreateLabel, async () => {
        const pending = await getOrCreatePendingMediaCreate(storeId, params);
        let result: Media;
        try {
          result = await send(pending.params, options);
        } catch (error) {
          if (isDefiniteRefusal(error)) {
            await clearPendingMediaCreate(pending.durable);
            throw error;
          }
          if (isAmbiguousMediaResult(error)) {
            try {
              const reconciled = await apiConfig.httpClient.get<Media>(
                storeRecordPath(storeId, "media", pending.params.id),
              );
              if (matchingMedia(reconciled, storeId, pending.params.id)) {
                await clearPendingMediaCreate(pending.durable);
                return reconciled;
              }
            } catch {}
          }
          throw error;
        }
        if (!matchingMedia(result, storeId, pending.params.id)) {
          throw new DurableRequestStorageError(
            `Cannot safely continue ${mediaCreateLabel} because the server returned a different media`,
          );
        }
        await clearPendingMediaCreate(pending.durable);
        return result;
      });
    },

    find(params: FindMediaParams, options?: RequestOptions): Promise<PaginatedResponse<Media>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Media>>(storePath(store_id, "media"), {
        ...options,
        params: query,
      });
    },

    get(params: GetMediaParams, options?: RequestOptions): Promise<Media> {
      return apiConfig.httpClient.get<Media>(storeRecordPath(params.store_id, "media", params.id), options);
    },

    update(params: UpdateMediaParams, options?: RequestOptions): Promise<Media> {
      return apiConfig.httpClient.patch<Media>(
        storeRecordPath(params.store_id, "media", params.id),
        { expected_updated_at: params.expected_updated_at, alt: params.alt },
        options,
      );
    },

    replaceContent(params: ReplaceMediaContentParams, options?: RequestOptions): Promise<Media> {
      const formData = new FormData();
      formData.append("expected_updated_at", String(params.expected_updated_at));
      formData.append("file", params.file);
      return apiConfig.httpClient.put<Media>(
        `${storeRecordPath(params.store_id, "media", params.id)}/content`,
        formData,
        options,
      );
    },

    delete(params: DeleteMediaParams, options?: RequestOptions): Promise<Media> {
      return apiConfig.httpClient.delete<Media>(storeRecordPath(params.store_id, "media", params.id), {
        ...options,
        params: { expected_updated_at: params.expected_updated_at },
      });
    },
  };
};
