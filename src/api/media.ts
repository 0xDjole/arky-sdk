import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  CreateMediaParams,
  DeleteMediaParams,
  FindMediaParams,
  GetMediaParams,
  Media,
  MediaVisibility,
  ReplaceMediaContentParams,
  UpdateMediaParams,
} from "../types/content";
import type { ElevenLabsVoice, FindVoicesParams, SpeakMediaParams } from "../types/support";
import {
  clearPendingMediaCreate,
  getOrCreatePendingMediaCreate,
  mediaCreateLabel,
  mediaCreateStorageKey,
} from "../utils/durableMediaCreate";
import { DurableRequestError, isDefiniteRefusal, withDurableRequestLock } from "../utils/durableRequest";
import { requireId } from "../utils/ids";
import { requireTenantId } from "../utils/tenantTarget";
import { tenantPath, tenantRecordPath } from "./paths";

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

function matchingMedia(media: Media, tenantId: string, mediaId: string, visibility: MediaVisibility): boolean {
  return typeof media === "object" && media !== null && media.id === mediaId && media.tenant_id === tenantId && media.visibility === visibility;
}

function requireVisibility(value: unknown): MediaVisibility {
  if (value !== "public" && value !== "private") {
    throw new TypeError('Media visibility must be an explicit "public" or "private"');
  }
  return value;
}

export const createMediaApi = (apiConfig: ApiConfig) => {
  const send = (exact: CreateMediaParams, options?: RequestOptions) => {
    const formData = new FormData();
    if (exact.file) formData.append("file", exact.file);
    else formData.append("source_url", exact.source_url);
    if (exact.alt) formData.append("alt", JSON.stringify(exact.alt));
    formData.append("visibility", requireVisibility(exact.visibility));
    return apiConfig.httpClient.put<Media>(tenantRecordPath(exact.tenant_id, "media", exact.id), formData, options);
  };

  return {
    async create(params: CreateMediaParams, options?: RequestOptions): Promise<Media> {
      const tenantId = requireTenantId(params.tenant_id);
      requireId(params.id, "media");
      requireVisibility(params.visibility);
      if (!browserHasDurableStorage()) return send(params, options);
      const storageKey = mediaCreateStorageKey(tenantId);
      return withDurableRequestLock(storageKey, mediaCreateLabel, async () => {
        const pending = await getOrCreatePendingMediaCreate(tenantId, params);
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
                tenantRecordPath(tenantId, "media", pending.params.id),
              );
              if (matchingMedia(reconciled, tenantId, pending.params.id, pending.params.visibility)) {
                await clearPendingMediaCreate(pending.durable);
                return reconciled;
              }
            } catch {}
          }
          throw error;
        }
        if (!matchingMedia(result, tenantId, pending.params.id, pending.params.visibility)) {
          throw new DurableRequestError(
            "answer_mismatch",
            `${mediaCreateLabel} was answered with another media; the request is kept for a retry`,
          );
        }
        await clearPendingMediaCreate(pending.durable);
        return result;
      });
    },

    find(params: FindMediaParams, options?: RequestOptions): Promise<PaginatedResponse<Media>> {
      const { tenant_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Media>>(tenantPath(tenant_id, "media"), {
        ...options,
        params: query,
      });
    },

    get(params: GetMediaParams, options?: RequestOptions): Promise<Media> {
      return apiConfig.httpClient.get<Media>(tenantRecordPath(params.tenant_id, "media", params.id), options);
    },

    update(params: UpdateMediaParams, options?: RequestOptions): Promise<Media> {
      return apiConfig.httpClient.patch<Media>(
        tenantRecordPath(params.tenant_id, "media", params.id),
        { expected_updated_at: params.expected_updated_at, alt: params.alt },
        options,
      );
    },

    replaceContent(params: ReplaceMediaContentParams, options?: RequestOptions): Promise<Media> {
      const formData = new FormData();
      formData.append("expected_updated_at", String(params.expected_updated_at));
      formData.append("file", params.file);
      return apiConfig.httpClient.put<Media>(
        `${tenantRecordPath(params.tenant_id, "media", params.id)}/content`,
        formData,
        options,
      );
    },

    delete(params: DeleteMediaParams, options?: RequestOptions): Promise<Media> {
      return apiConfig.httpClient.delete<Media>(tenantRecordPath(params.tenant_id, "media", params.id), {
        ...options,
        params: { expected_updated_at: params.expected_updated_at },
      });
    },

    speak(params: SpeakMediaParams, options?: RequestOptions): Promise<Media> {
      requireId(params.media_id, "media");
      const { tenant_id, ...body } = params;
      return apiConfig.httpClient.post<Media>(tenantPath(tenant_id, "spoken-prompts"), body, options);
    },

    findVoices(params: FindVoicesParams, options?: RequestOptions): Promise<PaginatedResponse<ElevenLabsVoice>> {
      const { tenant_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<ElevenLabsVoice>>(tenantPath(tenant_id, "voices"), {
        ...options,
        params: query,
      });
    },
  };
};
