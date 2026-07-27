import type { ApiConfig } from "../index";
import type {
  ConnectStripePaymentProviderParams,
  DeletePaymentProviderParams,
  GetPaymentProviderConnectionParams,
  ListPaymentProvidersParams,
  RefreshPaymentProvidersParams,
  RequestOptions,
  ScheduledMutationOptions,
} from "../types/api";
import type {
  PaymentProvider,
  StripePaymentProviderConnectResponse,
} from "../types";
import {
  pollScheduledResult,
  prepareScheduledMutation,
  scheduledObservationOptions,
} from "../utils/scheduledResult";

export const createPaymentProviderApi = (apiConfig: ApiConfig) => {
  const storeId = (store_id?: string) => store_id || apiConfig.storeId;

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
      options?: ScheduledMutationOptions<StripePaymentProviderConnectResponse>,
    ): Promise<StripePaymentProviderConnectResponse> {
      const targetStoreId = storeId(params.store_id);
      const path = `/v1/stores/${targetStoreId}/payment-providers/stripe/connect`;
      const mutation = prepareScheduledMutation(params, options);
      const requested = await apiConfig.httpClient.post<StripePaymentProviderConnectResponse>(
        path,
        mutation.body,
        mutation.options,
      );
      await mutation.afterResponse(requested);
      if (
        requested.provider.connection.status !== "requested" &&
        requested.provider.connection.status !== "processing"
      ) {
        return requested;
      }

      const revision = requested.provider.connection.revision;
      const observed = await pollScheduledResult(
        requested,
        (observationSignal) =>
          apiConfig.httpClient.get<StripePaymentProviderConnectResponse>(
            `/v1/stores/${targetStoreId}/payment-providers/${requested.provider.id}/connection`,
            scheduledObservationOptions(options, observationSignal),
          ),
        (response) =>
          response.provider.id === requested.provider.id &&
          response.provider.connection.revision === revision &&
          (response.provider.connection.status === "requested" ||
            response.provider.connection.status === "processing"),
        options?.signal,
      );
      if (
        observed.provider.id !== requested.provider.id ||
        observed.provider.connection.revision !== revision
      ) {
        throw new Error(
          "Stripe connection changed before its exact result could be observed",
        );
      }
      return observed;
    },

    async getConnection(
      params: GetPaymentProviderConnectionParams,
      options?: RequestOptions,
    ): Promise<StripePaymentProviderConnectResponse> {
      return apiConfig.httpClient.get<StripePaymentProviderConnectResponse>(
        `/v1/stores/${storeId(params.store_id)}/payment-providers/${params.id}/connection`,
        options,
      );
    },

    async delete(
      params: DeletePaymentProviderParams,
      options?: RequestOptions,
    ): Promise<{ deleted: boolean }> {
      return apiConfig.httpClient.delete<{ deleted: boolean }>(
        `/v1/stores/${storeId(params.store_id)}/payment-providers/${params.id}`,
        options,
      );
    },
  };
};
