import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type { OutgoingEmail } from "../types/notification";
import type {
  AddOrderInvoiceParams,
  DeleteOrderInvoiceParams,
  CancelOrderBookingItemParams,
  CancelOrderParams,
  CancelOrderProductItemParams,
  CorrectOrderDeliveryAddressParams,
  FindOrderBookingItemsParams,
  FindOrderPaymentsParams,
  FindOrdersParams,
  GetOrderFinancialSummaryParams,
  GetOrderParams,
  GetOrderPaymentParams,
  MarkOrderBookingItemParams,
  Order,
  OrderBookingItem,
  OrderFinancialSummary,
  ResendOrderReceiptParams,
  RescheduleOrderBookingItemParams,
  ResumeOrderPaymentParams,
  RevokeOrderAccessParams,
  UpdateOrderParams,
} from "../types/order";
import type {
  CreateOrderCreditParams,
  FindOrderCreditsParams,
  GetOrderCreditParams,
  OrderCredit,
  VoidOrderCreditParams,
} from "../types/orderCredit";
import type { CheckoutPaymentAction, Payment } from "../types/payment";
import { requireId } from "../utils/ids";
import { segment, storePath, storeRecordPath } from "./paths";

const collection = "orders";

export const createOrderApi = (apiConfig: ApiConfig) => {
  const orderPath = (storeId: string, orderId: string) => storeRecordPath(storeId, collection, orderId);
  const bookingItemPath = (storeId: string, orderId: string, lineItemId: string, verb: string) =>
    `${orderPath(storeId, orderId)}/booking-items/${segment(lineItemId)}/${verb}`;
  const creditsPath = (storeId: string, orderId: string) => `${orderPath(storeId, orderId)}/credits`;

  return {
    find(params: FindOrdersParams, options?: RequestOptions): Promise<PaginatedResponse<Order>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Order>>(storePath(store_id, collection), {
        ...options,
        params: query,
      });
    },

    get(params: GetOrderParams, options?: RequestOptions): Promise<Order> {
      return apiConfig.httpClient.get<Order>(orderPath(params.store_id, params.id), options);
    },

    update(params: UpdateOrderParams, options?: RequestOptions): Promise<Order> {
      const { store_id, id, ...body } = params;
      return apiConfig.httpClient.patch<Order>(orderPath(store_id, id), body, options);
    },

    correctDeliveryAddress(params: CorrectOrderDeliveryAddressParams, options?: RequestOptions): Promise<Order> {
      return apiConfig.httpClient.patch<Order>(
        `${orderPath(params.store_id, params.order_id)}/deliveries/${segment(params.delivery_group_id)}/address`,
        { expected_updated_at: params.expected_updated_at, address: params.address },
        options,
      );
    },

    addInvoice(params: AddOrderInvoiceParams, options?: RequestOptions): Promise<Order> {
      requireId(params.id, "invoice");
      const { store_id, order_id, ...body } = params;
      return apiConfig.httpClient.post<Order>(`${orderPath(store_id, order_id)}/invoices`, body, options);
    },

    deleteInvoice(params: DeleteOrderInvoiceParams, options?: RequestOptions): Promise<Order> {
      return apiConfig.httpClient.delete<Order>(`${orderPath(params.store_id, params.order_id)}/invoices/${segment(params.invoice_id)}`, {
        ...options, params: { expected_updated_at: params.expected_updated_at },
      });
    },

    findBookingItems(
      params: FindOrderBookingItemsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<OrderBookingItem>> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<OrderBookingItem>>(storePath(store_id, `${collection}/booking-items`), {
        ...options,
        params: query,
      });
    },

    revokeAccess(params: RevokeOrderAccessParams, options?: RequestOptions): Promise<Order> {
      const { store_id, id, ...body } = params;
      return apiConfig.httpClient.post<Order>(`${orderPath(store_id, id)}/access/revoke`, body, options);
    },

    resendReceipt(params: ResendOrderReceiptParams, options?: RequestOptions): Promise<OutgoingEmail> {
      requireId(params.id, "receipt");
      return apiConfig.httpClient.post<OutgoingEmail>(
        `${orderPath(params.store_id, params.order_id)}/resend-receipt`,
        { id: params.id, expected_updated_at: params.expected_updated_at },
        options,
      );
    },

    cancel(params: CancelOrderParams, options?: RequestOptions): Promise<Order> {
      if (typeof params.notify_customer !== "boolean") throw new TypeError("Cancellation requires an explicit customer email choice");
      return apiConfig.httpClient.post<Order>(
        `${orderPath(params.store_id, params.order_id)}/cancel`,
        { expected_updated_at: params.expected_updated_at, notify_customer: params.notify_customer },
        options,
      );
    },

    cancelProductItem(params: CancelOrderProductItemParams, options?: RequestOptions): Promise<Order> {
      requireId(params.credit_id, "credit");
      if (typeof params.notify_customer !== "boolean") throw new TypeError("Cancellation requires an explicit customer email choice");
      return apiConfig.httpClient.post<Order>(
        `${orderPath(params.store_id, params.order_id)}/product-items/${segment(params.line_item_id)}/cancel`,
        { credit_id: params.credit_id, expected_updated_at: params.expected_updated_at, notify_customer: params.notify_customer, units: params.units },
        options,
      );
    },

    cancelBookingItem(params: CancelOrderBookingItemParams, options?: RequestOptions): Promise<Order> {
      requireId(params.credit_id, "credit");
      return apiConfig.httpClient.post<Order>(
        bookingItemPath(params.store_id, params.order_id, params.line_item_id, "cancel"),
        {
          credit_id: params.credit_id,
          expected_updated_at: params.expected_updated_at,
          notify_customer: params.notify_customer,
        },
        options,
      );
    },

    rescheduleBookingItem(params: RescheduleOrderBookingItemParams, options?: RequestOptions): Promise<Order> {
      return apiConfig.httpClient.post<Order>(
        bookingItemPath(params.store_id, params.order_id, params.line_item_id, "reschedule"),
        {
          expected_updated_at: params.expected_updated_at,
          starts_at: params.starts_at,
          notify_customer: params.notify_customer,
        },
        options,
      );
    },

    attendBookingItem(params: MarkOrderBookingItemParams, options?: RequestOptions): Promise<Order> {
      return apiConfig.httpClient.post<Order>(
        bookingItemPath(params.store_id, params.order_id, params.line_item_id, "attend"),
        { expected_updated_at: params.expected_updated_at },
        options,
      );
    },

    markBookingItemNoShow(params: MarkOrderBookingItemParams, options?: RequestOptions): Promise<Order> {
      return apiConfig.httpClient.post<Order>(
        bookingItemPath(params.store_id, params.order_id, params.line_item_id, "no-show"),
        { expected_updated_at: params.expected_updated_at },
        options,
      );
    },

    getFinancialSummary(params: GetOrderFinancialSummaryParams, options?: RequestOptions): Promise<OrderFinancialSummary> {
      return apiConfig.httpClient.get<OrderFinancialSummary>(`${orderPath(params.store_id, params.id)}/financial-summary`, options);
    },

    async findPayments(params: FindOrderPaymentsParams, options?: RequestOptions): Promise<PaginatedResponse<Payment>> {
      const items = await apiConfig.httpClient.get<Payment[]>(`${orderPath(params.store_id, params.order_id)}/payments`, options);
      return { items, cursor: null };
    },

    getPayment(params: GetOrderPaymentParams, options?: RequestOptions): Promise<Payment> {
      return apiConfig.httpClient.get<Payment>(
        `${orderPath(params.store_id, params.order_id)}/payments/${segment(params.payment_id)}`,
        options,
      );
    },

    resumePayment(params: ResumeOrderPaymentParams, options?: RequestOptions): Promise<CheckoutPaymentAction> {
      return apiConfig.httpClient.post<CheckoutPaymentAction>(
        `${orderPath(params.store_id, params.order_id)}/payment-action`,
        undefined,
        options,
      );
    },

    credit: {
      find(params: FindOrderCreditsParams, options?: RequestOptions): Promise<PaginatedResponse<OrderCredit>> {
        const { store_id, order_id, ...query } = params;
        return apiConfig.httpClient.get<PaginatedResponse<OrderCredit>>(
          order_id === undefined ? storePath(store_id, "credits") : creditsPath(store_id, order_id),
          { ...options, params: query },
        );
      },

      get(params: GetOrderCreditParams, options?: RequestOptions): Promise<OrderCredit> {
        return apiConfig.httpClient.get<OrderCredit>(
          `${creditsPath(params.store_id, params.order_id)}/${segment(params.credit_id)}`,
          options,
        );
      },

      create(params: CreateOrderCreditParams, options?: RequestOptions): Promise<OrderCredit> {
        requireId(params.id, "credit");
        const { store_id, order_id, ...body } = params;
        return apiConfig.httpClient.post<OrderCredit>(creditsPath(store_id, order_id), body, options);
      },

      void(params: VoidOrderCreditParams, options?: RequestOptions): Promise<OrderCredit> {
        return apiConfig.httpClient.post<OrderCredit>(
          `${creditsPath(params.store_id, params.order_id)}/${segment(params.credit_id)}/void`,
          { expected_updated_at: params.expected_updated_at },
          options,
        );
      },
    },
  };
};
