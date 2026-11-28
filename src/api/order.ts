import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type { OutgoingMessage } from "../types/notification";
import type {
  AnswerOrderBookingItemParams,
  CancelOrderBookingItemParams,
  CancelOrderParams,
  CancelOrderProductItemParams,
  CorrectOrderDeliveryAddressParams,
  FindOrderBookingItemsParams,
  FindOrderFinancialSummariesParams,
  FindOrderPaymentsParams,
  FindOrdersParams,
  GetOrderFinancialSummaryParams,
  GetOrderParams,
  GetOrderPaymentParams,
  Order,
  OrderDetail,
  OrderBookingItemRow,
  OrderBookingLineReminder,
  FindOrderBookingRemindersParams,
  FindOrderProductsParams,
  OrderProduct,
  OrderFinancialSummary,
  OrderFinancialSummaryOfOrder,
  ResendOrderReceiptParams,
  RescheduleOrderBookingItemParams,
  ResizeOrderBookingItemParams,
  ResumeOrderPaymentParams,
  RevokeOrderAccessParams,
  StepOrderBookingItemParams,
  TakeOffOrderBookingAddOnParams,
  UpdateOrderBookingItemParams,
  UpdateOrderParams,
  VisitStep,
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
import { segment, tenantPath, tenantRecordPath } from "./paths";

const collection = "orders";

export const createOrderApi = (apiConfig: ApiConfig) => {
  const orderPath = (tenantId: string, orderId: string) => tenantRecordPath(tenantId, collection, orderId);
  const bookingItemRoot = (tenantId: string, orderId: string, orderBookingItemId: string) =>
    `${orderPath(tenantId, orderId)}/booking-items/${segment(orderBookingItemId)}`;
  const bookingItemPath = (tenantId: string, orderId: string, orderBookingItemId: string, verb: string) =>
    `${bookingItemRoot(tenantId, orderId, orderBookingItemId)}/${verb}`;
  const creditsPath = (tenantId: string, orderId: string) => `${orderPath(tenantId, orderId)}/credits`;

  return {
    find(params: FindOrdersParams, options?: RequestOptions): Promise<PaginatedResponse<Order>> {
      const { tenant_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<Order>>(tenantPath(tenant_id, collection), {
        ...options,
        params: query,
      });
    },

    get(params: GetOrderParams, options?: RequestOptions): Promise<OrderDetail> {
      return apiConfig.httpClient.get<OrderDetail>(orderPath(params.tenant_id, params.id), options);
    },

    update(params: UpdateOrderParams, options?: RequestOptions): Promise<Order> {
      const { tenant_id, id, ...body } = params;
      return apiConfig.httpClient.patch<Order>(orderPath(tenant_id, id), body, options);
    },

    correctDeliveryAddress(params: CorrectOrderDeliveryAddressParams, options?: RequestOptions): Promise<Order> {
      return apiConfig.httpClient.patch<Order>(
        `${orderPath(params.tenant_id, params.order_id)}/deliveries/${segment(params.delivery_group_id)}/address`,
        { expected_updated_at: params.expected_updated_at, address: params.address },
        options,
      );
    },

    findBookingItems(
      params: FindOrderBookingItemsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<OrderBookingItemRow>> {
      const { tenant_id, ...query } = params;
      return apiConfig.httpClient.get<PaginatedResponse<OrderBookingItemRow>>(tenantPath(tenant_id, `${collection}/booking-items`), {
        ...options,
        params: query,
      });
    },

    findBookingReminders(params: FindOrderBookingRemindersParams, options?: RequestOptions): Promise<OrderBookingLineReminder[]> {
      return apiConfig.httpClient.get<OrderBookingLineReminder[]>(
        `${orderPath(params.tenant_id, params.order_id)}/booking-items/${segment(params.order_booking_item_id)}/reminders`,
        options,
      );
    },

    findProducts(params: FindOrderProductsParams, options?: RequestOptions): Promise<OrderProduct[]> {
      return apiConfig.httpClient.get<OrderProduct[]>(`${orderPath(params.tenant_id, params.order_id)}/products`, {
        ...options,
        params: { ids: params.ids },
      });
    },

    revokeAccess(params: RevokeOrderAccessParams, options?: RequestOptions): Promise<Order> {
      const { tenant_id, id, ...body } = params;
      return apiConfig.httpClient.post<Order>(`${orderPath(tenant_id, id)}/access/revoke`, body, options);
    },

    resendReceipt(params: ResendOrderReceiptParams, options?: RequestOptions): Promise<OutgoingMessage> {
      requireId(params.id, "receipt");
      return apiConfig.httpClient.post<OutgoingMessage>(
        `${orderPath(params.tenant_id, params.order_id)}/resend-receipt`,
        { id: params.id, expected_updated_at: params.expected_updated_at },
        options,
      );
    },

    cancel(params: CancelOrderParams, options?: RequestOptions): Promise<Order> {
      if (typeof params.notify_user !== "boolean") throw new TypeError("Cancellation requires an explicit user email choice");
      return apiConfig.httpClient.post<Order>(
        `${orderPath(params.tenant_id, params.order_id)}/cancel`,
        { expected_updated_at: params.expected_updated_at, notify_user: params.notify_user },
        options,
      );
    },

    cancelProductItem(params: CancelOrderProductItemParams, options?: RequestOptions): Promise<Order> {
      requireId(params.credit_id, "credit");
      if (typeof params.notify_user !== "boolean") throw new TypeError("Cancellation requires an explicit user email choice");
      return apiConfig.httpClient.post<Order>(
        `${orderPath(params.tenant_id, params.order_id)}/product-items/${segment(params.line_item_id)}/cancel`,
        { credit_id: params.credit_id, expected_updated_at: params.expected_updated_at, notify_user: params.notify_user, units: params.units },
        options,
      );
    },

    cancelBookingItem(params: CancelOrderBookingItemParams, options?: RequestOptions): Promise<Order> {
      requireId(params.credit_id, "credit");
      return apiConfig.httpClient.post<Order>(
        bookingItemPath(params.tenant_id, params.order_id, params.order_booking_item_id, "cancel"),
        {
          credit_id: params.credit_id,
          expected_updated_at: params.expected_updated_at,
          notify_user: params.notify_user,
        },
        options,
      );
    },

    rescheduleBookingItem(params: RescheduleOrderBookingItemParams, options?: RequestOptions): Promise<Order> {
      return apiConfig.httpClient.post<Order>(
        bookingItemPath(params.tenant_id, params.order_id, params.order_booking_item_id, "reschedule"),
        {
          expected_updated_at: params.expected_updated_at,
          starts_at: params.starts_at,
          notify_user: params.notify_user,
        },
        options,
      );
    },

    cancelBookingSeries(params: CancelOrderBookingItemParams, options?: RequestOptions): Promise<Order> {
      requireId(params.credit_id, "credit");
      if (typeof params.notify_user !== "boolean") throw new TypeError("Cancellation requires an explicit user email choice");
      return apiConfig.httpClient.post<Order>(
        bookingItemPath(params.tenant_id, params.order_id, params.order_booking_item_id, "series/cancel"),
        {
          credit_id: params.credit_id,
          expected_updated_at: params.expected_updated_at,
          notify_user: params.notify_user,
        },
        options,
      );
    },

    rescheduleBookingSeries(params: RescheduleOrderBookingItemParams, options?: RequestOptions): Promise<Order> {
      return apiConfig.httpClient.post<Order>(
        bookingItemPath(params.tenant_id, params.order_id, params.order_booking_item_id, "series/reschedule"),
        {
          expected_updated_at: params.expected_updated_at,
          starts_at: params.starts_at,
          notify_user: params.notify_user,
        },
        options,
      );
    },

    resizeBookingItem(params: ResizeOrderBookingItemParams, options?: RequestOptions): Promise<Order> {
      return apiConfig.httpClient.post<Order>(
        bookingItemPath(params.tenant_id, params.order_id, params.order_booking_item_id, "resize"),
        { expected_updated_at: params.expected_updated_at, ends_at: params.ends_at },
        options,
      );
    },

    updateBookingItem(params: UpdateOrderBookingItemParams, options?: RequestOptions): Promise<Order> {
      if (typeof params.notify_user !== "boolean") throw new TypeError("A booking change requires an explicit user email choice");
      return apiConfig.httpClient.patch<Order>(
        bookingItemRoot(params.tenant_id, params.order_id, params.order_booking_item_id),
        { expected_updated_at: params.expected_updated_at, update: params.update, notify_user: params.notify_user },
        options,
      );
    },

    takeOffBookingAddOn(params: TakeOffOrderBookingAddOnParams, options?: RequestOptions): Promise<Order> {
      requireId(params.credit_id, "credit");
      return apiConfig.httpClient.post<Order>(
        bookingItemPath(params.tenant_id, params.order_id, params.order_booking_item_id, `add-ons/${segment(params.booked_add_on_id)}/take-off`),
        { credit_id: params.credit_id, expected_updated_at: params.expected_updated_at },
        options,
      );
    },

    stepBookingItem(params: StepOrderBookingItemParams, options?: RequestOptions): Promise<Order> {
      const verbs: Record<VisitStep, string> = {
        upcoming: "upcoming",
        waiting: "waiting",
        in_progress: "in-progress",
        attended: "attend",
        no_show: "no-show",
      };
      const body =
        params.step === "attended" || params.step === "no_show"
          ? { expected_updated_at: params.expected_updated_at, fiscal_device_id: params.fiscal_device_id }
          : { expected_updated_at: params.expected_updated_at };
      return apiConfig.httpClient.post<Order>(
        bookingItemPath(params.tenant_id, params.order_id, params.order_booking_item_id, verbs[params.step]),
        body,
        options,
      );
    },

    answerBookingItem(params: AnswerOrderBookingItemParams, options?: RequestOptions): Promise<Order> {
      return apiConfig.httpClient.post<Order>(
        bookingItemPath(params.tenant_id, params.order_id, params.order_booking_item_id, "response"),
        { expected_updated_at: params.expected_updated_at, answer: params.answer },
        options,
      );
    },

    getFinancialSummary(params: GetOrderFinancialSummaryParams, options?: RequestOptions): Promise<OrderFinancialSummary> {
      return apiConfig.httpClient.get<OrderFinancialSummary>(`${orderPath(params.tenant_id, params.id)}/financial-summary`, options);
    },

    findFinancialSummaries(
      params: FindOrderFinancialSummariesParams,
      options?: RequestOptions,
    ): Promise<OrderFinancialSummaryOfOrder[]> {
      const { tenant_id, ...query } = params;
      return apiConfig.httpClient.get<OrderFinancialSummaryOfOrder[]>(tenantPath(tenant_id, `${collection}/financial-summaries`), {
        ...options,
        params: query,
      });
    },

    findPayments(params: FindOrderPaymentsParams, options?: RequestOptions): Promise<Payment[]> {
      return apiConfig.httpClient.get<Payment[]>(`${orderPath(params.tenant_id, params.order_id)}/payments`, options);
    },

    getPayment(params: GetOrderPaymentParams, options?: RequestOptions): Promise<Payment> {
      return apiConfig.httpClient.get<Payment>(
        `${orderPath(params.tenant_id, params.order_id)}/payments/${segment(params.payment_id)}`,
        options,
      );
    },

    resumePayment(params: ResumeOrderPaymentParams, options?: RequestOptions): Promise<CheckoutPaymentAction> {
      return apiConfig.httpClient.post<CheckoutPaymentAction>(
        `${orderPath(params.tenant_id, params.order_id)}/payment-action`,
        undefined,
        options,
      );
    },

    credit: {
      find(params: FindOrderCreditsParams, options?: RequestOptions): Promise<PaginatedResponse<OrderCredit>> {
        const { tenant_id, ...query } = params;
        return apiConfig.httpClient.get<PaginatedResponse<OrderCredit>>(tenantPath(tenant_id, "credits"), { ...options, params: query });
      },

      get(params: GetOrderCreditParams, options?: RequestOptions): Promise<OrderCredit> {
        return apiConfig.httpClient.get<OrderCredit>(
          `${creditsPath(params.tenant_id, params.order_id)}/${segment(params.credit_id)}`,
          options,
        );
      },

      create(params: CreateOrderCreditParams, options?: RequestOptions): Promise<OrderCredit> {
        requireId(params.id, "credit");
        const { tenant_id, order_id, ...body } = params;
        return apiConfig.httpClient.post<OrderCredit>(creditsPath(tenant_id, order_id), body, options);
      },

      void(params: VoidOrderCreditParams, options?: RequestOptions): Promise<OrderCredit> {
        return apiConfig.httpClient.post<OrderCredit>(
          `${creditsPath(params.tenant_id, params.order_id)}/${segment(params.credit_id)}/void`,
          { expected_updated_at: params.expected_updated_at, reason: params.reason },
          options,
        );
      },
    },
  };
};
