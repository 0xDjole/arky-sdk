import type { ApiConfig } from "../services/clientTypes";
import type { PaginatedResponse } from "../types";
import type { RequestOptions } from "../types/api";
import type {
  FindMerchantDebitReversalsParams,
  FindShippingLabelRefundsParams,
  FindShippingLabelsParams,
  GetMerchantDebitReversalParams,
  GetShippingLabelParams,
  GetShippingLabelRefundParams,
  MerchantDebitReversal,
  QuoteShippingLabelParams,
  RequestMerchantDebitReversalParams,
  RequestShippingLabelParams,
  RequestShippingLabelRefundParams,
  ShippingLabelPurchase,
  ShippingLabelQuoteRate,
  ShippingLabelRefund,
} from "../types/shippingLabel";

export const createShippingLabelApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/shipping-labels`;

  return {
    quote(
      params: QuoteShippingLabelParams,
      options?: RequestOptions,
    ): Promise<ShippingLabelQuoteRate[]> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<ShippingLabelQuoteRate[]>(
        `${basePath(store_id)}/quotes`,
        payload,
        options,
      );
    },
    request(
      params: RequestShippingLabelParams,
      options?: RequestOptions,
    ): Promise<ShippingLabelPurchase> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<ShippingLabelPurchase>(
        basePath(store_id),
        payload,
        options,
      );
    },
    get(params: GetShippingLabelParams, options?: RequestOptions): Promise<ShippingLabelPurchase> {
      const { store_id, shipping_label_id } = params;
      return apiConfig.httpClient.get<ShippingLabelPurchase>(
        `${basePath(store_id)}/${encodeURIComponent(shipping_label_id)}`,
        options,
      );
    },
    reconcile(
      params: GetShippingLabelParams,
      options?: RequestOptions,
    ): Promise<ShippingLabelPurchase> {
      const { store_id, shipping_label_id } = params;
      return apiConfig.httpClient.post<ShippingLabelPurchase>(
        `${basePath(store_id)}/${encodeURIComponent(shipping_label_id)}/reconcile`,
        {},
        options,
      );
    },
    find(
      params: FindShippingLabelsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<ShippingLabelPurchase>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<ShippingLabelPurchase>>(
        basePath(store_id),
        { ...options, params: query },
      );
    },
  };
};

export const createShippingLabelRefundApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/shipping-label-refunds`;

  return {
    request(
      params: RequestShippingLabelRefundParams,
      options?: RequestOptions,
    ): Promise<ShippingLabelRefund> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<ShippingLabelRefund>(
        basePath(store_id),
        payload,
        options,
      );
    },
    get(
      params: GetShippingLabelRefundParams,
      options?: RequestOptions,
    ): Promise<ShippingLabelRefund> {
      const { store_id, shipping_label_refund_id } = params;
      return apiConfig.httpClient.get<ShippingLabelRefund>(
        `${basePath(store_id)}/${encodeURIComponent(shipping_label_refund_id)}`,
        options,
      );
    },
    reconcile(
      params: GetShippingLabelRefundParams,
      options?: RequestOptions,
    ): Promise<ShippingLabelRefund> {
      const { store_id, shipping_label_refund_id } = params;
      return apiConfig.httpClient.post<ShippingLabelRefund>(
        `${basePath(store_id)}/${encodeURIComponent(shipping_label_refund_id)}/reconcile`,
        {},
        options,
      );
    },
    retry(
      params: GetShippingLabelRefundParams,
      options?: RequestOptions,
    ): Promise<ShippingLabelRefund> {
      const { store_id, shipping_label_refund_id } = params;
      return apiConfig.httpClient.post<ShippingLabelRefund>(
        `${basePath(store_id)}/${encodeURIComponent(shipping_label_refund_id)}/retry`,
        {},
        options,
      );
    },
    find(
      params: FindShippingLabelRefundsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<ShippingLabelRefund>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<ShippingLabelRefund>>(
        basePath(store_id),
        { ...options, params: query },
      );
    },
  };
};

export const createMerchantDebitReversalApi = (apiConfig: ApiConfig) => {
  const basePath = (storeId?: string) =>
    `/v1/stores/${encodeURIComponent(storeId ?? apiConfig.storeId)}/merchant-debit-reversals`;

  return {
    request(
      params: RequestMerchantDebitReversalParams,
      options?: RequestOptions,
    ): Promise<MerchantDebitReversal> {
      const { store_id, ...payload } = params;
      return apiConfig.httpClient.post<MerchantDebitReversal>(
        basePath(store_id),
        payload,
        options,
      );
    },
    get(
      params: GetMerchantDebitReversalParams,
      options?: RequestOptions,
    ): Promise<MerchantDebitReversal> {
      const { store_id, merchant_debit_reversal_id } = params;
      return apiConfig.httpClient.get<MerchantDebitReversal>(
        `${basePath(store_id)}/${encodeURIComponent(merchant_debit_reversal_id)}`,
        options,
      );
    },
    reconcile(
      params: GetMerchantDebitReversalParams,
      options?: RequestOptions,
    ): Promise<MerchantDebitReversal> {
      const { store_id, merchant_debit_reversal_id } = params;
      return apiConfig.httpClient.post<MerchantDebitReversal>(
        `${basePath(store_id)}/${encodeURIComponent(merchant_debit_reversal_id)}/reconcile`,
        {},
        options,
      );
    },
    find(
      params: FindMerchantDebitReversalsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<MerchantDebitReversal>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<MerchantDebitReversal>>(
        basePath(store_id),
        { ...options, params: query },
      );
    },
  };
};
