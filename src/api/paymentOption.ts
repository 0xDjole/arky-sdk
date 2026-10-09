import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  ConnectStripePaymentOptionParams,
  CreateMonriPaymentOptionParams,
  CreatePaymentOptionParams,
  CreateStripeWebhookParams,
  FindPaymentOptionsParams,
  GetPaymentOptionByKeyParams,
  GetPaymentOptionParams,
  PaymentOption,
  RefreshStripePaymentOptionParams,
  ReplaceStripeKeysParams,
  RotateStripeWebhookSecretParams,
  UpdatePaymentOptionParams,
} from "../types/payment";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";

const collection = "payment-options";

export const createPaymentOptionApi = (apiConfig: ApiConfig) => {
  const stripeAction = (storeId: string, id: string, verb: string, body: object, options?: RequestOptions) =>
    apiConfig.httpClient.post<PaymentOption>(
      storePath(storeId, `${collection}/stripe/${segment(id)}/${verb}`),
      body,
      options,
    );

  return {
    list(params: FindPaymentOptionsParams, options?: RequestOptions): Promise<PaginatedResponse<PaymentOption>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<PaymentOption>>(storePath(store_id, collection), {
        ...options,
        params: query,
      });
    },

    get(params: GetPaymentOptionParams, options?: RequestOptions): Promise<PaymentOption> {
      return apiConfig.httpClient.get<PaymentOption>(storeRecordPath(params.store_id, collection, params.id), options);
    },

    getByKey(params: GetPaymentOptionByKeyParams, options?: RequestOptions): Promise<PaymentOption> {
      return apiConfig.httpClient.get<PaymentOption>(
        storePath(params.store_id, `${collection}/key/${segment(params.key)}`),
        options,
      );
    },

    create(params: CreatePaymentOptionParams, options?: RequestOptions): Promise<PaymentOption> {
      requireId(params.id, "payment option");
      const { store_id, ...body } = params;
      return apiConfig.httpClient.post<PaymentOption>(storePath(store_id, collection), body, options);
    },

    update(params: UpdatePaymentOptionParams, options?: RequestOptions): Promise<PaymentOption> {
      const { store_id, id, ...body } = params;
      return apiConfig.httpClient.put<PaymentOption>(storeRecordPath(store_id, collection, id), body, options);
    },

    monri: {
      create(params: CreateMonriPaymentOptionParams, options?: RequestOptions): Promise<PaymentOption> {
        requireId(params.id, "payment option");
        const { store_id, ...body } = params;
        return apiConfig.httpClient.post<PaymentOption>(storePath(store_id, `${collection}/monri`), body, options);
      },
    },

    stripe: {
      connect(params: ConnectStripePaymentOptionParams, options?: RequestOptions): Promise<PaymentOption> {
        requireId(params.id, "payment option");
        const { store_id, ...body } = params;
        return apiConfig.httpClient.post<PaymentOption>(storePath(store_id, `${collection}/stripe`), body, options);
      },

      createWebhook(params: CreateStripeWebhookParams, options?: RequestOptions): Promise<PaymentOption> {
        return stripeAction(params.store_id, params.id, "create-webhook", {
          expected_updated_at: params.expected_updated_at,
        }, options);
      },

      rotateWebhookSecret(params: RotateStripeWebhookSecretParams, options?: RequestOptions): Promise<PaymentOption> {
        const { store_id, id, ...body } = params;
        return stripeAction(store_id, id, "rotate-webhook-secret", body, options);
      },

      replaceKeys(params: ReplaceStripeKeysParams, options?: RequestOptions): Promise<PaymentOption> {
        const { store_id, id, ...body } = params;
        return stripeAction(store_id, id, "replace-keys", body, options);
      },

      refresh(params: RefreshStripePaymentOptionParams, options?: RequestOptions): Promise<PaymentOption> {
        return stripeAction(params.store_id, params.id, "refresh", {
          expected_updated_at: params.expected_updated_at,
        }, options);
      },
    },
  };
};
