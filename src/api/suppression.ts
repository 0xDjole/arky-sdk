import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  ActivateEmailSuppressionParams,
  ActivateSmsSuppressionParams,
  FindSuppressionsParams,
  GetSuppressionParams,
  ReleaseSuppressionParams,
  Suppression,
} from "../types/customer";
import { requireId } from "../utils/ids";
import { storePath, storeRecordPath } from "./paths";

const collection = "suppressions";

export const createSuppressionApi = (apiConfig: ApiConfig) => {
  const activate = (
    verb: string,
    params: ActivateEmailSuppressionParams | ActivateSmsSuppressionParams,
    options?: RequestOptions,
  ) => {
    requireId(params.id, "suppression");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<Suppression>(storePath(store_id, `${collection}/${verb}`), body, options);
  };

  const release = (verb: string, params: ReleaseSuppressionParams, options?: RequestOptions) =>
    apiConfig.httpClient.post<Suppression>(
      `${storeRecordPath(params.store_id, collection, params.id)}/${verb}`,
      { note: params.note, expected_updated_at: params.expected_updated_at },
      options,
    );

  return {
    find(params: FindSuppressionsParams, options?: RequestOptions): Promise<PaginatedResponse<Suppression>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Suppression>>(storePath(store_id, collection), {
        ...options,
        params: query,
      });
    },

    get(params: GetSuppressionParams, options?: RequestOptions): Promise<Suppression> {
      return apiConfig.httpClient.get<Suppression>(storeRecordPath(params.store_id, collection, params.id), options);
    },

    blockEmail(params: ActivateEmailSuppressionParams, options?: RequestOptions): Promise<Suppression> {
      return activate("block-email", params, options);
    },

    recordUnsubscribe(params: ActivateEmailSuppressionParams, options?: RequestOptions): Promise<Suppression> {
      return activate("record-unsubscribe", params, options);
    },

    blockSms(params: ActivateSmsSuppressionParams, options?: RequestOptions): Promise<Suppression> {
      return activate("block-sms", params, options);
    },

    unblockEmail(params: ReleaseSuppressionParams, options?: RequestOptions): Promise<Suppression> {
      return release("unblock-email", params, options);
    },

    recordResubscribe(params: ReleaseSuppressionParams, options?: RequestOptions): Promise<Suppression> {
      return release("record-resubscribe", params, options);
    },

    releaseSms(params: ReleaseSuppressionParams, options?: RequestOptions): Promise<Suppression> {
      return release("release-sms", params, options);
    },
  };
};
