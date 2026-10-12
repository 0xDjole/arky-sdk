import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  ActivateEmailSuppressionParams,
  EmailSuppression,
  FindEmailSuppressionsParams,
  GetEmailSuppressionParams,
  ReleaseEmailSuppressionParams,
} from "../types/customer";
import { requireId } from "../utils/ids";
import { storePath, storeRecordPath } from "./paths";

const collection = "email-suppressions";

export const createEmailSuppressionApi = (apiConfig: ApiConfig) => {
  const activate = (verb: string, params: ActivateEmailSuppressionParams, options?: RequestOptions) => {
    requireId(params.id, "email suppression");
    const { store_id, ...body } = params;
    return apiConfig.httpClient.post<EmailSuppression>(storePath(store_id, `${collection}/${verb}`), body, options);
  };

  const release = (verb: string, params: ReleaseEmailSuppressionParams, options?: RequestOptions) =>
    apiConfig.httpClient.post<EmailSuppression>(
      `${storeRecordPath(params.store_id, collection, params.id)}/${verb}`,
      { note: params.note, expected_updated_at: params.expected_updated_at },
      options,
    );

  return {
    find(params: FindEmailSuppressionsParams, options?: RequestOptions): Promise<PaginatedResponse<EmailSuppression>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<EmailSuppression>>(storePath(store_id, collection), {
        ...options,
        params: query,
      });
    },

    get(params: GetEmailSuppressionParams, options?: RequestOptions): Promise<EmailSuppression> {
      return apiConfig.httpClient.get<EmailSuppression>(storeRecordPath(params.store_id, collection, params.id), options);
    },

    block(params: ActivateEmailSuppressionParams, options?: RequestOptions): Promise<EmailSuppression> {
      return activate("block", params, options);
    },

    recordUnsubscribe(params: ActivateEmailSuppressionParams, options?: RequestOptions): Promise<EmailSuppression> {
      return activate("record-unsubscribe", params, options);
    },

    unblock(params: ReleaseEmailSuppressionParams, options?: RequestOptions): Promise<EmailSuppression> {
      return release("unblock", params, options);
    },

    recordResubscribe(params: ReleaseEmailSuppressionParams, options?: RequestOptions): Promise<EmailSuppression> {
      return release("record-resubscribe", params, options);
    },
  };
};
