import { requireRequestId } from "../utils/requestId";
import type { CartAccessProductPreview, PreviewCartAccessProductParams } from "../types/purchaseAccess";
import { requireStoreId } from "../utils/storeTarget";
import type { ApiConfig } from "../services/clientTypes";
import type { AcceptCartFutureDeliveriesParams, CartFutureDeliveryQuote, QuoteCartFutureDeliveriesParams } from "../types/cartDelivery";
import type { OrderBooking, GetOrderBookingParams } from "../types/orderBooking";
import type { CancelPendingOrderParams, OrderCancellationAcceptance } from "../types/orderCancellation";
import { checkoutCart, retainCartCheckout, pendingCartCheckout, recoverCartCheckout, withCartMutation } from "../services/cartCheckout";
import type { CartCheckoutTransport, CartCheckoutRequest, RecoverCartCheckoutParams } from "../types/cartCheckout";
import type { OrderCheckoutResult } from "../types/index";
import type { RevokeOrderAccessParams } from "../types/orderLineItem";
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
  LookupBookingOfferingParams,
  GetBookingResourceParams,
  GetBookingResourceByKeyParams,
  GetProductParams,
  GetProductByKeyParams,
  GetProductsParams,
  FindBookingResourcesParams,
  GetQuoteParams,
  GetAvailabilityParams,
  AvailabilityResponse,
  AddCartBookingParams,
  AddCartSubscriptionPlanParams,
  AddCartDigitalProductParams,
  AddCartProductParams,
  CheckoutCartParams,
  ClearCartParams,
  CreateCartParams,
  FindCartsParams,
  GetCartParams,
  GetBookingServiceParams,
  GetBookingServiceByKeyParams,
  FindBookingServicesParams,
  UpdateOrderParams,
  CancelOrderProductItemParams,
  BookingItemLifecycleParams,
  CancelBookingItemParams,
  UpdateBookingResourceParams,
  UpdateBookingServiceParams,
  UpdateBookingOfferingParams,
  GetOrderParams,
  GetOrdersParams,
  GetOrderPaymentParams,
  FindOrderPaymentsParams,
  QuoteCartParams,
  RemoveCartItemParams,
  RequestOptions,
  UpdateCartParams,
} from "../types/api";
import type {
  Order,
  OrderFinancialSummary,
  GetOrderFinancialSummaryParams,
  Product,
  BookingResource,
  BookingService,
  BookingOffering,
  CheckoutQuote,
  Cart,
  CreatedCart,
  PaginatedResponse,
  Payment,
} from "../types";

