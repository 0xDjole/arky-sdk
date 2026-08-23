import type { ApiConfig } from "../services/clientTypes";
import type {
  CreateBookingResourceParams,
  CreateProductParams,
  CreateBookingServiceParams,
  CreateBookingOfferingParams,
  DeleteBookingResourceParams,
  UpdateProductParams,
  DeleteProductParams,
  DeleteBookingServiceParams,
  DeleteBookingOfferingParams,
  FindBookingOfferingsParams,
  GetBookingResourceParams,
  GetProductParams,
  GetProductsParams,
  FindBookingResourcesParams,
  GetQuoteParams,
  GetAvailabilityParams,
  AvailabilityResponse,
  AddCartBookingParams,
  AddCartDigitalProductParams,
  AddCartProductParams,
  CheckoutCartParams,
  ClearCartParams,
  CreateCartParams,
  FindCartsParams,
  GetCartParams,
  GetBookingServiceParams,
  FindBookingServicesParams,
  UpdateOrderParams,
  CancelOrderProductParams,
  UpdateBookingResourceParams,
  UpdateBookingServiceParams,
  UpdateBookingOfferingParams,
  GetOrderParams,
  GetOrdersParams,
  CreateOrderRefundParams,
  CreateOrderRefundResponse,
  RecordCashOnDeliveryRefundParams,
  FindOrderRefundsParams,
  GetOrderRefundParams,
  GetOrderPaymentParams,
  MarkCashOnDeliveryPaidParams,
  FindPaymentDisputesParams,
  GetPaymentDisputeParams,
  QuoteCartParams,
  RemoveCartItemParams,
  RequestOptions,
  UpdateCartParams,
} from "../types/api";
import type {
  Order,
  Product,
  ProductInventory,
  BookingResource,
  BookingService,
  BookingOffering,
  OrderQuote,
  OrderRefund,
  OrderPayment,
  PaymentDispute,
  RefundStatus,
  OrderProduct,
  OrderDigitalProduct,
  Cart,
  PaginatedResponse,
} from "../types";

const refundStatuses: RefundStatus[] = [
  "requested",
  "processing",
  "succeeded",
  "rejected",
  "failed",
  "unknown",
];

const validateRefundResponse = (
  response: CreateOrderRefundResponse,
  refundId: string,
  amount: number,
): CreateOrderRefundResponse => {
  if (response.refund_id !== refundId) {
    throw new Error("Refund response did not match the requested refund_id");
  }
  if (
    !response.money ||
    !Number.isSafeInteger(response.money.amount) ||
    response.money.amount !== amount
  ) {
    throw new Error("Refund response did not match the requested amount");
  }
  if (!refundStatuses.includes(response.status)) {
    throw new Error("Refund response contained an invalid status");
  }
  return response;
};

