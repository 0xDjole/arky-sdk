import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  AllocatePaymentRefundParams,
  CancelPaymentRefundParams,
  CreatePaymentRefundParams,
  FindPaymentsParams,
  FindIncomingWebhooksParams,
  GetPaymentParams,
  GetIncomingWebhookParams,
  Payment,
  PaymentIncomingWebhook,
  RecordMadeRefundParams,
  RecordedPayments,
  RecordPaymentsParams,
  RecordRefundReceiptParams,
  RefundReceiptInput,
  ResolvePaymentChargeParams,
  ResolvePaymentHoldParams,
  ResolvePaymentRefundParams,
  ResolveIncomingWebhookParams,
  VoidPaymentParams,
} from "../types/payment";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";

const collection = "payments";

const refundReceiptBody = (receipt: RefundReceiptInput): RefundReceiptInput =>
  receipt.type === "sent"
    ? { type: receipt.type, reference: receipt.reference, method: receipt.method }
    : { type: receipt.type, reference: receipt.reference };

export const createPaymentApi = (apiConfig: ApiConfig) => {
  const paymentPath = (storeId: string, id: string) => storeRecordPath(storeId, collection, id);
  const refundPath = (storeId: string, paymentId: string, refundId: string) =>
    `${paymentPath(storeId, paymentId)}/refunds/${segment(refundId)}`;

  return {
    find(params: FindPaymentsParams, options?: RequestOptions): Promise<PaginatedResponse<Payment>> {
      return apiConfig.httpClient.get<PaginatedResponse<Payment>>(storePath(params.store_id, collection), {
        ...options,
        params: {
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

    record(params: RecordPaymentsParams, options?: RequestOptions): Promise<RecordedPayments> {
      for (const payment of params.payments) requireId(payment.id, "payment");
      return apiConfig.httpClient.post<RecordedPayments>(
        `${storeRecordPath(params.store_id, "orders", params.order_id)}/payments`,
        {
          fiscal_device_id: params.fiscal_device_id,
          payments: params.payments.map((payment) => ({
            id: payment.id,
            payment_option_id: payment.payment_option_id,
            money: payment.money,
            method: payment.method,
            reference: payment.reference,
          })),
        },
        options,
      );
    },

    void(params: VoidPaymentParams, options?: RequestOptions): Promise<Payment> {
      return apiConfig.httpClient.post<Payment>(
        `${paymentPath(params.store_id, params.payment_id)}/void`,
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

    recordMadeRefund(params: RecordMadeRefundParams, options?: RequestOptions): Promise<Payment> {
      requireId(params.id, "refund");
      return apiConfig.httpClient.post<Payment>(`${paymentPath(params.store_id, params.payment_id)}/refunds/made`, {
        id: params.id,
        money: params.money,
        reason: params.reason,
        application: params.application,
        notify_customer: params.notify_customer,
        transaction_id: params.transaction_id,
      }, options);
    },

    recordRefundReceipt(params: RecordRefundReceiptParams, options?: RequestOptions): Promise<Payment> {
      return apiConfig.httpClient.post<Payment>(
        `${refundPath(params.store_id, params.payment_id, params.refund_id)}/receipts`,
        {
          expected_updated_at: params.expected_updated_at,
          receipt: refundReceiptBody(params.receipt),
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

    allocateRefund(params: AllocatePaymentRefundParams, options?: RequestOptions): Promise<Payment> {
      return apiConfig.httpClient.post<Payment>(
        `${refundPath(params.store_id, params.payment_id, params.refund_id)}/allocations`,
        { expected_updated_at: params.expected_updated_at, application: params.application },
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
  };
};

export const createIncomingWebhookApi = (apiConfig: ApiConfig) => ({
  find(params: FindIncomingWebhooksParams, options?: RequestOptions): Promise<PaginatedResponse<PaymentIncomingWebhook>> {
    return apiConfig.httpClient.get<PaginatedResponse<PaymentIncomingWebhook>>(storePath(params.store_id, "incoming-webhooks"), {
      ...options,
      params: {
        payment_option_id: params.payment_option_id,
        status: params.status,
        limit: params.limit,
        cursor: params.cursor,
      },
    });
  },

  get(params: GetIncomingWebhookParams, options?: RequestOptions): Promise<PaymentIncomingWebhook> {
    return apiConfig.httpClient.get<PaymentIncomingWebhook>(storeRecordPath(params.store_id, "incoming-webhooks", params.id), options);
  },

  resolve(params: ResolveIncomingWebhookParams, options?: RequestOptions): Promise<PaymentIncomingWebhook> {
    return apiConfig.httpClient.post<PaymentIncomingWebhook>(
      `${storeRecordPath(params.store_id, "incoming-webhooks", params.id)}/resolve`,
      { expected_updated_at: params.expected_updated_at, resolution: params.resolution },
      options,
    );
  },
});
