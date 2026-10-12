import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  CancelPaymentParams,
  CancelPaymentRefundParams,
  CreateManualPaymentParams,
  CreatePaymentRefundParams,
  FindPaymentsParams,
  FindIncomingWebhooksParams,
  GetPaymentParams,
  GetIncomingWebhookParams,
  Payment,
  IncomingWebhook,
  RecordPaymentCollectionParams,
  RecordRefundReceiptParams,
  ResolvePaymentChargeParams,
  ResolvePaymentHoldParams,
  ResolvePaymentRefundParams,
  ResolveIncomingWebhookParams,
} from "../types/payment";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";

const collection = "payments";

export const createPaymentApi = (apiConfig: ApiConfig) => {
  const paymentPath = (storeId: string, id: string) => storeRecordPath(storeId, collection, id);
  const refundPath = (storeId: string, paymentId: string, refundId: string) =>
    `${paymentPath(storeId, paymentId)}/refunds/${segment(refundId)}`;

  return {
    find(params: FindPaymentsParams, options?: RequestOptions): Promise<PaginatedResponse<Payment>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Payment>>(storePath(store_id, collection), {
        ...options,
        params: query,
      });
    },

    get(params: GetPaymentParams, options?: RequestOptions): Promise<Payment> {
      return apiConfig.httpClient.get<Payment>(paymentPath(params.store_id, params.id), options);
    },

    createManual(params: CreateManualPaymentParams, options?: RequestOptions): Promise<Payment> {
      requireId(params.id, "payment");
      const { store_id, ...body } = params;
      return apiConfig.httpClient.post<Payment>(storePath(store_id, `${collection}/manual`), body, options);
    },

    recordCollection(params: RecordPaymentCollectionParams, options?: RequestOptions): Promise<Payment> {
      requireId(params.id, "collection");
      const { store_id, payment_id, ...body } = params;
      return apiConfig.httpClient.post<Payment>(`${paymentPath(store_id, payment_id)}/collections`, body, options);
    },

    createRefund(params: CreatePaymentRefundParams, options?: RequestOptions): Promise<Payment> {
      requireId(params.id, "refund");
      const { store_id, payment_id, ...body } = params;
      return apiConfig.httpClient.post<Payment>(`${paymentPath(store_id, payment_id)}/refunds`, body, options);
    },

    recordRefundReceipt(params: RecordRefundReceiptParams, options?: RequestOptions): Promise<Payment> {
      requireId(params.id, "refund receipt");
      const { store_id, payment_id, refund_id, ...body } = params;
      return apiConfig.httpClient.post<Payment>(`${refundPath(store_id, payment_id, refund_id)}/receipts`, body, options);
    },

    cancelRefund(params: CancelPaymentRefundParams, options?: RequestOptions): Promise<Payment> {
      return apiConfig.httpClient.post<Payment>(
        `${refundPath(params.store_id, params.payment_id, params.refund_id)}/cancel`,
        { expected_updated_at: params.expected_updated_at },
        options,
      );
    },

    resolveRefund(params: ResolvePaymentRefundParams, options?: RequestOptions): Promise<Payment> {
      return apiConfig.httpClient.post<Payment>(
        `${refundPath(params.store_id, params.payment_id, params.refund_id)}/resolve`,
        { expected_updated_at: params.expected_updated_at, outcome: params.outcome },
        options,
      );
    },

    resolveCharge(params: ResolvePaymentChargeParams, options?: RequestOptions): Promise<Payment> {
      return apiConfig.httpClient.post<Payment>(
        `${paymentPath(params.store_id, params.payment_id)}/resolve-charge`,
        { expected_updated_at: params.expected_updated_at, outcome: params.outcome },
        options,
      );
    },

    resolveHold(params: ResolvePaymentHoldParams, options?: RequestOptions): Promise<Payment> {
      const { store_id, payment_id, ...body } = params;
      return apiConfig.httpClient.post<Payment>(`${paymentPath(store_id, payment_id)}/resolve-hold`, body, options);
    },

    cancel(params: CancelPaymentParams, options?: RequestOptions): Promise<Payment> {
      return apiConfig.httpClient.post<Payment>(
        `${paymentPath(params.store_id, params.payment_id)}/cancel`,
        { expected_updated_at: params.expected_updated_at },
        options,
      );
    },
  };
};

export const createIncomingWebhookApi = (apiConfig: ApiConfig) => ({
  find(params: FindIncomingWebhooksParams, options?: RequestOptions): Promise<PaginatedResponse<IncomingWebhook>> {
    const { store_id, ...query } = params;
    return apiConfig.httpClient.get<PaginatedResponse<IncomingWebhook>>(storePath(store_id, "incoming-webhooks"), {
      ...options,
      params: query,
    });
  },

  get(params: GetIncomingWebhookParams, options?: RequestOptions): Promise<IncomingWebhook> {
    return apiConfig.httpClient.get<IncomingWebhook>(storeRecordPath(params.store_id, "incoming-webhooks", params.id), options);
  },

  resolve(params: ResolveIncomingWebhookParams, options?: RequestOptions): Promise<IncomingWebhook> {
    const { store_id, id, ...body } = params;
    return apiConfig.httpClient.post<IncomingWebhook>(
      `${storeRecordPath(store_id, "incoming-webhooks", id)}/resolve`,
      body,
      options,
    );
  },
});
