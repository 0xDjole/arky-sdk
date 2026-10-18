import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  AddPlatformAdministratorParams,
  FindPlatformAdministratorsParams,
  PlatformAdministrator,
  RemovePlatformAdministratorParams,
} from "../types/account";
import type { WebhookEventMetadata } from "../types/webhook";
import type {
  FindStripeBillingEventsParams,
  FindResendEventsParams,
  ResolveResendEventParams,
  IncomingWebhook,
  ResolveStripeBillingEventParams,
} from "../types/payment";
import type { StorePlan } from "../types/store";
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

  findStorePlans(options?: RequestOptions): Promise<PaginatedResponse<StorePlan>> {
    return apiConfig.httpClient.get<PaginatedResponse<StorePlan>>("/v1/stores/plans", options);
  },

  administrator: {
    find(
      params: FindPlatformAdministratorsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<PlatformAdministrator>> {
      return apiConfig.httpClient.get<PaginatedResponse<PlatformAdministrator>>("/v1/platform/administrators", {
        ...options,
        params,
      });
    },

    getMe(options?: RequestOptions): Promise<PlatformAdministrator> {
      return apiConfig.httpClient.get<PlatformAdministrator>("/v1/platform/administrators/me", options);
    },

    add(params: AddPlatformAdministratorParams, options?: RequestOptions): Promise<PlatformAdministrator> {
      requireId(params.id, "platform administrator");
      return apiConfig.httpClient.post<PlatformAdministrator>(
        "/v1/platform/administrators",
        { id: params.id, account_id: params.account_id },
        options,
      );
    },

    remove(params: RemovePlatformAdministratorParams, options?: RequestOptions): Promise<boolean> {
      return apiConfig.httpClient.delete<boolean>(`/v1/platform/administrators/${segment(params.id)}`, options);
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
        { expected_updated_at: params.expected_updated_at, resolution: params.resolution },
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
