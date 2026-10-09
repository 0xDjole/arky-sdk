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
  ProviderEvent,
  ResolveStripeBillingEventParams,
} from "../types/payment";
import type { StorePlan } from "../types/store";
import { requireId } from "../utils/ids";
import { segment } from "./paths";

export const createPlatformApi = (apiConfig: ApiConfig) => ({
  getCurrencies(options?: RequestOptions): Promise<string[]> {
    return apiConfig.httpClient.get<string[]>("/v1/platform/currencies", options);
  },

  getWebhookEvents(options?: RequestOptions): Promise<WebhookEventMetadata[]> {
    return apiConfig.httpClient.get<WebhookEventMetadata[]>("/v1/platform/events", options);
  },

  getStorePlans(options?: RequestOptions): Promise<PaginatedResponse<StorePlan>> {
    return apiConfig.httpClient.get<PaginatedResponse<StorePlan>>("/v1/stores/plans", options);
  },

  administrator: {
    list(
      params: FindPlatformAdministratorsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<PlatformAdministrator>> {
      return apiConfig.httpClient.get<PaginatedResponse<PlatformAdministrator>>("/v1/platform/administrators", {
        ...options,
        params,
      });
    },

    me(options?: RequestOptions): Promise<PlatformAdministrator> {
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
    find(params: FindStripeBillingEventsParams, options?: RequestOptions): Promise<PaginatedResponse<ProviderEvent>> {
      return apiConfig.httpClient.get<PaginatedResponse<ProviderEvent>>(
        "/v1/platform/provider-events/stripe-billing",
        { ...options, params },
      );
    },

    resolve(params: ResolveStripeBillingEventParams, options?: RequestOptions): Promise<ProviderEvent> {
      return apiConfig.httpClient.post<ProviderEvent>(
        `/v1/platform/provider-events/stripe-billing/${segment(params.id)}/resolve`,
        { expected_updated_at: params.expected_updated_at, resolution: params.resolution },
        options,
      );
    },
  },
});
