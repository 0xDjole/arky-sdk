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
} from "../types/user";
import { requireId } from "../utils/ids";
import { tenantPath, tenantRecordPath } from "./paths";

const collection = "suppressions";

export const createSuppressionApi = (apiConfig: ApiConfig) => {
  const activate = (
    verb: string,
    params: ActivateEmailSuppressionParams | ActivateSmsSuppressionParams,
    options?: RequestOptions,
  ) => {
    requireId(params.id, "suppression");
    const { tenant_id, ...body } = params;
    return apiConfig.httpClient.post<Suppression>(tenantPath(tenant_id, `${collection}/${verb}`), body, options);
  };

  const release = (verb: string, params: ReleaseSuppressionParams, options?: RequestOptions) =>
    apiConfig.httpClient.post<Suppression>(
      `${tenantRecordPath(params.tenant_id, collection, params.id)}/${verb}`,
      { note: params.note, expected_updated_at: params.expected_updated_at },
      options,
    );

  return {
    find(params: FindSuppressionsParams, options?: RequestOptions): Promise<PaginatedResponse<Suppression>> {
      const { tenant_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Suppression>>(tenantPath(tenant_id, collection), {
        ...options,
        params: query,
      });
    },

    get(params: GetSuppressionParams, options?: RequestOptions): Promise<Suppression> {
      return apiConfig.httpClient.get<Suppression>(tenantRecordPath(params.tenant_id, collection, params.id), options);
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
