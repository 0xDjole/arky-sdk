import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  Account,
  AddPlatformAccountParams,
  DeletePlatformAccountParams,
  FindPlatformAccountsParams,
  ListedAccount,
  ResetAccountSecondFactorParams,
} from "../types/account";
import type { WebhookEventMetadata } from "../types/webhook";
import type {
  FindStripeBillingEventsParams,
  FindResendEventsParams,
  FindNetworkSmsPostsParams,
  ResolveResendEventParams,
  ResolveNetworkSmsPostParams,
  NetworkResendIncomingWebhook,
  NetworkTwilioSmsIncomingWebhook,
  StripeBillingIncomingWebhook,
  ResolveStripeBillingEventParams,
} from "../types/payment";
import type { FindWaitingStorePlanChargesParams, SettleStorePlanChargeParams, StorePlanCharge } from "../types/store";
import { requireId } from "../utils/ids";
import { segment } from "./paths";

export const createPlatformApi = (apiConfig: ApiConfig) => ({
  findCurrencies(options?: RequestOptions): Promise<string[]> {
    return apiConfig.httpClient.get<string[]>("/v1/platform/currencies", options);
  },

  findWebhookEvents(options?: RequestOptions): Promise<WebhookEventMetadata[]> {
    return apiConfig.httpClient.get<WebhookEventMetadata[]>("/v1/platform/events", options);
  },

  account: {
    find(params: FindPlatformAccountsParams = {}, options?: RequestOptions): Promise<PaginatedResponse<ListedAccount>> {
      return apiConfig.httpClient.get<PaginatedResponse<ListedAccount>>("/v1/accounts", {
        ...options, params: { ...params, access: "platform" },
      });
    },
    getMe(options?: RequestOptions): Promise<Account> {
      return apiConfig.httpClient.get<Account>("/v1/accounts/me/platform-admin", options);
    },
    add(params: AddPlatformAccountParams, options?: RequestOptions): Promise<ListedAccount> {
      return apiConfig.httpClient.post<ListedAccount>(
        "/v1/accounts",
        { id: requireId(params.id, "account"), email: params.email },
        options,
      );
    },
    resetSecondFactor(params: ResetAccountSecondFactorParams, options?: RequestOptions): Promise<ListedAccount> {
      return apiConfig.httpClient.post<ListedAccount>(
        `/v1/accounts/${segment(requireId(params.account_id, "account"))}/second-factor/reset`,
        undefined,
        options,
      );
    },
    delete(params: DeletePlatformAccountParams, options?: RequestOptions): Promise<ListedAccount> {
      return apiConfig.httpClient.delete<ListedAccount>(`/v1/accounts/${segment(requireId(params.account_id, "account"))}`, options);
    },
  },

  stripeBillingEvent: {
    find(params: FindStripeBillingEventsParams, options?: RequestOptions): Promise<PaginatedResponse<StripeBillingIncomingWebhook>> {
      return apiConfig.httpClient.get<PaginatedResponse<StripeBillingIncomingWebhook>>(
        "/v1/platform/incoming-webhooks/stripe-billing",
        { ...options, params },
      );
    },

    resolve(params: ResolveStripeBillingEventParams, options?: RequestOptions): Promise<StripeBillingIncomingWebhook> {
      return apiConfig.httpClient.post<StripeBillingIncomingWebhook>(
        `/v1/platform/incoming-webhooks/stripe-billing/${segment(params.id)}/resolve`,
        {
          network_id: params.network_id,
          network_provider_id: params.network_provider_id,
          expected_updated_at: params.expected_updated_at,
          resolution: params.resolution,
        },
        options,
      );
    },
  },
  storePlanCharge: {
    find(params: FindWaitingStorePlanChargesParams, options?: RequestOptions): Promise<PaginatedResponse<StorePlanCharge>> {
      return apiConfig.httpClient.get<PaginatedResponse<StorePlanCharge>>("/v1/platform/store-plan-charges", { ...options, params });
    },

    settle(params: SettleStorePlanChargeParams, options?: RequestOptions): Promise<StorePlanCharge> {
      return apiConfig.httpClient.post<StorePlanCharge>(
        `/v1/platform/store-plan-charges/${segment(params.id)}/settle`,
        { store_id: params.store_id, expected_updated_at: params.expected_updated_at, outcome: params.outcome },
        options,
      );
    },
  },
  resendEvent: {
    find(params: FindResendEventsParams, options?: RequestOptions): Promise<PaginatedResponse<NetworkResendIncomingWebhook>> {
      return apiConfig.httpClient.get<PaginatedResponse<NetworkResendIncomingWebhook>>("/v1/platform/incoming-webhooks/resend", { ...options, params });
    },
    resolve(params: ResolveResendEventParams, options?: RequestOptions): Promise<NetworkResendIncomingWebhook> {
      return apiConfig.httpClient.post<NetworkResendIncomingWebhook>(`/v1/platform/incoming-webhooks/resend/${segment(params.id)}/resolve`, {
        network_id: params.network_id,
        network_provider_id: params.network_provider_id,
        expected_updated_at: params.expected_updated_at,
        resolution: params.resolution,
        reason: params.reason,
      }, options);
    },
  },
  networkSmsPost: {
    find(params: FindNetworkSmsPostsParams, options?: RequestOptions): Promise<PaginatedResponse<NetworkTwilioSmsIncomingWebhook>> {
      return apiConfig.httpClient.get<PaginatedResponse<NetworkTwilioSmsIncomingWebhook>>("/v1/platform/incoming-webhooks/twilio", {
        ...options,
        params: {
          network_id: params.network_id,
          network_provider_id: params.network_provider_id,
          status: params.status,
          limit: params.limit,
          cursor: params.cursor,
        },
      });
    },
    resolve(params: ResolveNetworkSmsPostParams, options?: RequestOptions): Promise<NetworkTwilioSmsIncomingWebhook> {
      return apiConfig.httpClient.post<NetworkTwilioSmsIncomingWebhook>(`/v1/platform/incoming-webhooks/twilio/${segment(params.id)}/resolve`, {
        network_id: params.network_id,
        network_provider_id: params.network_provider_id,
        expected_updated_at: params.expected_updated_at,
        resolution: params.resolution,
        reason: params.reason,
      }, options);
    },
  },

});
