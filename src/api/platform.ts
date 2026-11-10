import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type { Account, FindPlatformAdminsParams, SetAccountAccessParams } from "../types/account";
import type { WebhookEventMetadata } from "../types/webhook";
import type {
  FindStripeBillingEventsParams,
  FindResendEventsParams,
  ResolveResendEventParams,
  IncomingWebhook,
  ResolveStripeBillingEventParams,
} from "../types/payment";
import { requireId } from "../utils/ids";
import { segment } from "./paths";

export const createPlatformApi = (apiConfig: ApiConfig) => ({
  async findCurrencies(options?: RequestOptions): Promise<PaginatedResponse<string>> {
    const items = await apiConfig.httpClient.get<string[]>("/v1/platform/currencies", options);
    return { items, cursor: null };
  },

  async findWebhookEvents(options?: RequestOptions): Promise<PaginatedResponse<WebhookEventMetadata>> {
    const items = await apiConfig.httpClient.get<WebhookEventMetadata[]>("/v1/platform/events", options);
    return { items, cursor: null };
  },

  access: {
    find(params: FindPlatformAdminsParams = {}, options?: RequestOptions): Promise<PaginatedResponse<Account>> {
      return apiConfig.httpClient.get<PaginatedResponse<Account>>("/v1/accounts", {
        ...options, params: { ...params, access: "platform_admin" },
      });
    },
    getMe(options?: RequestOptions): Promise<Account> {
      return apiConfig.httpClient.get<Account>("/v1/accounts/me/platform-admin", options);
    },
    set(params: SetAccountAccessParams, options?: RequestOptions): Promise<Account> {
      return apiConfig.httpClient.put<Account>(`/v1/accounts/${segment(requireId(params.account_id, "account"))}/access`,
        { access: params.access }, options);
    },
  },

  stripeBillingEvent: {
    find(params: FindStripeBillingEventsParams, options?: RequestOptions): Promise<PaginatedResponse<IncomingWebhook>> {
      return apiConfig.httpClient.get<PaginatedResponse<IncomingWebhook>>(
        "/v1/platform/incoming-webhooks/stripe-billing",
        { ...options, params },
      );
    },

    resolve(params: ResolveStripeBillingEventParams, options?: RequestOptions): Promise<IncomingWebhook> {
      return apiConfig.httpClient.post<IncomingWebhook>(
        `/v1/platform/incoming-webhooks/stripe-billing/${segment(params.id)}/resolve`,
        { network_id: params.network_id, expected_updated_at: params.expected_updated_at, resolution: params.resolution },
        options,
      );
    },
  },
  resendEvent: {
    find(params: FindResendEventsParams, options?: RequestOptions): Promise<PaginatedResponse<IncomingWebhook>> {
      return apiConfig.httpClient.get<PaginatedResponse<IncomingWebhook>>("/v1/platform/incoming-webhooks/resend", { ...options, params });
    },
    resolve(params: ResolveResendEventParams, options?: RequestOptions): Promise<IncomingWebhook> {
      const { id, ...body } = params;
      return apiConfig.httpClient.post<IncomingWebhook>(`/v1/platform/incoming-webhooks/resend/${segment(id)}/resolve`, body, options);
    },
  },

});
