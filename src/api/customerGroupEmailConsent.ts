import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  ConfirmCustomerGroupEmailsParams,
  CustomerGroupConfirmationHistoryEntry,
  CustomerGroupConsentEvent,
  CustomerGroupEmailConsent,
  FindCustomerGroupEmailConsentHistoryParams,
  FindCustomerGroupEmailConsentsParams,
  GetCustomerGroupEmailConsentParams,
  ImportCustomerGroupEmailConsentsParams,
  ImportCustomerGroupEmailConsentsResult,
  RecordCustomerGroupEmailConsentParams,
  ResendCustomerGroupConfirmationParams,
  SubscribeCustomerGroupEmailsParams,
  UnsubscribeCustomerGroupEmailsParams,
} from "../types/customerGroupEmailConsent";

export const createCustomerGroupEmailConsentApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/customer-group-email-consents`;

  return {
    subscribe(
      params: SubscribeCustomerGroupEmailsParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupEmailConsent> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<CustomerGroupEmailConsent>(
        `${basePath(store_id)}/subscribe`,
        payload,
        options,
      );
    },
    unsubscribe(
      params: UnsubscribeCustomerGroupEmailsParams,
      options?: RequestOptions,
    ): Promise<boolean> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<boolean>(
        `${basePath(store_id)}/unsubscribe`,
        payload,
        options,
      );
    },
    confirm(
      params: ConfirmCustomerGroupEmailsParams,
      options?: RequestOptions,
    ): Promise<boolean> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<boolean>(
        `${basePath(store_id)}/confirm`,
        payload,
        options,
      );
    },
    resendConfirmation(
      params: ResendCustomerGroupConfirmationParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupEmailConsent> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<CustomerGroupEmailConsent>(
        `${basePath(store_id)}/resend-confirmation`,
        payload,
        options,
      );
    },
    record(
      params: RecordCustomerGroupEmailConsentParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupEmailConsent> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<CustomerGroupEmailConsent>(
        basePath(store_id),
        payload,
        options,
      );
    },
    import(
      params: ImportCustomerGroupEmailConsentsParams,
      options?: RequestOptions,
    ): Promise<ImportCustomerGroupEmailConsentsResult> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<ImportCustomerGroupEmailConsentsResult>(
        `${basePath(store_id)}/import`,
        payload,
        options,
      );
    },
    get(
      params: GetCustomerGroupEmailConsentParams,
      options?: RequestOptions,
    ): Promise<CustomerGroupEmailConsent> {
      const { store_id, id } = params;
      return apiConfig.httpClient.get<CustomerGroupEmailConsent>(
        `${basePath(store_id)}/${encodeURIComponent(id)}`,
        options,
      );
    },
    find(
      params: FindCustomerGroupEmailConsentsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<CustomerGroupEmailConsent>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<CustomerGroupEmailConsent>>(
        basePath(store_id),
        { ...options, params: query },
      );
    },
    decisions(
      params: FindCustomerGroupEmailConsentHistoryParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<CustomerGroupConsentEvent>> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<CustomerGroupConsentEvent>>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/decisions`,
        { ...options, params: query },
      );
    },
    confirmations(
      params: FindCustomerGroupEmailConsentHistoryParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<CustomerGroupConfirmationHistoryEntry>> {
      const { store_id, id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<CustomerGroupConfirmationHistoryEntry>>(
        `${basePath(store_id)}/${encodeURIComponent(id)}/confirmations`,
        { ...options, params: query },
      );
    },
  };
};
