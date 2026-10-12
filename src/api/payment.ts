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
  VoidPaymentCollectionParams,
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
      return apiConfig.httpClient.get<PaginatedResponse<Payment>>(storePath(params.store_id, collection), {
        ...options,
        params: {
          order_id: params.order_id,
          status: params.status,
          type: params.type,
          on_hold: params.on_hold,
          updated_at_from: params.updated_at_from,
          sort_field: params.sort_field,
          sort_direction: params.sort_direction,
          limit: params.limit,
          cursor: params.cursor,
        },
      });
    },

    get(params: GetPaymentParams, options?: RequestOptions): Promise<Payment> {
      return apiConfig.httpClient.get<Payment>(paymentPath(params.store_id, params.id), options);
    },

    createManual(params: CreateManualPaymentParams, options?: RequestOptions): Promise<Payment> {
      requireId(params.id, "payment");
      return apiConfig.httpClient.post<Payment>(storePath(params.store_id, `${collection}/manual`), {
        id: params.id,
        order_id: params.order_id,
        payment_option_id: params.payment_option_id,
        money: params.money,
        reference: params.reference,
      }, options);
    },

    recordCollection(params: RecordPaymentCollectionParams, options?: RequestOptions): Promise<Payment> {
      requireId(params.id, "collection");
      return apiConfig.httpClient.post<Payment>(`${paymentPath(params.store_id, params.payment_id)}/collections`, {
        id: params.id,
        money: params.money,
        reference: params.reference,
      }, options);
    },

    voidCollection(params: VoidPaymentCollectionParams, options?: RequestOptions): Promise<Payment> {
      return apiConfig.httpClient.post<Payment>(
        `${paymentPath(params.store_id, params.payment_id)}/collections/${segment(params.collection_id)}/void`,
        { expected_updated_at: params.expected_updated_at, reason: params.reason },
        options,
      );
    },

    createRefund(params: CreatePaymentRefundParams, options?: RequestOptions): Promise<Payment> {
      requireId(params.id, "refund");
      return apiConfig.httpClient.post<Payment>(`${paymentPath(params.store_id, params.payment_id)}/refunds`, {
        id: params.id,
        money: params.money,
        reason: params.reason,
        application: params.application,
        notify_customer: params.notify_customer,
      }, options);
    },

    recordRefundReceipt(params: RecordRefundReceiptParams, options?: RequestOptions): Promise<Payment> {
      return apiConfig.httpClient.post<Payment>(
        `${refundPath(params.store_id, params.payment_id, params.refund_id)}/receipts`,
        {
          expected_updated_at: params.expected_updated_at,
          receipt: { type: params.receipt.type, reference: params.receipt.reference },
        },
        options,
      );
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
      return apiConfig.httpClient.post<Payment>(`${paymentPath(params.store_id, params.payment_id)}/resolve-hold`, {
        expected_updated_at: params.expected_updated_at,
        hold_id: params.hold_id,
        note: params.note,
      }, options);
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
    return apiConfig.httpClient.get<PaginatedResponse<IncomingWebhook>>(storePath(params.store_id, "incoming-webhooks"), {
      ...options,
      params: { status: params.status, limit: params.limit, cursor: params.cursor },
    });
  },

  get(params: GetIncomingWebhookParams, options?: RequestOptions): Promise<IncomingWebhook> {
    return apiConfig.httpClient.get<IncomingWebhook>(storeRecordPath(params.store_id, "incoming-webhooks", params.id), options);
  },

  resolve(params: ResolveIncomingWebhookParams, options?: RequestOptions): Promise<IncomingWebhook> {
    return apiConfig.httpClient.post<IncomingWebhook>(
      `${storeRecordPath(params.store_id, "incoming-webhooks", params.id)}/resolve`,
      { expected_updated_at: params.expected_updated_at, resolution: params.resolution },
      options,
    );
  },
});
