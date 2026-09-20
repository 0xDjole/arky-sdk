import type { ApiConfig } from "../services/clientTypes";
import { checkoutCart, pendingCartCheckout, recoverCartCheckout, withCartMutation } from "../services/cartCheckout";
import type { CartCheckoutTransport, CartCheckoutRequest, RecoverCartCheckoutParams } from "../types/cartCheckout";
import type { OrderCheckoutResult } from "../types/index";
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
  GetBookingOfferingByBindingParams,
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
  AddCartCustomerGroupPlanParams,
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

import type { Checkout } from "../types/checkout";

export const createEshopApi = (apiConfig: ApiConfig) => {
  function checkoutScope(storeId: string): string {
    return `admin:${apiConfig.baseUrl}:${storeId}`;
  }

  function checkoutTransport(storeId: string): CartCheckoutTransport<OrderCheckoutResult> {
    return {
      post: ({ id, request_id, ...request }, options) => apiConfig.httpClient.post<OrderCheckoutResult>(
        `/v1/stores/${encodeURIComponent(storeId)}/checkouts`,
        { ...request, request_id },
        options,
      ),
      getCheckout: (id, options) => apiConfig.httpClient.get<Checkout>(
        `/v1/stores/${encodeURIComponent(storeId)}/checkouts/${encodeURIComponent(id)}`, options,
      ),
    };
  }

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

    getProductByKey(
      params: GetProductByKeyParams,
      options?: RequestOptions,
    ): Promise<Product> {
      const storeId = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<Product>(
        `/v1/stores/${encodeURIComponent(storeId)}/products/by-key/${encodeURIComponent(params.key)}`,
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

    getBookingServiceByKey(
      params: GetBookingServiceByKeyParams,
      options?: RequestOptions,
    ): Promise<BookingService> {
      const storeId = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<BookingService>(
        `/v1/stores/${encodeURIComponent(storeId)}/booking-services/by-key/${encodeURIComponent(params.key)}`,
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

    getBookingResourceByKey(
      params: GetBookingResourceByKeyParams,
      options?: RequestOptions,
    ): Promise<BookingResource> {
      const storeId = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<BookingResource>(
        `/v1/stores/${encodeURIComponent(storeId)}/booking-resources/by-key/${encodeURIComponent(params.key)}`,
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

    getBookingOfferingByBinding(
      params: GetBookingOfferingByBindingParams,
      options?: RequestOptions,
    ): Promise<BookingOffering> {
      const { store_id, ...query } = params;
      return apiConfig.httpClient.get<BookingOffering>(
        `/v1/stores/${encodeURIComponent(store_id || apiConfig.storeId)}/booking-offerings/by-binding`,
        { ...options, params: query },
      );
    },

    async findBookingOfferings(
      params: FindBookingOfferingsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<BookingOffering>> {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<BookingOffering>>(
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

    async getOrderFinancialSummary(
      params: GetOrderFinancialSummaryParams,
      options?: RequestOptions,
    ): Promise<OrderFinancialSummary> {
      const { id, store_id } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<OrderFinancialSummary>(
        `/v1/stores/${encodeURIComponent(target_store_id)}/orders/${encodeURIComponent(id)}/financial-summary`,
        options,
      );
    },

    async updateOrder(
      params: UpdateOrderParams,
      options?: RequestOptions,
    ): Promise<Order> {
      const { id, store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<Order>(
        `/v1/stores/${encodeURIComponent(target_store_id)}/orders/${encodeURIComponent(id)}`,
        payload,
        options,
      );
    },

    async cancelOrderProductItem(
      params: CancelOrderProductItemParams,
      options?: RequestOptions,
    ): Promise<Order> {
      const { store_id, order_id, order_product_item_id, quantity } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Order>(
        `/v1/stores/${target_store_id}/orders/${order_id}/product-items/${order_product_item_id}/cancel`,
        { quantity },
        options,
      );
    },

    async cancelBookingItem(
      params: BookingItemLifecycleParams,
      options?: RequestOptions,
    ): Promise<Order> {
      const { store_id, order_id, order_booking_item_id } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Order>(
        `/v1/stores/${target_store_id}/orders/${order_id}/booking-items/${order_booking_item_id}/cancel`,
        {},
        options,
      );
    },

    async completeBookingItem(
      params: BookingItemLifecycleParams,
      options?: RequestOptions,
    ): Promise<Order> {
      const { store_id, order_id, order_booking_item_id } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Order>(
        `/v1/stores/${target_store_id}/orders/${order_id}/booking-items/${order_booking_item_id}/complete`,
        {},
        options,
      );
    },

    async markBookingItemNoShow(
      params: BookingItemLifecycleParams,
      options?: RequestOptions,
    ): Promise<Order> {
      const { store_id, order_id, order_booking_item_id } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Order>(
        `/v1/stores/${target_store_id}/orders/${order_id}/booking-items/${order_booking_item_id}/no-show`,
        {},
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

    async getOrderPayment(
      params: GetOrderPaymentParams,
      options?: RequestOptions,
    ): Promise<Payment> {
      const storeId = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<Payment>(
        `/v1/stores/${encodeURIComponent(storeId)}/orders/${encodeURIComponent(params.order_id)}/payments/${encodeURIComponent(params.payment_id)}`,
        options,
      );
    },

    async findOrderPayments(
      params: FindOrderPaymentsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Payment>> {
      const { store_id, order_id, ...query } = params;
      const storeId = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<Payment>>(
        `/v1/stores/${encodeURIComponent(storeId)}/orders/${encodeURIComponent(order_id)}/payments`,
        { ...options, params: query },
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
        `/v1/stores/${encodeURIComponent(target_store_id)}/carts`,
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
        `/v1/stores/${encodeURIComponent(target_store_id)}/carts/${encodeURIComponent(params.id)}`,
        options,
      );
    },

    async createCart(
      params: CreateCartParams,
      options?: RequestOptions,
    ): Promise<CreatedCart> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return withCartMutation(checkoutScope(target_store_id), () => apiConfig.httpClient.post<CreatedCart>(
        `/v1/stores/${encodeURIComponent(target_store_id)}/carts`,
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
      const target_store_id = store_id || apiConfig.storeId;
      return withCartMutation(checkoutScope(target_store_id), () => apiConfig.httpClient.put<Cart>(
        `/v1/stores/${encodeURIComponent(target_store_id)}/carts/${encodeURIComponent(id)}`,
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
      const target_store_id = store_id || apiConfig.storeId;
      return withCartMutation(checkoutScope(target_store_id), () => apiConfig.httpClient.post<Cart>(
        `/v1/stores/${encodeURIComponent(target_store_id)}/carts/${encodeURIComponent(id)}/product-items`,
        { product },
        options,
      ));
    },

    async addCartBooking(
      params: AddCartBookingParams,
      options?: RequestOptions,
    ): Promise<Cart> {
      const { id, store_id, booking } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return withCartMutation(checkoutScope(target_store_id), () => apiConfig.httpClient.post<Cart>(
        `/v1/stores/${encodeURIComponent(target_store_id)}/carts/${encodeURIComponent(id)}/booking-items`,
        { booking },
        options,
      ));
    },

    async addCartDigitalProduct(
      params: AddCartDigitalProductParams,
      options?: RequestOptions,
    ): Promise<Cart> {
      const { id, store_id, digital } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return withCartMutation(checkoutScope(target_store_id), () => apiConfig.httpClient.post<Cart>(
        `/v1/stores/${encodeURIComponent(target_store_id)}/carts/${encodeURIComponent(id)}/digital-items`,
        { digital },
        options,
      ));
    },

    async addCartCustomerGroupPlan(
      params: AddCartCustomerGroupPlanParams,
      options?: RequestOptions,
    ): Promise<Cart> {
      const { id, store_id, customer_group_plan } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return withCartMutation(checkoutScope(target_store_id), () => apiConfig.httpClient.post<Cart>(
        `/v1/stores/${encodeURIComponent(target_store_id)}/carts/${encodeURIComponent(id)}/customer-group-plan-items`,
        { customer_group_plan },
        options,
      ));
    },

    async removeCartItem(
      params: RemoveCartItemParams,
      options?: RequestOptions,
    ): Promise<Cart> {
      const { id, store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return withCartMutation(checkoutScope(target_store_id), () => apiConfig.httpClient.post<Cart>(
        `/v1/stores/${encodeURIComponent(target_store_id)}/carts/${encodeURIComponent(id)}/items/remove`,
        payload,
        options,
      ));
    },

    async clearCart(
      params: ClearCartParams,
      options?: RequestOptions,
    ): Promise<Cart> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return withCartMutation(checkoutScope(target_store_id), () => apiConfig.httpClient.post<Cart>(
        `/v1/stores/${encodeURIComponent(target_store_id)}/carts/${encodeURIComponent(params.id)}/clear`,
        {},
        options,
      ));
    },

    async quoteCart(
      params: QuoteCartParams,
      options?: RequestOptions,
    ): Promise<CheckoutQuote> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<CheckoutQuote>(
        `/v1/stores/${encodeURIComponent(target_store_id)}/carts/${encodeURIComponent(params.id)}/quote`,
        { locale: params.locale ?? apiConfig.locale },
        options,
      );
    },

    async checkoutCart(
      params: CheckoutCartParams,
      options?: RequestOptions,
    ): Promise<import("../types").OrderCheckoutResult> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return checkoutCart(checkoutScope(target_store_id), payload, checkoutTransport(target_store_id), options);
    },

    async pendingCartCheckout(params: RecoverCartCheckoutParams = {}): Promise<CartCheckoutRequest | null> {
      return pendingCartCheckout(checkoutScope(params.store_id || apiConfig.storeId));
    },

    async recoverCartCheckout(params: RecoverCartCheckoutParams = {}, options?: RequestOptions): Promise<OrderCheckoutResult | null> {
      const storeId = params.store_id || apiConfig.storeId;
      return recoverCartCheckout(checkoutScope(storeId), checkoutTransport(storeId), options);
    },

    async getQuote(
      params: GetQuoteParams,
      options?: RequestOptions,
    ): Promise<CheckoutQuote> {
      const { store_id, line_items, delivery_groups, ...rest } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<CheckoutQuote>(
        `/v1/stores/${encodeURIComponent(target_store_id)}/orders/quote`,
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
