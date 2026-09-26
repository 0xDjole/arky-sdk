import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  PaymentMethod,
  PaymentMethodCommand,
  PaymentMethodRevocation,
  FindPaymentMethodCommandsParams,
  FindPaymentMethodsParams,
  GetPaymentMethodParams,
  PaymentMethodSetupStart,
  RequestPaymentMethodSetupParams,
  RevokePaymentMethodParams,
} from "../types/paymentMethod";

export const createPaymentMethodApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/payment-methods`;

  return {
    get(
      params: GetPaymentMethodParams,
      options?: RequestOptions,
    ): Promise<PaymentMethod> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<PaymentMethod>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    find(
      params: FindPaymentMethodsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<PaymentMethod>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<PaymentMethod>>(
        basePath(store_id),
        { ...options, params: query },
      );
    },
    commands(
      params: FindPaymentMethodCommandsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<PaymentMethodCommand>> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<PaymentMethodCommand>>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/commands`,
        { ...options, params: query },
      );
    },
    revoke(
      params: RevokePaymentMethodParams,
      options?: RequestOptions,
    ): Promise<PaymentMethodRevocation> {
      const { store_id, id, ...payload } = params;
      return apiConfig.httpClient.post<PaymentMethodRevocation>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/revoke`,
        payload,
        options,
      );
    },
    requestSetup(
      params: RequestPaymentMethodSetupParams,
      options?: RequestOptions,
    ): Promise<PaymentMethod> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<PaymentMethod>(
        `${basePath(store_id)}/setup`,
        payload,
        options,
      );
    },
    startSetup(
      params: GetPaymentMethodParams,
      options?: RequestOptions,
    ): Promise<PaymentMethodSetupStart> {
      const { store_id, id } = params;
      return apiConfig.httpClient.post<PaymentMethodSetupStart>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/setup/start`,
        {},
        options,
      );
    },
    completeSetup(
      params: GetPaymentMethodParams,
      options?: RequestOptions,
    ): Promise<PaymentMethod> {
      const { store_id, id } = params;
      return apiConfig.httpClient.post<PaymentMethod>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/setup/complete`,
        {},
        options,
      );
    },
  };
};
