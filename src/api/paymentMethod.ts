import type { ApiConfig } from "../services/clientTypes";
import type { HttpClient } from "../types/httpClient";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  CancelPaymentMethodSetupParams,
  FindPaymentMethodsParams,
  GetPaymentMethodParams,
  PaymentMethod,
  PaymentMethodSetupStart,
  RequestPaymentMethodSetupParams,
  RevokePaymentMethodParams,
  StorefrontCancelPaymentMethodSetupParams,
  StorefrontFindPaymentMethodsParams,
  StorefrontGetPaymentMethodParams,
  StorefrontRequestPaymentMethodSetupParams,
  StorefrontRevokePaymentMethodParams,
} from "../types/payment";
import type { EpochMilliseconds } from "../types/time";
import { requireId } from "../utils/ids";
import { segment, storePath } from "./paths";

function paymentMethodRoutes(httpClient: HttpClient, base: string) {
  const methodPath = (id: string) => `${base}/${segment(id)}`;
  return {
    find(query: Omit<FindPaymentMethodsParams, "store_id">, options?: RequestOptions): Promise<PaginatedResponse<PaymentMethod>> {
      return httpClient.get<PaginatedResponse<PaymentMethod>>(base, {
        ...options,
        params: {
          customer_id: query.customer_id,
          company_id: query.company_id,
          company_location_id: query.company_location_id,
          payment_option_id: query.payment_option_id,
          limit: query.limit,
          cursor: query.cursor,
        },
      });
    },
    get(id: string, options?: RequestOptions): Promise<PaymentMethod> {
      return httpClient.get<PaymentMethod>(methodPath(id), options);
    },
    requestSetup(body: Omit<RequestPaymentMethodSetupParams, "store_id">, options?: RequestOptions): Promise<PaymentMethod> {
      requireId(body.id, "payment method");
      return httpClient.post<PaymentMethod>(`${base}/setup`, {
        id: body.id,
        owner: body.owner,
        payment_option_id: body.payment_option_id,
        language: body.language,
        terms: body.terms,
        accept_storage_and_off_session_use: body.accept_storage_and_off_session_use,
      }, options);
    },
    startSetup(id: string, options?: RequestOptions): Promise<PaymentMethodSetupStart> {
      return httpClient.post<PaymentMethodSetupStart>(`${methodPath(id)}/setup/start`, undefined, options);
    },
    completeSetup(id: string, options?: RequestOptions): Promise<PaymentMethod> {
      return httpClient.post<PaymentMethod>(`${methodPath(id)}/setup/complete`, undefined, options);
    },
    cancelSetup(id: string, expectedUpdatedAt: EpochMilliseconds, options?: RequestOptions): Promise<PaymentMethod> {
      return httpClient.post<PaymentMethod>(
        `${methodPath(id)}/setup/cancel`,
        { expected_updated_at: expectedUpdatedAt },
        options,
      );
    },
    revoke(id: string, expectedUpdatedAt: EpochMilliseconds, options?: RequestOptions): Promise<PaymentMethod> {
      return httpClient.post<PaymentMethod>(`${methodPath(id)}/revoke`, { expected_updated_at: expectedUpdatedAt }, options);
    },
  };
}

export const createPaymentMethodApi = (apiConfig: ApiConfig) => {
  const routes = (storeId: string) => paymentMethodRoutes(apiConfig.httpClient, storePath(storeId, "payment-methods"));
  return {
    find(params: FindPaymentMethodsParams, options?: RequestOptions): Promise<PaginatedResponse<PaymentMethod>> {
      const { store_id, ...query } = params;
      return routes(store_id).find(query, options);
    },
    get(params: GetPaymentMethodParams, options?: RequestOptions): Promise<PaymentMethod> {
      return routes(params.store_id).get(params.id, options);
    },
    requestSetup(params: RequestPaymentMethodSetupParams, options?: RequestOptions): Promise<PaymentMethod> {
      const { store_id, ...body } = params;
      return routes(store_id).requestSetup(body, options);
    },
    startSetup(params: GetPaymentMethodParams, options?: RequestOptions): Promise<PaymentMethodSetupStart> {
      return routes(params.store_id).startSetup(params.id, options);
    },
    completeSetup(params: GetPaymentMethodParams, options?: RequestOptions): Promise<PaymentMethod> {
      return routes(params.store_id).completeSetup(params.id, options);
    },
    cancelSetup(params: CancelPaymentMethodSetupParams, options?: RequestOptions): Promise<PaymentMethod> {
      return routes(params.store_id).cancelSetup(params.id, params.expected_updated_at, options);
    },
    revoke(params: RevokePaymentMethodParams, options?: RequestOptions): Promise<PaymentMethod> {
      return routes(params.store_id).revoke(params.id, params.expected_updated_at, options);
    },
  };
};

export const createStorefrontPaymentMethodApi = (httpClient: HttpClient) => {
  const routes = paymentMethodRoutes(httpClient, "/v1/storefront/payment-methods");
  return {
    find(params: StorefrontFindPaymentMethodsParams = {}, options?: RequestOptions): Promise<PaginatedResponse<PaymentMethod>> {
      return routes.find({
        customer_id: params.customer_id,
        company_id: params.company_id,
        company_location_id: params.company_location_id,
        limit: params.limit,
        cursor: params.cursor,
      }, options);
    },
    get(params: StorefrontGetPaymentMethodParams, options?: RequestOptions): Promise<PaymentMethod> {
      return routes.get(params.id, options);
    },
    requestSetup(params: StorefrontRequestPaymentMethodSetupParams, options?: RequestOptions): Promise<PaymentMethod> {
      return routes.requestSetup(params, options);
    },
    startSetup(params: StorefrontGetPaymentMethodParams, options?: RequestOptions): Promise<PaymentMethodSetupStart> {
      return routes.startSetup(params.id, options);
    },
    completeSetup(params: StorefrontGetPaymentMethodParams, options?: RequestOptions): Promise<PaymentMethod> {
      return routes.completeSetup(params.id, options);
    },
    cancelSetup(params: StorefrontCancelPaymentMethodSetupParams, options?: RequestOptions): Promise<PaymentMethod> {
      return routes.cancelSetup(params.id, params.expected_updated_at, options);
    },
    revoke(params: StorefrontRevokePaymentMethodParams, options?: RequestOptions): Promise<PaymentMethod> {
      return routes.revoke(params.id, params.expected_updated_at, options);
    },
  };
};
