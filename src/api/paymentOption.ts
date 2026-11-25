import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  CreateCardPaymentOptionParams,
  CreatePaymentOptionParams,
  FindPaymentOptionsParams,
  GetPaymentOptionByKeyParams,
  GetPaymentOptionParams,
  PaymentOption,
  UpdatePaymentOptionParams,
} from "../types/payment";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";

const collection = "payment-options";

export const createPaymentOptionApi = (apiConfig: ApiConfig) => {
  const createCard = (route: string, params: CreateCardPaymentOptionParams, options?: RequestOptions) => {
    requireId(params.id, "payment option");
    return apiConfig.httpClient.post<PaymentOption>(storePath(params.store_id, `${collection}/${route}`), {
      provider_id: params.provider_id,
      id: params.id,
      key: params.key,
      blocks: params.blocks,
      status: params.status,
      saved_card_terms: params.saved_card_terms,
    }, options);
  };

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

    createStripe(params: CreateCardPaymentOptionParams, options?: RequestOptions): Promise<PaymentOption> {
      return createCard("stripe", params, options);
    },

    createMonri(params: CreateCardPaymentOptionParams, options?: RequestOptions): Promise<PaymentOption> {
      return createCard("monri", params, options);
    },

    createArkyStripe(params: CreateCardPaymentOptionParams, options?: RequestOptions): Promise<PaymentOption> {
      return createCard("arky-stripe", params, options);
    },

    createArkyMonri(params: CreateCardPaymentOptionParams, options?: RequestOptions): Promise<PaymentOption> {
      return createCard("arky-monri", params, options);
    },

    update(params: UpdatePaymentOptionParams, options?: RequestOptions): Promise<PaymentOption> {
      return apiConfig.httpClient.put<PaymentOption>(storeRecordPath(params.store_id, collection, params.id), {
        expected_updated_at: params.expected_updated_at,
        blocks: params.blocks,
        status: params.status,
        saved_card_terms: params.saved_card_terms,
      }, options);
    },
  };
};
