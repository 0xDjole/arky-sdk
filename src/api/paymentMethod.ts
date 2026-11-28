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
  StorefrontPaymentMethod,
  StorefrontPaymentMethodSetupStart,
  StorefrontRequestPaymentMethodSetupParams,
  StorefrontRevokePaymentMethodParams,
} from "../types/payment";
import type { EpochMilliseconds } from "../types/time";
import { requireId } from "../utils/ids";
import { segment, tenantPath } from "./paths";

function paymentMethodRoutes<Method, SetupStart>(httpClient: HttpClient, base: string) {
  const methodPath = (id: string) => `${base}/${segment(id)}`;
  return {
    find(query: Omit<FindPaymentMethodsParams, "tenant_id">, options?: RequestOptions): Promise<PaginatedResponse<Method>> {
      return httpClient.get<PaginatedResponse<Method>>(base, {
        ...options,
        params: {
          user_id: query.user_id,
          company_id: query.company_id,
          company_location_id: query.company_location_id,
          payment_option_id: query.payment_option_id,
          limit: query.limit,
          cursor: query.cursor,
        },
      });
    },
    get(id: string, options?: RequestOptions): Promise<Method> {
      return httpClient.get<Method>(methodPath(id), options);
    },
    requestSetup(body: Omit<RequestPaymentMethodSetupParams, "tenant_id">, options?: RequestOptions): Promise<Method> {
      requireId(body.id, "payment method");
      return httpClient.post<Method>(`${base}/setup`, {
        id: body.id,
        owner: body.owner,
        payment_option_id: body.payment_option_id,
        language: body.language,
        terms: body.terms,
        accept_storage_and_off_session_use: body.accept_storage_and_off_session_use,
      }, options);
    },
    startSetup(id: string, options?: RequestOptions): Promise<SetupStart> {
      return httpClient.post<SetupStart>(`${methodPath(id)}/setup/start`, undefined, options);
    },
    completeSetup(id: string, options?: RequestOptions): Promise<Method> {
      return httpClient.post<Method>(`${methodPath(id)}/setup/complete`, undefined, options);
    },
    cancelSetup(id: string, expectedUpdatedAt: EpochMilliseconds, options?: RequestOptions): Promise<Method> {
      return httpClient.post<Method>(
        `${methodPath(id)}/setup/cancel`,
        { expected_updated_at: expectedUpdatedAt },
        options,
      );
    },
    revoke(id: string, expectedUpdatedAt: EpochMilliseconds, options?: RequestOptions): Promise<Method> {
      return httpClient.post<Method>(`${methodPath(id)}/revoke`, { expected_updated_at: expectedUpdatedAt }, options);
    },
  };
}

export const createPaymentMethodApi = (apiConfig: ApiConfig) => {
  const routes = (tenantId: string) =>
    paymentMethodRoutes<PaymentMethod, PaymentMethodSetupStart>(apiConfig.httpClient, tenantPath(tenantId, "payment-methods"));
  return {
    find(params: FindPaymentMethodsParams, options?: RequestOptions): Promise<PaginatedResponse<PaymentMethod>> {
      const { tenant_id, ...query } = params;
      return routes(tenant_id).find(query, options);
    },
    get(params: GetPaymentMethodParams, options?: RequestOptions): Promise<PaymentMethod> {
      return routes(params.tenant_id).get(params.id, options);
    },
    requestSetup(params: RequestPaymentMethodSetupParams, options?: RequestOptions): Promise<PaymentMethod> {
      const { tenant_id, ...body } = params;
      return routes(tenant_id).requestSetup(body, options);
    },
    startSetup(params: GetPaymentMethodParams, options?: RequestOptions): Promise<PaymentMethodSetupStart> {
      return routes(params.tenant_id).startSetup(params.id, options);
    },
    completeSetup(params: GetPaymentMethodParams, options?: RequestOptions): Promise<PaymentMethod> {
      return routes(params.tenant_id).completeSetup(params.id, options);
    },
    cancelSetup(params: CancelPaymentMethodSetupParams, options?: RequestOptions): Promise<PaymentMethod> {
      return routes(params.tenant_id).cancelSetup(params.id, params.expected_updated_at, options);
    },
    revoke(params: RevokePaymentMethodParams, options?: RequestOptions): Promise<PaymentMethod> {
      return routes(params.tenant_id).revoke(params.id, params.expected_updated_at, options);
    },
  };
};

export const createStorefrontPaymentMethodApi = (httpClient: HttpClient) => {
  const routes = paymentMethodRoutes<StorefrontPaymentMethod, StorefrontPaymentMethodSetupStart>(
    httpClient,
    "/v1/storefront/payment-methods",
  );
  return {
    find(params: StorefrontFindPaymentMethodsParams = {}, options?: RequestOptions): Promise<PaginatedResponse<StorefrontPaymentMethod>> {
      return routes.find({
        user_id: params.user_id,
        company_id: params.company_id,
        company_location_id: params.company_location_id,
        limit: params.limit,
        cursor: params.cursor,
      }, options);
    },
    get(params: StorefrontGetPaymentMethodParams, options?: RequestOptions): Promise<StorefrontPaymentMethod> {
      return routes.get(params.id, options);
    },
    requestSetup(params: StorefrontRequestPaymentMethodSetupParams, options?: RequestOptions): Promise<StorefrontPaymentMethod> {
      return routes.requestSetup(params, options);
    },
    startSetup(params: StorefrontGetPaymentMethodParams, options?: RequestOptions): Promise<StorefrontPaymentMethodSetupStart> {
      return routes.startSetup(params.id, options);
    },
    completeSetup(params: StorefrontGetPaymentMethodParams, options?: RequestOptions): Promise<StorefrontPaymentMethod> {
      return routes.completeSetup(params.id, options);
    },
    cancelSetup(params: StorefrontCancelPaymentMethodSetupParams, options?: RequestOptions): Promise<StorefrontPaymentMethod> {
      return routes.cancelSetup(params.id, params.expected_updated_at, options);
    },
    revoke(params: StorefrontRevokePaymentMethodParams, options?: RequestOptions): Promise<StorefrontPaymentMethod> {
      return routes.revoke(params.id, params.expected_updated_at, options);
    },
  };
};
