import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  ActivateEmailSuppressionParams,
  EmailSuppressionRecord,
  FindEmailSuppressionsParams,
  GetEmailSuppressionParams,
  ReleaseEmailSuppressionParams,
} from "../types/emailSuppression";

export const createEmailSuppressionApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${storeId || apiConfig.storeId}/email-suppressions`;

  const activate = (
    action: "block" | "record-unsubscribe",
    params: ActivateEmailSuppressionParams,
    options?: RequestOptions,
  ): Promise<EmailSuppressionRecord> => {
    const { store_id, id, email, command_id, expected_version, note } = params;
    if (expected_version === undefined) {
      throw new TypeError("An explicit expected_version or null is required");
    }
    return apiConfig.httpClient.post<EmailSuppressionRecord>(
      `${basePath(store_id)}/${action}`,
      { id, email, command_id, expected_version, note },
      options,
    );
  };

  const release = (
    action: "unblock" | "record-resubscribe",
    params: ReleaseEmailSuppressionParams,
    options?: RequestOptions,
  ): Promise<EmailSuppressionRecord> => {
    const { store_id, id, command_id, expected_version, note } = params;
    if (typeof expected_version !== "string" || expected_version.length === 0) {
      throw new TypeError(
        "The current expected_version is required for release",
      );
    }
    return apiConfig.httpClient.post<EmailSuppressionRecord>(
      `${basePath(store_id)}/${id}/${action}`,
      { command_id, expected_version, note },
      options,
    );
  };

  return {
    async find(
      params: FindEmailSuppressionsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<EmailSuppressionRecord>> {
      const { store_id, query, type, status, cursor } = params;
      if (query !== undefined) {
        if (params.limit !== undefined || cursor !== undefined) {
          throw new RangeError("Exact email search does not accept pagination");
        }
        return apiConfig.httpClient.get<
          PaginatedResponse<EmailSuppressionRecord>
        >(basePath(store_id), { ...options, params: { query, type, status } });
      }
      const limit = params.limit === undefined ? 50 : params.limit;
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw new RangeError(
          "Email restriction limit must be an integer from 1 to 100",
        );
      }
      if (
        cursor !== undefined &&
        (typeof cursor !== "string" ||
          cursor.length === 0 ||
          new TextEncoder().encode(cursor).length > 2048)
      ) {
        throw new RangeError(
          "Email restriction cursor must contain 1 to 2048 bytes",
        );
      }
      return apiConfig.httpClient.get<
        PaginatedResponse<EmailSuppressionRecord>
      >(basePath(store_id), {
        ...options,
        params: { limit, cursor, type, status },
      });
    },

    async get(
      params: GetEmailSuppressionParams,
      options?: RequestOptions,
    ): Promise<EmailSuppressionRecord> {
      return apiConfig.httpClient.get<EmailSuppressionRecord>(
        `${basePath(params.store_id)}/${params.id}`,
        options,
      );
    },

    async block(
      params: ActivateEmailSuppressionParams,
      options?: RequestOptions,
    ) {
      return activate("block", params, options);
    },
    async recordUnsubscribe(
      params: ActivateEmailSuppressionParams,
      options?: RequestOptions,
    ) {
      return activate("record-unsubscribe", params, options);
    },
    async unblock(
      params: ReleaseEmailSuppressionParams,
      options?: RequestOptions,
    ) {
      return release("unblock", params, options);
    },
    async recordResubscribe(
      params: ReleaseEmailSuppressionParams,
      options?: RequestOptions,
    ) {
      return release("record-resubscribe", params, options);
    },
  };
};
