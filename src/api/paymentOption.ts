import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  CheckStripeSetupParams,
  ConnectStripePaymentOptionParams,
  CreateMonriPaymentOptionParams,
  CreatePaymentOptionParams,
  FindPaymentOptionsParams,
  GetPaymentOptionByKeyParams,
  GetPaymentOptionParams,
  PaymentOption,
  RefreshStripePaymentOptionParams,
  ReplaceMonriMerchantKeyParams,
  ReplaceStripeKeysParams,
  SaveStripeWebhookSecretParams,
  StripeSetup,
  UpdatePaymentOptionParams,
} from "../types/payment";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";

const collection = "payment-options";

export const createPaymentOptionApi = (apiConfig: ApiConfig) => {
  const stripePath = (storeId: string, id: string, verb: string) =>
    storePath(storeId, `${collection}/stripe/${segment(id)}/${verb}`);

  const stripeAction = (storeId: string, id: string, verb: string, body: object, options?: RequestOptions) =>
    apiConfig.httpClient.post<PaymentOption>(stripePath(storeId, id, verb), body, options);

  return {
    find(params: FindPaymentOptionsParams, options?: RequestOptions): Promise<PaginatedResponse<PaymentOption>> {
      return apiConfig.httpClient.get<PaginatedResponse<PaymentOption>>(storePath(params.store_id, collection), {
        ...options,
        params: {
          key: params.key,
          type_name: params.type_name,
          status: params.status,
          sort_field: params.sort_field,
          sort_direction: params.sort_direction,
          limit: params.limit,
          cursor: params.cursor,
        },
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
      return apiConfig.httpClient.post<PaymentOption>(storePath(params.store_id, collection), {
        id: params.id,
        key: params.key,
        blocks: params.blocks,
        type: params.type,
        status: params.status,
      }, options);
    },

    update(params: UpdatePaymentOptionParams, options?: RequestOptions): Promise<PaymentOption> {
      return apiConfig.httpClient.put<PaymentOption>(storeRecordPath(params.store_id, collection, params.id), {
        expected_updated_at: params.expected_updated_at,
        blocks: params.blocks,
        status: params.status,
        saved_card_terms: params.saved_card_terms,
      }, options);
    },

    monri: {
      create(params: CreateMonriPaymentOptionParams, options?: RequestOptions): Promise<PaymentOption> {
        requireId(params.id, "payment option");
        return apiConfig.httpClient.post<PaymentOption>(storePath(params.store_id, `${collection}/monri`), {
          id: params.id,
          key: params.key,
          blocks: params.blocks,
          status: params.status,
          environment: params.environment,
          merchant_key: params.merchant_key,
          authenticity_token: params.authenticity_token,
          saved_card_terms: params.saved_card_terms,
        }, options);
      },

      replaceMerchantKey(params: ReplaceMonriMerchantKeyParams, options?: RequestOptions): Promise<PaymentOption> {
        return apiConfig.httpClient.post<PaymentOption>(
          storePath(params.store_id, `${collection}/monri/${segment(params.id)}/replace-merchant-key`),
          { expected_updated_at: params.expected_updated_at, merchant_key: params.merchant_key },
          options,
        );
      },
    },

    stripe: {
      connect(params: ConnectStripePaymentOptionParams, options?: RequestOptions): Promise<PaymentOption> {
        requireId(params.id, "payment option");
        return apiConfig.httpClient.post<PaymentOption>(storePath(params.store_id, `${collection}/stripe`), {
          id: params.id,
          key: params.key,
          blocks: params.blocks,
          status: params.status,
          restricted_key: params.restricted_key,
          publishable_key: params.publishable_key,
          saved_card_terms: params.saved_card_terms,
        }, options);
      },

      saveWebhookSecret(params: SaveStripeWebhookSecretParams, options?: RequestOptions): Promise<PaymentOption> {
        return stripeAction(params.store_id, params.id, "webhook-secret", {
          expected_updated_at: params.expected_updated_at,
          signing_secret: params.signing_secret,
          previous_secret_expires_at: params.previous_secret_expires_at,
        }, options);
      },

      checkSetup(params: CheckStripeSetupParams, options?: RequestOptions): Promise<StripeSetup> {
        return apiConfig.httpClient.get<StripeSetup>(stripePath(params.store_id, params.id, "setup"), options);
      },

      replaceKeys(params: ReplaceStripeKeysParams, options?: RequestOptions): Promise<PaymentOption> {
        return stripeAction(params.store_id, params.id, "replace-keys", {
          expected_updated_at: params.expected_updated_at,
          restricted_key: params.restricted_key,
          publishable_key: params.publishable_key,
        }, options);
      },

      refresh(params: RefreshStripePaymentOptionParams, options?: RequestOptions): Promise<PaymentOption> {
        return stripeAction(params.store_id, params.id, "refresh", {
          expected_updated_at: params.expected_updated_at,
        }, options);
      },
    },
  };
};
