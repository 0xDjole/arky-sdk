import type { ApiConfig } from "../services/clientTypes";
import type { HttpClient } from "../types/httpClient";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  CancelPaymentMethodSetupParams,
  FindPaymentMethodsParams,
  GetPaymentMethodConsentTextParams,
  GetPaymentMethodParams,
  PaymentMethod,
  PaymentMethodConsentText,
  PaymentMethodSetupStart,
  RequestPaymentMethodSetupParams,
  RevokePaymentMethodParams,
  StorefrontCancelPaymentMethodSetupParams,
  StorefrontCurrentPaymentMethodConsentTextParams,
  StorefrontFindPaymentMethodsParams,
  StorefrontGetPaymentMethodConsentTextParams,
  StorefrontGetPaymentMethodParams,
  StorefrontRequestPaymentMethodSetupParams,
  StorefrontRevokePaymentMethodParams,
} from "../types/payment";
import { requireId } from "../utils/ids";
import { segment, storePath } from "./paths";

function paymentMethodRoutes(httpClient: HttpClient, base: string) {
  const methodPath = (id: string) => `${base}/${segment(id)}`;
  return {
    find(query: object, options?: RequestOptions): Promise<PaginatedResponse<PaymentMethod>> {
      return httpClient.get<PaginatedResponse<PaymentMethod>>(base, { ...options, params: query });
    },
    get(id: string, options?: RequestOptions): Promise<PaymentMethod> {
      return httpClient.get<PaymentMethod>(methodPath(id), options);
    },
    requestSetup(body: { id: string }, options?: RequestOptions): Promise<PaymentMethod> {
      requireId(body.id, "payment method");
      return httpClient.post<PaymentMethod>(`${base}/setup`, body, options);
    },
    startSetup(id: string, options?: RequestOptions): Promise<PaymentMethodSetupStart> {
      return httpClient.post<PaymentMethodSetupStart>(`${methodPath(id)}/setup/start`, undefined, options);
    },
    completeSetup(id: string, options?: RequestOptions): Promise<PaymentMethod> {
      return httpClient.post<PaymentMethod>(`${methodPath(id)}/setup/complete`, undefined, options);
    },
    cancelSetup(id: string, expectedUpdatedAt: number, options?: RequestOptions): Promise<PaymentMethod> {
      return httpClient.post<PaymentMethod>(
        `${methodPath(id)}/setup/cancel`,
        { expected_updated_at: expectedUpdatedAt },
        options,
      );
    },
    revoke(id: string, expectedUpdatedAt: number, options?: RequestOptions): Promise<PaymentMethod> {
      return httpClient.post<PaymentMethod>(`${methodPath(id)}/revoke`, { expected_updated_at: expectedUpdatedAt }, options);
    },
    consentText(termsVersion: string, options?: RequestOptions): Promise<PaymentMethodConsentText> {
      return httpClient.get<PaymentMethodConsentText>(`${base}/consent-texts/${segment(termsVersion)}`, options);
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
    consentText(params: GetPaymentMethodConsentTextParams, options?: RequestOptions): Promise<PaymentMethodConsentText> {
      return routes(params.store_id).consentText(params.terms_version, options);
    },
  };
};

export const createStorefrontPaymentMethodApi = (httpClient: HttpClient) => {
  const routes = paymentMethodRoutes(httpClient, "/v1/storefront/payment-methods");
  return {
    find(params: StorefrontFindPaymentMethodsParams = {}, options?: RequestOptions): Promise<PaginatedResponse<PaymentMethod>> {
      return routes.find(params, options);
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
    consentText(
      params: StorefrontGetPaymentMethodConsentTextParams,
      options?: RequestOptions,
    ): Promise<PaymentMethodConsentText> {
      return routes.consentText(params.terms_version, options);
    },
    currentConsentText(
      params: StorefrontCurrentPaymentMethodConsentTextParams,
      options?: RequestOptions,
    ): Promise<PaymentMethodConsentText> {
      return httpClient.get<PaymentMethodConsentText>("/v1/storefront/payment-methods/consent-texts", {
        ...options,
        params: { language: params.language },
      });
    },
  };
};