export const createEshopApi = (apiConfig: ApiConfig) => {
  function checkoutScope(storeId: string): string {
    return `admin:${apiConfig.baseUrl}:${storeId}`;
  }

  function checkoutTransport(storeId: string): CartCheckoutTransport<OrderCheckoutResult> {
    return {
      post: ({ id, request_id, ...request }, options) => { requireRequestId(request_id); return apiConfig.httpClient.post<OrderCheckoutResult>(
        `/v1/stores/${requireStoreId(storeId)}/carts/accept`,
        { ...request, request_id },
        options,
      ); },
      getOrder: (id, options) => apiConfig.httpClient.get<Order>(
        `/v1/stores/${requireStoreId(storeId)}/orders/${encodeURIComponent(id)}`, options,
      ),
    };
  }

  return {
    async createProduct(
      params: CreateProductParams,
      options?: RequestOptions,
    ): Promise<Product> {
      const { store_id, ...payload } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.post<Product>(
        `/v1/stores/${requireStoreId(target_store_id)}/products`,
        payload,
        options,
      );
    },

    async updateProduct(
      params: UpdateProductParams,
      options?: RequestOptions,
    ): Promise<Product> {
      const { store_id, id, ...payload } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.put<Product>(
        `/v1/stores/${requireStoreId(target_store_id)}/products/${params.id}`,
        payload,
        options,
      );
    },

    async deleteProduct(
      params: DeleteProductParams,
      options?: RequestOptions,
    ): Promise<{ deleted: boolean }> {
      const target_store_id = requireStoreId(params.store_id);
      return apiConfig.httpClient.delete<{ deleted: boolean }>(
        `/v1/stores/${requireStoreId(target_store_id)}/products/${params.id}`,
        options,
      );
    },

    async getProduct(
      params: GetProductParams,
      options?: RequestOptions,
    ): Promise<Product> {
      const target_store_id = requireStoreId(params.store_id);
      let identifier: string;
      if (params.id) {
        identifier = params.id;
      } else if (params.slug) {
        identifier = `${target_store_id}:${apiConfig.locale}:${params.slug}`;
      } else {
        throw new Error("GetProductParams requires id or slug");
      }

      return apiConfig.httpClient.get<Product>(
        `/v1/stores/${requireStoreId(target_store_id)}/products/${identifier}`,
        options,
      );
    },

    getProductByKey(
      params: GetProductByKeyParams,
      options?: RequestOptions,
    ): Promise<Product> {
      const storeId = requireStoreId(params.store_id);
      return apiConfig.httpClient.get<Product>(
        `/v1/stores/${requireStoreId(storeId)}/products/by-key/${encodeURIComponent(params.key)}`,
        options,
      );
    },

    async getProducts(
      params: GetProductsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Product>> {
      const { store_id, ...queryParams } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.get<PaginatedResponse<Product>>(
        `/v1/stores/${requireStoreId(target_store_id)}/products`,
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
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.post<BookingService>(
        `/v1/stores/${requireStoreId(target_store_id)}/booking-services`,
        payload,
        options,
      );
    },

    async updateBookingService(
      params: UpdateBookingServiceParams,
      options?: RequestOptions,
    ): Promise<BookingService> {
      const { store_id, id, ...payload } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.put<BookingService>(
        `/v1/stores/${requireStoreId(target_store_id)}/booking-services/${params.id}`,
        payload,
        options,
      );
    },

    async deleteBookingService(
      params: DeleteBookingServiceParams,
      options?: RequestOptions,
    ): Promise<boolean> {
      const target_store_id = requireStoreId(params.store_id);
      return apiConfig.httpClient.delete<boolean>(
        `/v1/stores/${requireStoreId(target_store_id)}/booking-services/${params.id}`,
        options,
      );
    },

    async getBookingService(
      params: GetBookingServiceParams,
      options?: RequestOptions,
    ): Promise<BookingService> {
      const store_id = requireStoreId(params.store_id);
      let identifier: string;
      if (params.id) {
        identifier = params.id;
      } else if (params.slug) {
        identifier = `${store_id}:${apiConfig.locale}:${params.slug}`;
      } else {
        throw new Error("GetBookingServiceParams requires id or slug");
      }

      return apiConfig.httpClient.get<BookingService>(
        `/v1/stores/${requireStoreId(store_id)}/booking-services/${identifier}`,
        options,
      );
    },

    getBookingServiceByKey(
      params: GetBookingServiceByKeyParams,
      options?: RequestOptions,
    ): Promise<BookingService> {
      const storeId = requireStoreId(params.store_id);
      return apiConfig.httpClient.get<BookingService>(
        `/v1/stores/${requireStoreId(storeId)}/booking-services/by-key/${encodeURIComponent(params.key)}`,
        options,
      );
    },

    async findBookingServices(
      params: FindBookingServicesParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<BookingService>> {
      const { store_id, ...queryParams } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.get<PaginatedResponse<BookingService>>(
        `/v1/stores/${requireStoreId(target_store_id)}/booking-services`,
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
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.get<AvailabilityResponse>(
        `/v1/stores/${requireStoreId(target_store_id)}/booking-services/availability`,
        { ...options, params: queryParams },
      );
    },

    async createBookingResource(
      params: CreateBookingResourceParams,
      options?: RequestOptions,
    ): Promise<BookingResource> {
      const { store_id, ...payload } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.post<BookingResource>(
        `/v1/stores/${requireStoreId(target_store_id)}/booking-resources`,
        payload,
        options,
      );
    },

    async updateBookingResource(
      params: UpdateBookingResourceParams,
      options?: RequestOptions,
    ): Promise<BookingResource> {
      const { store_id, id, ...payload } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.put<BookingResource>(
        `/v1/stores/${requireStoreId(target_store_id)}/booking-resources/${params.id}`,
        payload,
        options,
      );
    },

    async deleteBookingResource(
      params: DeleteBookingResourceParams,
      options?: RequestOptions,
    ): Promise<boolean> {
      const target_store_id = requireStoreId(params.store_id);
      return apiConfig.httpClient.delete<boolean>(
        `/v1/stores/${requireStoreId(target_store_id)}/booking-resources/${params.id}`,
        options,
      );
    },

    async getBookingResource(
      params: GetBookingResourceParams,
      options?: RequestOptions,
    ): Promise<BookingResource> {
      const store_id = requireStoreId(params.store_id);
      return apiConfig.httpClient.get<BookingResource>(
        `/v1/stores/${requireStoreId(store_id)}/booking-resources/${params.id}`,
        options,
      );
    },

    getBookingResourceByKey(
      params: GetBookingResourceByKeyParams,
      options?: RequestOptions,
    ): Promise<BookingResource> {
      const storeId = requireStoreId(params.store_id);
      return apiConfig.httpClient.get<BookingResource>(
        `/v1/stores/${requireStoreId(storeId)}/booking-resources/by-key/${encodeURIComponent(params.key)}`,
        options,
      );
    },

    async findBookingResources(
      params: FindBookingResourcesParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<BookingResource>> {
      const { store_id, ...queryParams } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.get<PaginatedResponse<BookingResource>>(
        `/v1/stores/${requireStoreId(target_store_id)}/booking-resources`,
        {
          ...options,
          params: queryParams,
        },
      );
    },

    lookupBookingOffering(
      params: LookupBookingOfferingParams,
      options?: RequestOptions,
    ): Promise<BookingOffering> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<BookingOffering>(
        `/v1/stores/${encodeURIComponent(requireStoreId(store_id))}/booking-offerings/lookup`,
        { ...options, params: query },
      );
    },

    async findBookingOfferings(
      params: FindBookingOfferingsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<BookingOffering>> {
      const { store_id, ...queryParams } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.get<PaginatedResponse<BookingOffering>>(
        `/v1/stores/${requireStoreId(target_store_id)}/booking-offerings`,
        { ...options, params: queryParams },
      );
    },

    async createBookingOffering(
      params: CreateBookingOfferingParams,
      options?: RequestOptions,
    ): Promise<BookingOffering> {
      const { store_id, ...payload } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.post<BookingOffering>(
        `/v1/stores/${requireStoreId(target_store_id)}/booking-offerings`,
        payload,
        options,
      );
    },

    async updateBookingOffering(
      params: UpdateBookingOfferingParams,
      options?: RequestOptions,
    ): Promise<BookingOffering> {
      const { store_id, id, ...payload } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.put<BookingOffering>(
        `/v1/stores/${requireStoreId(target_store_id)}/booking-offerings/${id}`,
        payload,
        options,
      );
    },

    async deleteBookingOffering(
      params: DeleteBookingOfferingParams,
      options?: RequestOptions,
    ): Promise<boolean> {
      const target_store_id = requireStoreId(params.store_id);
      return apiConfig.httpClient.delete<boolean>(
        `/v1/stores/${requireStoreId(target_store_id)}/booking-offerings/${params.id}`,
        options,
      );
    },

    async getOrderFinancialSummary(
      params: GetOrderFinancialSummaryParams,
      options?: RequestOptions,
    ): Promise<OrderFinancialSummary> {
      const { id, store_id } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.get<OrderFinancialSummary>(
        `/v1/stores/${requireStoreId(target_store_id)}/orders/${encodeURIComponent(id)}/financial-summary`,
        options,
      );
    },

    async updateOrder(
      params: UpdateOrderParams,
      options?: RequestOptions,
    ): Promise<Order> {
      const { id, store_id, ...payload } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.put<Order>(
        `/v1/stores/${requireStoreId(target_store_id)}/orders/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },

    async revokeOrderAccess(
      params: RevokeOrderAccessParams,
      options?: RequestOptions,
    ): Promise<Order> {
      requireRequestId(params.request_id);
      const { store_id, order_id, request_id, line, effective_at, reason } = params;
      return apiConfig.httpClient.post<Order>(
        `/v1/stores/${requireStoreId(store_id)}/orders/${encodeURIComponent(order_id)}/access/revoke`,
        { request_id, line, effective_at, reason },
        options,
      );
    },

    async cancelPendingOrder(
      params: CancelPendingOrderParams,
      options?: RequestOptions,
    ): Promise<OrderCancellationAcceptance> {
      requireRequestId(params.request_id);
      const { store_id, order_id, request_id } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.post<OrderCancellationAcceptance>(
        `/v1/stores/${requireStoreId(target_store_id)}/orders/${encodeURIComponent(order_id)}/cancel`,
        { request_id },
        options,
      );
    },

    async cancelOrderProductItem(
      params: CancelOrderProductItemParams,
      options?: RequestOptions,
    ): Promise<Order> {
      requireRequestId(params.request_id);
      const { store_id, order_id, order_product_item_id, request_id, expected_updated_at, units } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.post<Order>(
        `/v1/stores/${requireStoreId(target_store_id)}/orders/${encodeURIComponent(order_id)}/product-items/${encodeURIComponent(order_product_item_id)}/cancel`,
        { request_id, expected_updated_at, units },
        options,
      );
    },

    async getBookingAppointment(
      params: GetOrderBookingParams,
      options?: RequestOptions,
    ): Promise<OrderBooking> {
      const { store_id, order_id, order_booking_item_id } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.get<OrderBooking>(
        `/v1/stores/${requireStoreId(target_store_id)}/orders/${encodeURIComponent(order_id)}/booking-items/${encodeURIComponent(order_booking_item_id)}/appointment`,
        options,
      );
    },

    async cancelBookingItem(
      params: CancelBookingItemParams,
      options?: RequestOptions,
    ): Promise<Order> {
      requireRequestId(params.request_id);
      const { store_id, order_id, order_booking_item_id, request_id } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.post<Order>(
        `/v1/stores/${requireStoreId(target_store_id)}/orders/${encodeURIComponent(order_id)}/booking-items/${encodeURIComponent(order_booking_item_id)}/cancel`,
        { request_id },
        options,
      );
    },

    async completeBookingItem(
      params: BookingItemLifecycleParams,
      options?: RequestOptions,
    ): Promise<Order> {
      const { store_id, order_id, order_booking_item_id } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.post<Order>(
        `/v1/stores/${requireStoreId(target_store_id)}/orders/${order_id}/booking-items/${order_booking_item_id}/complete`,
        undefined,
        options,
      );
    },

    async markBookingItemNoShow(
      params: BookingItemLifecycleParams,
      options?: RequestOptions,
    ): Promise<Order> {
      const { store_id, order_id, order_booking_item_id } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.post<Order>(
        `/v1/stores/${requireStoreId(target_store_id)}/orders/${order_id}/booking-items/${order_booking_item_id}/no-show`,
        undefined,
        options,
      );
    },

    async getOrder(
      params: GetOrderParams,
      options?: RequestOptions,
    ): Promise<Order> {
      const target_store_id = requireStoreId(params.store_id);

      return apiConfig.httpClient.get<Order>(
        `/v1/stores/${requireStoreId(target_store_id)}/orders/${params.id}`,
        options,
      );
    },

    async getOrderPayment(
      params: GetOrderPaymentParams,
      options?: RequestOptions,
    ): Promise<Payment> {
      const storeId = requireStoreId(params.store_id);
      return apiConfig.httpClient.get<Payment>(
        `/v1/stores/${requireStoreId(storeId)}/orders/${encodeURIComponent(params.order_id)}/payments/${encodeURIComponent(params.payment_id)}`,
        options,
      );
    },

    async findOrderPayments(
      params: FindOrderPaymentsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Payment>> {
      const { store_id, order_id, ...query } = params;
      const storeId = requireStoreId(store_id);
      return apiConfig.httpClient.get<PaginatedResponse<Payment>>(
        `/v1/stores/${requireStoreId(storeId)}/orders/${encodeURIComponent(order_id)}/payments`,
        { ...options, params: query },
      );
    },

    async getOrders(
      params: GetOrdersParams,
      options?: RequestOptions,
    ): Promise<{ items: Order[]; cursor: string | null }> {
      const { store_id, ...queryParams } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.get<{ items: Order[]; cursor: string | null }>(
        `/v1/stores/${requireStoreId(target_store_id)}/orders`,
        {
          ...options,
          params: queryParams,
        },
      );
    },

    async getCarts(
      params: FindCartsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Cart>> {
      const { store_id, ...queryParams } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.get<PaginatedResponse<Cart>>(
        `/v1/stores/${requireStoreId(target_store_id)}/carts`,
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
      const target_store_id = requireStoreId(params.store_id);
      return apiConfig.httpClient.get<Cart>(
        `/v1/stores/${requireStoreId(target_store_id)}/carts/${encodeURIComponent(params.id)}`,
        options,
      );
    },

    async createCart(
      params: CreateCartParams,
      options?: RequestOptions,
    ): Promise<CreatedCart> {
      const { store_id, ...payload } = params;
      const target_store_id = requireStoreId(store_id);
      return withCartMutation(checkoutScope(target_store_id), () => apiConfig.httpClient.post<CreatedCart>(
        `/v1/stores/${requireStoreId(target_store_id)}/carts`,
        {
          ...payload,
          line_items: payload.line_items || [],
          delivery_groups: payload.delivery_groups || [],
        },
        options,
      ));
    },

    async updateCart(
      params: UpdateCartParams,
      options?: RequestOptions,
    ): Promise<Cart> {
      const { id, store_id, line_items, delivery_groups, ...payload } = params;
      const target_store_id = requireStoreId(store_id);
      return withCartMutation(checkoutScope(target_store_id), () => apiConfig.httpClient.put<Cart>(
        `/v1/stores/${requireStoreId(target_store_id)}/carts/${encodeURIComponent(id)}`,
        {
          ...payload,
          ...(line_items ? { line_items } : {}),
          ...(delivery_groups ? { delivery_groups } : {}),
        },
        options,
      ));
    },

    async addCartProduct(
      params: AddCartProductParams,
      options?: RequestOptions,
    ): Promise<Cart> {
      const { id, store_id, product } = params;
      const target_store_id = requireStoreId(store_id);
      return withCartMutation(checkoutScope(target_store_id), () => apiConfig.httpClient.post<Cart>(
        `/v1/stores/${requireStoreId(target_store_id)}/carts/${encodeURIComponent(id)}/product-items`,
        { product },
        options,
      ));
    },

    async addCartBooking(
      params: AddCartBookingParams,
      options?: RequestOptions,
    ): Promise<Cart> {
      const { id, store_id, booking } = params;
      const target_store_id = requireStoreId(store_id);
      return withCartMutation(checkoutScope(target_store_id), () => apiConfig.httpClient.post<Cart>(
        `/v1/stores/${requireStoreId(target_store_id)}/carts/${encodeURIComponent(id)}/booking-items`,
        { booking },
        options,
      ));
    },

    async addCartDigitalProduct(
      params: AddCartDigitalProductParams,
      options?: RequestOptions,
    ): Promise<Cart> {
      const { id, store_id, digital } = params;
      const target_store_id = requireStoreId(store_id);
      return withCartMutation(checkoutScope(target_store_id), () => apiConfig.httpClient.post<Cart>(
        `/v1/stores/${requireStoreId(target_store_id)}/carts/${encodeURIComponent(id)}/digital-items`,
        { digital },
        options,
      ));
    },

    async addCartSubscriptionPlan(
      params: AddCartSubscriptionPlanParams,
      options?: RequestOptions,
    ): Promise<Cart> {
      const { id, store_id, subscription_plan } = params;
      const target_store_id = requireStoreId(store_id);
      return withCartMutation(checkoutScope(target_store_id), () => apiConfig.httpClient.post<Cart>(
        `/v1/stores/${requireStoreId(target_store_id)}/carts/${encodeURIComponent(id)}/subscription-plan-items`,
        { subscription_plan },
        options,
      ));
    },

    async removeCartItem(
      params: RemoveCartItemParams,
      options?: RequestOptions,
    ): Promise<Cart> {
      const { id, store_id, ...payload } = params;
      const target_store_id = requireStoreId(store_id);
      return withCartMutation(checkoutScope(target_store_id), () => apiConfig.httpClient.post<Cart>(
        `/v1/stores/${requireStoreId(target_store_id)}/carts/${encodeURIComponent(id)}/items/remove`,
        payload,
        options,
      ));
    },

    async clearCart(
      params: ClearCartParams,
      options?: RequestOptions,
    ): Promise<Cart> {
      const target_store_id = requireStoreId(params.store_id);
      return withCartMutation(checkoutScope(target_store_id), () => apiConfig.httpClient.post<Cart>(
        `/v1/stores/${requireStoreId(target_store_id)}/carts/${encodeURIComponent(params.id)}/clear`,
        undefined,
        options,
      ));
    },

    async previewCartAccessProduct(
      params: PreviewCartAccessProductParams,
      options?: RequestOptions,
    ): Promise<CartAccessProductPreview> {
      const { store_id, id, line_item_id, variant_id, quantity, purchase, locale } = params;
      return apiConfig.httpClient.post<CartAccessProductPreview>(
        `/v1/stores/${requireStoreId(store_id)}/carts/${encodeURIComponent(id)}/access-product-preview`,
        { line_item_id, variant_id, quantity, purchase, locale: locale ?? apiConfig.locale },
        options,
      );
    },

    async quoteCart(
      params: QuoteCartParams,
      options?: RequestOptions,
    ): Promise<CheckoutQuote> {
      const target_store_id = requireStoreId(params.store_id);
      return apiConfig.httpClient.post<CheckoutQuote>(
        `/v1/stores/${requireStoreId(target_store_id)}/carts/${encodeURIComponent(params.id)}/quote`,
        { locale: params.locale ?? apiConfig.locale },
        options,
      );
    },

    async quoteCartFutureDeliveries(
      params: QuoteCartFutureDeliveriesParams,
      options?: RequestOptions,
    ): Promise<CartFutureDeliveryQuote> {
      const storeId = requireStoreId(params.store_id);
      return apiConfig.httpClient.post<CartFutureDeliveryQuote>(
        `/v1/stores/${requireStoreId(storeId)}/carts/${encodeURIComponent(params.id)}/future-delivery-quote`,
        { locale: params.locale ?? apiConfig.locale, plans: params.plans },
        options,
      );
    },

    async acceptCartFutureDeliveries(
      params: AcceptCartFutureDeliveriesParams,
      options?: RequestOptions,
    ): Promise<Cart> {
      const storeId = requireStoreId(params.store_id);
      return withCartMutation(checkoutScope(storeId), () => apiConfig.httpClient.put<Cart>(
        `/v1/stores/${requireStoreId(storeId)}/carts/${encodeURIComponent(params.id)}/future-deliveries`,
        { locale: params.locale ?? apiConfig.locale, plans: params.plans },
        options,
      ));
    },

    async checkoutCart(
      params: CheckoutCartParams,
      options?: RequestOptions,
    ): Promise<import("../types").OrderCheckoutResult> {
      requireRequestId(params.request_id);
      const { store_id, ...payload } = params;
      const target_store_id = requireStoreId(store_id);
      return checkoutCart(payload, checkoutTransport(target_store_id), options);
    },

    async retainCartCheckout(params: CheckoutCartParams): Promise<CartCheckoutRequest> {
      requireRequestId(params.request_id);
      const { store_id, ...payload } = params;
      return retainCartCheckout(checkoutScope(requireStoreId(store_id)), payload);
    },

    async pendingCartCheckout(params: RecoverCartCheckoutParams): Promise<CartCheckoutRequest | null> {
      return pendingCartCheckout(checkoutScope(requireStoreId(params.store_id)));
    },

    async recoverCartCheckout(params: RecoverCartCheckoutParams, options?: RequestOptions): Promise<OrderCheckoutResult | null> {
      const storeId = requireStoreId(params.store_id);
      return recoverCartCheckout(checkoutScope(storeId), checkoutTransport(storeId), options);
    },

    async getQuote(
      params: GetQuoteParams,
      options?: RequestOptions,
    ): Promise<CheckoutQuote> {
      const { store_id, line_items, delivery_groups, ...rest } = params;
      const target_store_id = requireStoreId(store_id);
      return apiConfig.httpClient.post<CheckoutQuote>(
        `/v1/stores/${requireStoreId(target_store_id)}/orders/quote`,
        {
          ...rest,
          locale: rest.locale ?? apiConfig.locale,
          line_items: line_items || [],
          delivery_groups: delivery_groups || [],
          market: rest.market,
        },
        options,
      );
    },

  };
};
