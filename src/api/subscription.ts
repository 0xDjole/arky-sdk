import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type { Order } from "../types/order";
import type {
  ControlSubscriptionParams,
  Subscription,
  SubscriptionControlResult,
  SubscriptionSelf,
  FindSubscriptionCommandsParams,
  FindSubscriptionOrdersParams,
  FindSubscriptionsParams,
  GetCurrentSubscriptionParams,
  GetSubscriptionParams,
} from "../types/subscription";
import type {
  AcceptSubscriptionCalendarChangeParams,
  AcceptSubscriptionFundingChangeParams,
  SubscriptionCalendarChangeResult,
  SubscriptionCalendarOptions,
  SubscriptionCalendarReview,
  SubscriptionFundingChangeResult,
  SubscriptionFundingReview,
  GetSubscriptionCalendarOptionsParams,
  ReviewSubscriptionCalendarChangeParams,
  ReviewSubscriptionFundingChangeParams,
  AcceptSubscriptionPlanChangeParams,
  ReviewSubscriptionPlanChangeParams,
  SubscriptionPlanChangeResult,
  SubscriptionPlanChangeReview,
} from "../types/subscriptionRevision";

export const createSubscriptionApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/subscriptions`;
  return {
    get(
      params: GetSubscriptionParams,
      options?: RequestOptions,
    ): Promise<Subscription> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<Subscription>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    find(
      params: FindSubscriptionsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Subscription>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Subscription>>(
        basePath(store_id),
        { ...options, params: query },
      );
    },
    current(
      params: GetCurrentSubscriptionParams,
      options?: RequestOptions,
    ): Promise<SubscriptionSelf> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<SubscriptionSelf>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/current`,
        options,
      );
    },
    findOrders(
      params: FindSubscriptionOrdersParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Order>> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Order>>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/orders`,
        { ...options, params: query },
      );
    },
    findCommands(
      params: FindSubscriptionCommandsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<unknown>> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<unknown>>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/commands`,
        { ...options, params: query },
      );
    },
    control(
      params: ControlSubscriptionParams,
      options?: RequestOptions,
    ): Promise<SubscriptionControlResult> {
      const { store_id, command_id, request } = params;
      return apiConfig.httpClient.post<SubscriptionControlResult>(
        `${basePath(store_id)}/commands`,
        { command_id, request },
        options,
      );
    },
    calendarOptions(
      params: GetSubscriptionCalendarOptionsParams,
      options?: RequestOptions,
    ): Promise<SubscriptionCalendarOptions> {
      const { store_id, command_id, subscription_id } = params;
      return apiConfig.httpClient.post<SubscriptionCalendarOptions>(
        `${basePath(store_id)}/calendar/options`,
        { command_id, subscription_id },
        options,
      );
    },
    calendarReview(
      params: ReviewSubscriptionCalendarChangeParams,
      options?: RequestOptions,
    ): Promise<SubscriptionCalendarReview> {
      const { store_id, command_id, request } = params;
      return apiConfig.httpClient.post<SubscriptionCalendarReview>(
        `${basePath(store_id)}/calendar/review`,
        { command_id, request },
        options,
      );
    },
    calendarAccept(
      params: AcceptSubscriptionCalendarChangeParams,
      options?: RequestOptions,
    ): Promise<SubscriptionCalendarChangeResult> {
      const { store_id, command_id, request, timeline_digest } = params;
      return apiConfig.httpClient.post<SubscriptionCalendarChangeResult>(
        `${basePath(store_id)}/calendar/accept`,
        { command_id, request, timeline_digest },
        options,
      );
    },
    fundingReview(
      params: ReviewSubscriptionFundingChangeParams,
      options?: RequestOptions,
    ): Promise<SubscriptionFundingReview> {
      const { store_id, command_id, request } = params;
      return apiConfig.httpClient.post<SubscriptionFundingReview>(
        `${basePath(store_id)}/funding/review`,
        { command_id, request },
        options,
      );
    },
    planReview(
      params: ReviewSubscriptionPlanChangeParams,
      options?: RequestOptions,
    ): Promise<SubscriptionPlanChangeReview> {
      const { store_id, command_id, request } = params;
      return apiConfig.httpClient.post<SubscriptionPlanChangeReview>(
        `${basePath(store_id)}/plan/review`,
        { command_id, request },
        options,
      );
    },
    planAccept(
      params: AcceptSubscriptionPlanChangeParams,
      options?: RequestOptions,
    ): Promise<SubscriptionPlanChangeResult> {
      const { store_id, command_id, request, timeline_digest } = params;
      return apiConfig.httpClient.post<SubscriptionPlanChangeResult>(
        `${basePath(store_id)}/plan/accept`,
        { command_id, request, timeline_digest },
        options,
      );
    },
    fundingAccept(
      params: AcceptSubscriptionFundingChangeParams,
      options?: RequestOptions,
    ): Promise<SubscriptionFundingChangeResult> {
      const { store_id, command_id, request, timeline_digest } = params;
      return apiConfig.httpClient.post<SubscriptionFundingChangeResult>(
        `${basePath(store_id)}/funding/accept`,
        { command_id, request, timeline_digest },
        options,
      );
    },
  };
};