export const createEshopApi = (apiConfig: ApiConfig) => {
  return {
    async createProduct(
      params: CreateProductParams,
      options?: RequestOptions,
    ): Promise<Product> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Product>(
        `/v1/stores/${target_store_id}/products`,
        payload,
        options,
      );
    },

    async updateProduct(
      params: UpdateProductParams,
      options?: RequestOptions,
    ): Promise<Product> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<Product>(
        `/v1/stores/${target_store_id}/products/${params.id}`,
        payload,
        options,
      );
    },

    async deleteProduct(
      params: DeleteProductParams,
      options?: RequestOptions,
    ): Promise<{ deleted: boolean }> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<{ deleted: boolean }>(
        `/v1/stores/${target_store_id}/products/${params.id}`,
        options,
      );
    },

    async getProduct(
      params: GetProductParams,
      options?: RequestOptions,
    ): Promise<Product> {
      const target_store_id = params.store_id || apiConfig.storeId;
      let identifier: string;
      if (params.id) {
        identifier = params.id;
      } else if (params.slug) {
        identifier = `${target_store_id}:${apiConfig.locale}:${params.slug}`;
      } else {
        throw new Error("GetProductParams requires id or slug");
      }

      return apiConfig.httpClient.get<Product>(
        `/v1/stores/${target_store_id}/products/${identifier}`,
        options,
      );
    },

    async getProductInventory(
      params: GetProductParams,
      options?: RequestOptions,
    ): Promise<ProductInventory[]> {
      const target_store_id = params.store_id || apiConfig.storeId;
      const identifier = params.id
        ? params.id
        : params.slug
          ? `${target_store_id}:${apiConfig.locale}:${params.slug}`
          : null;
      if (!identifier) throw new Error("GetProductParams requires id or slug");
      return apiConfig.httpClient.get<ProductInventory[]>(
        `/v1/stores/${target_store_id}/products/${identifier}/inventory`,
        options,
      );
    },

    async getProducts(
      params: GetProductsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Product>> {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<Product>>(
        `/v1/stores/${encodeURIComponent(target_store_id)}/products`,
        {
          ...options,
          params: queryParams,
        },
      );
    },

    async createBookingService(
      params: CreateBookingServiceParams,
      options?: RequestOptions,
    ): Promise<BookingService> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<BookingService>(
        `/v1/stores/${target_store_id}/booking-services`,
        payload,
        options,
      );
    },

    async updateBookingService(
      params: UpdateBookingServiceParams,
      options?: RequestOptions,
    ): Promise<BookingService> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<BookingService>(
        `/v1/stores/${target_store_id}/booking-services/${params.id}`,
        payload,
        options,
      );
    },

    async deleteBookingService(
      params: DeleteBookingServiceParams,
      options?: RequestOptions,
    ): Promise<boolean> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<boolean>(
        `/v1/stores/${target_store_id}/booking-services/${params.id}`,
        options,
      );
    },

    async getBookingService(
      params: GetBookingServiceParams,
      options?: RequestOptions,
    ): Promise<BookingService> {
      const store_id = params.store_id || apiConfig.storeId;
      let identifier: string;
      if (params.id) {
        identifier = params.id;
      } else if (params.slug) {
        identifier = `${store_id}:${apiConfig.locale}:${params.slug}`;
      } else {
        throw new Error("GetBookingServiceParams requires id or slug");
      }

      return apiConfig.httpClient.get<BookingService>(
        `/v1/stores/${store_id}/booking-services/${identifier}`,
        options,
      );
    },

    async findBookingServices(
      params: FindBookingServicesParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<BookingService>> {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<BookingService>>(
        `/v1/stores/${target_store_id}/booking-services`,
        {
          ...options,
          params: queryParams,
        },
      );
    },

    async getBookingServiceAvailability(
      params: GetAvailabilityParams,
      options?: RequestOptions,
    ): Promise<AvailabilityResponse> {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<AvailabilityResponse>(
        `/v1/stores/${target_store_id}/booking-services/availability`,
        { ...options, params: queryParams },
      );
    },

    async createBookingResource(
      params: CreateBookingResourceParams,
      options?: RequestOptions,
    ): Promise<BookingResource> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<BookingResource>(
        `/v1/stores/${target_store_id}/booking-resources`,
        payload,
        options,
      );
    },

    async updateBookingResource(
      params: UpdateBookingResourceParams,
      options?: RequestOptions,
    ): Promise<BookingResource> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<BookingResource>(
        `/v1/stores/${target_store_id}/booking-resources/${params.id}`,
        payload,
        options,
      );
    },

    async deleteBookingResource(
      params: DeleteBookingResourceParams,
      options?: RequestOptions,
    ): Promise<boolean> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<boolean>(
        `/v1/stores/${target_store_id}/booking-resources/${params.id}`,
        options,
      );
    },

    async getBookingResource(
      params: GetBookingResourceParams,
      options?: RequestOptions,
    ): Promise<BookingResource> {
      const store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<BookingResource>(
        `/v1/stores/${store_id}/booking-resources/${params.id}`,
        options,
      );
    },

    async findBookingResources(
      params: FindBookingResourcesParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<BookingResource>> {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<BookingResource>>(
        `/v1/stores/${target_store_id}/booking-resources`,
        {
          ...options,
          params: queryParams,
        },
      );
    },

    async findBookingOfferings(
      params: FindBookingOfferingsParams,
      options?: RequestOptions,
    ): Promise<BookingOffering[]> {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<BookingOffering[]>(
        `/v1/stores/${target_store_id}/booking-offerings`,
        { ...options, params: queryParams },
      );
    },

    async createBookingOffering(
      params: CreateBookingOfferingParams,
      options?: RequestOptions,
    ): Promise<BookingOffering> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<BookingOffering>(
        `/v1/stores/${target_store_id}/booking-offerings`,
        payload,
        options,
      );
    },

    async updateBookingOffering(
      params: UpdateBookingOfferingParams,
      options?: RequestOptions,
    ): Promise<BookingOffering> {
      const { store_id, id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<BookingOffering>(
        `/v1/stores/${target_store_id}/booking-offerings/${id}`,
        payload,
        options,
      );
    },

    async deleteBookingOffering(
      params: DeleteBookingOfferingParams,
      options?: RequestOptions,
    ): Promise<boolean> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<boolean>(
        `/v1/stores/${target_store_id}/booking-offerings/${params.id}`,
        options,
      );
    },

    async updateOrder(
      params: UpdateOrderParams,
      options?: RequestOptions,
    ): Promise<Order> {
      const { store_id, product_items, booking_items, ...rest } = params;
      const target_store_id = store_id || apiConfig.storeId;
      const payload = {
        ...rest,
        ...(product_items ? { product_items } : {}),
        ...(booking_items ? { booking_items } : {}),
      };

      return apiConfig.httpClient.put<Order>(
        `/v1/stores/${target_store_id}/orders/${params.id}`,
        payload,
        options,
      );
    },

    async cancelOrderProduct(
      params: CancelOrderProductParams,
      options?: RequestOptions,
    ): Promise<Order> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Order>(
        `/v1/stores/${target_store_id}/orders/${params.order_id}/products/${params.order_product_id}/cancel`,
        payload,
        options,
      );
    },

    async getOrder(
      params: GetOrderParams,
      options?: RequestOptions,
    ): Promise<Order> {
      const target_store_id = params.store_id || apiConfig.storeId;

      return apiConfig.httpClient.get<Order>(
        `/v1/stores/${target_store_id}/orders/${params.id}`,
        options,
      );
    },

    async getOrderProducts(
      params: GetOrderParams,
      options?: RequestOptions,
    ): Promise<OrderProduct[]> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<OrderProduct[]>(
        `/v1/stores/${target_store_id}/orders/${params.id}/products`,
        options,
      );
    },

    async getOrderDigitalProducts(
      params: GetOrderParams,
      options?: RequestOptions,
    ): Promise<OrderDigitalProduct[]> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<OrderDigitalProduct[]>(
        `/v1/stores/${target_store_id}/orders/${params.id}/digital-products`,
        options,
      );
    },

    async getOrders(
      params: GetOrdersParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Order>> {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<Order>>(
        `/v1/stores/${target_store_id}/orders`,
        {
          ...options,
          params: queryParams,
        },
      );
    },

    async getCarts(
      params: FindCartsParams = {},
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Cart>> {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<Cart>>(
        `/v1/stores/${target_store_id}/carts`,
        {
          ...options,
          params: queryParams,
        },
      );
    },

    async getCart(
      params: GetCartParams,
      options?: RequestOptions,
    ): Promise<Cart> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<Cart>(
        `/v1/stores/${target_store_id}/carts/${params.id}`,
        options,
      );
    },

    async createCart(
      params: CreateCartParams,
      options?: RequestOptions,
    ): Promise<Cart> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Cart>(
        `/v1/stores/${target_store_id}/carts`,
        {
          ...payload,
          product_items: payload.product_items || [],
          booking_items: payload.booking_items || [],
          digital_items: payload.digital_items || [],
        },
        options,
      );
    },

    async updateCart(
      params: UpdateCartParams,
      options?: RequestOptions,
    ): Promise<Cart> {
      const {
        id,
        store_id,
        product_items,
        booking_items,
        digital_items,
        ...payload
      } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<Cart>(
        `/v1/stores/${target_store_id}/carts/${id}`,
        {
          ...payload,
          ...(product_items ? { product_items } : {}),
          ...(booking_items ? { booking_items } : {}),
          ...(digital_items ? { digital_items } : {}),
        },
        options,
      );
    },

    async addCartProduct(
      params: AddCartProductParams,
      options?: RequestOptions,
    ): Promise<Cart> {
      const { id, store_id, product } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Cart>(
        `/v1/stores/${target_store_id}/carts/${id}/product-items`,
        { product },
        options,
      );
    },

    async addCartBooking(
      params: AddCartBookingParams,
      options?: RequestOptions,
    ): Promise<Cart> {
      const { id, store_id, booking } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Cart>(
        `/v1/stores/${target_store_id}/carts/${id}/booking-items`,
        { booking },
        options,
      );
    },

    async addCartDigitalProduct(
      params: AddCartDigitalProductParams,
      options?: RequestOptions,
    ): Promise<Cart> {
      const { id, store_id, digital } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Cart>(
        `/v1/stores/${target_store_id}/carts/${id}/digital-items`,
        { digital },
        options,
      );
    },

    async removeCartItem(
      params: RemoveCartItemParams,
      options?: RequestOptions,
    ): Promise<Cart> {
      const { id, store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Cart>(
        `/v1/stores/${target_store_id}/carts/${id}/items/remove`,
        payload,
        options,
      );
    },

    async clearCart(
      params: ClearCartParams,
      options?: RequestOptions,
    ): Promise<Cart> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Cart>(
        `/v1/stores/${target_store_id}/carts/${params.id}/clear`,
        {},
        options,
      );
    },

    async quoteCart(
      params: QuoteCartParams,
      options?: RequestOptions,
    ): Promise<OrderQuote> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<OrderQuote>(
        `/v1/stores/${target_store_id}/carts/${params.id}/quote`,
        {},
        options,
      );
    },

    async checkoutCart(
      params: CheckoutCartParams,
      options?: RequestOptions,
    ): Promise<import("../types").OrderCheckoutResult> {
      const { id, store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<import("../types").OrderCheckoutResult>(
        `/v1/stores/${target_store_id}/carts/${id}/checkout`,
        payload,
        options,
      );
    },

    async getQuote(
      params: GetQuoteParams,
      options?: RequestOptions,
    ): Promise<OrderQuote> {
      const { store_id, products, bookings, digital, ...rest } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<OrderQuote>(
        `/v1/stores/${target_store_id}/orders/quote`,
        {
          ...rest,
          products: products || [],
          bookings: bookings || [],
          digital: digital || [],
          market: rest.market || apiConfig.market,
        },
        options,
      );
    },

    async createRefund(
      params: CreateOrderRefundParams,
      options?: RequestOptions,
    ): Promise<CreateOrderRefundResponse> {
      const target_store_id = params.store_id || apiConfig.storeId;
      const response =
        await apiConfig.httpClient.post<CreateOrderRefundResponse>(
          `/v1/stores/${target_store_id}/orders/${params.order_id}/refunds`,
          {
            amount: params.amount,
            refund_id: params.refund_id,
            allocations: params.allocations,
            reason: params.reason,
            private_note: params.private_note,
          },
          options,
        );
      return validateRefundResponse(response, params.refund_id, params.amount);
    },

    async recordCashOnDeliveryRefund(
      params: RecordCashOnDeliveryRefundParams,
      options?: RequestOptions,
    ): Promise<CreateOrderRefundResponse> {
      const target_store_id = params.store_id || apiConfig.storeId;
      const response =
        await apiConfig.httpClient.post<CreateOrderRefundResponse>(
          `/v1/stores/${target_store_id}/orders/${params.order_id}/refunds/cash-on-delivery`,
          {
            amount: params.amount,
            refund_id: params.refund_id,
            allocations: params.allocations,
            reason: params.reason,
            private_note: params.private_note,
          },
          options,
        );
      return validateRefundResponse(response, params.refund_id, params.amount);
    },

    async getPayment(
      params: GetOrderPaymentParams,
      options?: RequestOptions,
    ): Promise<OrderPayment> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<OrderPayment>(
        `/v1/stores/${target_store_id}/orders/${params.order_id}/payment`,
        options,
      );
    },

    async markCashOnDeliveryPaid(
      params: MarkCashOnDeliveryPaidParams,
      options?: RequestOptions,
    ): Promise<OrderPayment> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<OrderPayment>(
        `/v1/stores/${target_store_id}/orders/${params.order_id}/payment/cash-on-delivery/mark-paid`,
        {},
        options,
      );
    },

    async getDisputes(
      params: FindPaymentDisputesParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<PaymentDispute>> {
      const { order_id, store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<PaymentDispute>>(
        `/v1/stores/${target_store_id}/orders/${order_id}/disputes`,
        { ...options, params: queryParams },
      );
    },

    async getDispute(
      params: GetPaymentDisputeParams,
      options?: RequestOptions,
    ): Promise<PaymentDispute> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaymentDispute>(
        `/v1/stores/${target_store_id}/orders/${params.order_id}/disputes/${params.dispute_id}`,
        options,
      );
    },

    async getRefund(
      params: GetOrderRefundParams,
      options?: RequestOptions,
    ): Promise<OrderRefund> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<OrderRefund>(
        `/v1/stores/${target_store_id}/orders/${params.order_id}/refunds/${params.refund_id}`,
        options,
      );
    },

    async getRefunds(
      params: FindOrderRefundsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<OrderRefund>> {
      const { order_id, store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<OrderRefund>>(
        `/v1/stores/${target_store_id}/orders/${order_id}/refunds`,
        { ...options, params: queryParams },
      );
    },
  };
};
