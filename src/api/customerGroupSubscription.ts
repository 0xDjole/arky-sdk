import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type { Order } from "../types/order";
import type {
  CustomerGroupSubscription,
  FindCustomerGroupSubscriptionCommandsParams,
  FindCustomerGroupSubscriptionOrdersParams,
  FindCustomerGroupSubscriptionsParams,
  GetCurrentCustomerGroupSubscriptionParams,
  GetCustomerGroupSubscriptionParams,
} from "../types/customerGroupSubscription";

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
    ): Promise<CustomerGroupSubscription> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<CustomerGroupSubscription>(
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
  };
};
