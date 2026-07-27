import type { ApiConfig } from "../index";
import type {
  ConnectStripePaymentProviderParams,
  DeletePaymentProviderParams,
  GetPaymentProviderDeletionParams,
  ListPaymentProvidersParams,
  RefreshPaymentProvidersParams,
  RequestOptions,
  RetryPaymentProviderDeletionParams,
} from "../types/api";
import type {
  PaymentProvider,
  PaymentProviderDeletion,
  StripePaymentProviderConnectResponse,
} from "../types";
import {
  pollScheduledResult,
  prepareScheduledMutation,
  scheduledObservationOptions,
} from "../utils/scheduledResult";

export const createPaymentProviderApi = (apiConfig: ApiConfig) => {
  const storeId = (store_id?: string) => store_id || apiConfig.storeId;
  const deletionPath = (params: GetPaymentProviderDeletionParams) =>
    `/v1/stores/${storeId(params.store_id)}/payment-providers/${params.id}/deletion`;

  const observeDeletion = (
    params: GetPaymentProviderDeletionParams,
    options?: RequestOptions,
  ) => (observationSignal: AbortSignal) =>
    apiConfig.httpClient.get<PaymentProviderDeletion>(
      deletionPath(params),
      scheduledObservationOptions(options, observationSignal),
    );

  return {
    async list(
      params?: ListPaymentProvidersParams,
      options?: RequestOptions,
    ): Promise<PaymentProvider[]> {
      return apiConfig.httpClient.get<PaymentProvider[]>(
        `/v1/stores/${storeId(params?.store_id)}/payment-providers`,
        options,
      );
    },

    async refresh(
      params?: RefreshPaymentProvidersParams,
      options?: RequestOptions,
    ): Promise<PaymentProvider[]> {
      const targetStoreId = storeId(params?.store_id);
      return apiConfig.httpClient.post<PaymentProvider[]>(
        `/v1/stores/${targetStoreId}/payment-providers/refresh`,
        { store_id: targetStoreId },
        options,
      );
    },

    async connectStripe(
      params: ConnectStripePaymentProviderParams,
      options?: RequestOptions,
    ): Promise<StripePaymentProviderConnectResponse> {
      const path = `/v1/stores/${storeId(params.store_id)}/payment-providers/stripe/connect`;
      const mutation = prepareScheduledMutation(params, options);
      const requested = await apiConfig.httpClient.post<StripePaymentProviderConnectResponse>(
        path,
        mutation.body,
        mutation.options,
      );
      if (
        requested.provider.connection.status !== "requested" &&
        requested.provider.connection.status !== "processing"
      ) {
        return requested;
      }

      return pollScheduledResult(
        requested,
        (observationSignal) =>
          apiConfig.httpClient.post<StripePaymentProviderConnectResponse>(
            path,
            mutation.body,
            scheduledObservationOptions(options, observationSignal),
          ),
        (response) =>
          response.provider.connection.status === "requested" ||
          response.provider.connection.status === "processing",
        options?.signal,
      );
    },

    async delete(
      params: DeletePaymentProviderParams,
      options?: RequestOptions,
    ): Promise<PaymentProviderDeletion> {
      const providerPath = `/v1/stores/${storeId(params.store_id)}/payment-providers/${params.id}`;
      const requested =
        await apiConfig.httpClient.delete<PaymentProviderDeletion>(
          providerPath,
          options,
        );
      return pollScheduledResult(
        requested,
        observeDeletion(params, options),
        (result) => !result.terminal,
        options?.signal,
      );
    },

    async getDeletion(
      params: GetPaymentProviderDeletionParams,
      options?: RequestOptions,
    ): Promise<PaymentProviderDeletion> {
      return apiConfig.httpClient.get<PaymentProviderDeletion>(
        deletionPath(params),
        options,
      );
    },

    async retryDeletion(
      params: RetryPaymentProviderDeletionParams,
      options?: RequestOptions,
    ): Promise<PaymentProviderDeletion> {
      const path = `${deletionPath(params)}/retry`;
      const mutation = prepareScheduledMutation(params, options);
      const requested = await apiConfig.httpClient.post<PaymentProviderDeletion>(
        path,
        mutation.body,
        mutation.options,
      );
      return pollScheduledResult(
        requested,
        observeDeletion(params, options),
        (result) => !result.terminal,
        options?.signal,
      );
    },
  };
};
