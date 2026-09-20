import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  CustomerPaymentMethod,
  CustomerPaymentMethodCommand,
  CustomerPaymentMethodRevocation,
  FindCustomerPaymentMethodCommandsParams,
  FindCustomerPaymentMethodsParams,
  GetCustomerPaymentMethodParams,
  RevokeCustomerPaymentMethodParams,
} from "../types/customerPaymentMethod";

export const createCustomerPaymentMethodApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/customer-payment-methods`;

  return {
    get(
      params: GetCustomerPaymentMethodParams,
      options?: RequestOptions,
    ): Promise<CustomerPaymentMethod> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<CustomerPaymentMethod>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    find(
      params: FindCustomerPaymentMethodsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<CustomerPaymentMethod>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<CustomerPaymentMethod>>(
        basePath(store_id),
        { ...options, params: query },
      );
    },
    commands(
      params: FindCustomerPaymentMethodCommandsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<CustomerPaymentMethodCommand>> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<CustomerPaymentMethodCommand>>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/commands`,
        { ...options, params: query },
      );
    },
    revoke(
      params: RevokeCustomerPaymentMethodParams,
      options?: RequestOptions,
    ): Promise<CustomerPaymentMethodRevocation> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.post<CustomerPaymentMethodRevocation>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/revoke`,
        payload,
        options,
      );
    },
  };
};
