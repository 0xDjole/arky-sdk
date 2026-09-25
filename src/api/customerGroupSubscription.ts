import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type { Order } from "../types/order";
import type {
  ControlCustomerGroupSubscriptionParams,
  CustomerGroupSubscription,
  CustomerGroupSubscriptionControlResult,
  CustomerGroupSubscriptionSelf,
  FindCustomerGroupSubscriptionCommandsParams,
  FindCustomerGroupSubscriptionOrdersParams,
  FindCustomerGroupSubscriptionsParams,
  GetCurrentCustomerGroupSubscriptionParams,
  GetCustomerGroupSubscriptionParams,
} from "../types/customerGroupSubscription";
import type {
  AcceptCustomerGroupCalendarChangeParams,
  AcceptCustomerGroupFundingChangeParams,
  CustomerGroupCalendarChangeResult,
  CustomerGroupCalendarOptions,
  CustomerGroupCalendarReview,
  CustomerGroupFundingChangeResult,
  CustomerGroupFundingReview,
  GetCustomerGroupCalendarOptionsParams,
  ReviewCustomerGroupCalendarChangeParams,
  ReviewCustomerGroupFundingChangeParams,
} from "../types/customerGroupSubscriptionRevision";

export const createCustomerGroupSubscriptionApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/customer-group-subscriptions`;
  return {
    get(
      params: GetCustomerGroupSubscriptionParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupSubscription> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<CustomerGroupSubscription>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    find(
      params: FindCustomerGroupSubscriptionsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<CustomerGroupSubscription>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<CustomerGroupSubscription>>(
        basePath(store_id),
        { ...options, params: query },
      );
    },
    current(
      params: GetCurrentCustomerGroupSubscriptionParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupSubscriptionSelf> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<CustomerGroupSubscriptionSelf>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/current`,
        options,
      );
    },
    findOrders(
      params: FindCustomerGroupSubscriptionOrdersParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Order>> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Order>>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/orders`,
        { ...options, params: query },
      );
    },
    findCommands(
      params: FindCustomerGroupSubscriptionCommandsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<unknown>> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<unknown>>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/commands`,
        { ...options, params: query },
      );
    },
    control(
      params: ControlCustomerGroupSubscriptionParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupSubscriptionControlResult> {
      const { store_id, command_id, request } = params;
      return apiConfig.httpClient.post<CustomerGroupSubscriptionControlResult>(
        `${basePath(store_id)}/commands`,
        { command_id, request },
        options,
      );
    },
    calendarOptions(
      params: GetCustomerGroupCalendarOptionsParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupCalendarOptions> {
      const { store_id, command_id, customer_group_subscription_id } = params;
      return apiConfig.httpClient.post<CustomerGroupCalendarOptions>(
        `${basePath(store_id)}/calendar/options`,
        { command_id, customer_group_subscription_id },
        options,
      );
    },
    calendarReview(
      params: ReviewCustomerGroupCalendarChangeParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupCalendarReview> {
      const { store_id, command_id, request } = params;
      return apiConfig.httpClient.post<CustomerGroupCalendarReview>(
        `${basePath(store_id)}/calendar/review`,
        { command_id, request },
        options,
      );
    },
    calendarAccept(
      params: AcceptCustomerGroupCalendarChangeParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupCalendarChangeResult> {
      const { store_id, command_id, request, timeline_digest } = params;
      return apiConfig.httpClient.post<CustomerGroupCalendarChangeResult>(
        `${basePath(store_id)}/calendar/accept`,
        { command_id, request, timeline_digest },
        options,
      );
    },
    fundingReview(
      params: ReviewCustomerGroupFundingChangeParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupFundingReview> {
      const { store_id, command_id, request } = params;
      return apiConfig.httpClient.post<CustomerGroupFundingReview>(
        `${basePath(store_id)}/funding/review`,
        { command_id, request },
        options,
      );
    },
    fundingAccept(
      params: AcceptCustomerGroupFundingChangeParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupFundingChangeResult> {
      const { store_id, command_id, request, timeline_digest } = params;
      return apiConfig.httpClient.post<CustomerGroupFundingChangeResult>(
        `${basePath(store_id)}/funding/accept`,
        { command_id, request, timeline_digest },
        options,
      );
    },
  };
};
