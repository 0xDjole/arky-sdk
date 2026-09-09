import type { ApiConfig } from "../services/clientTypes";
import type { CheckoutSubscriptionParams, QuoteSubscriptionParams, SubscriptionCheckoutResult, SubscriptionQuote } from "../types/subscription";
import { checkoutSubscription, subscriptionSelection } from "../services/subscription";
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
  GetBookingResourceParams,
  GetProductParams,
  GetProductsParams,
  FindBookingResourcesParams,
  GetQuoteParams,
  GetAvailabilityParams,
  AvailabilityResponse,
  AddCartBookingParams,
  AddCartAudienceParams,
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
  CancelOrderProductItemParams,
  BookingItemLifecycleParams,
  UpdateBookingResourceParams,
  UpdateBookingServiceParams,
  UpdateBookingOfferingParams,
  GetOrderParams,
  GetOrdersParams,
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
  Cart,
  PaginatedResponse,
} from "../types";

export const createEshopApi = (apiConfig: ApiConfig) => {
  function checkoutScope(storeId: string): string {
    return `admin:${apiConfig.baseUrl}:${storeId}`;
  }

  function checkoutTransport(storeId: string): CartCheckoutTransport<OrderCheckoutResult> {
    return {
      post: ({ id, ...request }, options) => apiConfig.httpClient.post<OrderCheckoutResult>(
        `/v1/stores/${encodeURIComponent(storeId)}/carts/${encodeURIComponent(id)}/checkout`, request, options,
      ),
      getCart: (id, options) => apiConfig.httpClient.get<Cart>(
        `/v1/stores/${encodeURIComponent(storeId)}/carts/${encodeURIComponent(id)}`, options,
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
    ): Promise<Cart> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return withCartMutation(checkoutScope(target_store_id), () => apiConfig.httpClient.post<Cart>(
        `/v1/stores/${encodeURIComponent(target_store_id)}/carts`,
        {
          ...payload,
          product_items: payload.product_items || [],
          booking_items: payload.booking_items || [],
          digital_items: payload.digital_items || [],
          audience_items: payload.audience_items || [],
        },
        options,
      ));
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
        audience_items,
        ...payload
      } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return withCartMutation(checkoutScope(target_store_id), () => apiConfig.httpClient.put<Cart>(
        `/v1/stores/${encodeURIComponent(target_store_id)}/carts/${encodeURIComponent(id)}`,
        {
          ...payload,
          ...(product_items ? { product_items } : {}),
          ...(booking_items ? { booking_items } : {}),
          ...(digital_items ? { digital_items } : {}),
          ...(audience_items ? { audience_items } : {}),
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

    async addCartAudience(
      params: AddCartAudienceParams,
      options?: RequestOptions,
    ): Promise<Cart> {
      const { id, store_id, audience } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return withCartMutation(checkoutScope(target_store_id), () => apiConfig.httpClient.post<Cart>(
        `/v1/stores/${encodeURIComponent(target_store_id)}/carts/${encodeURIComponent(id)}/audience-items`,
        { audience },
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
    ): Promise<OrderQuote> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<OrderQuote>(
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

    async quoteSubscription(
      params: QuoteSubscriptionParams,
      options?: RequestOptions,
    ): Promise<SubscriptionQuote> {
      const storeId = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<SubscriptionQuote>(
        `/v1/stores/${storeId}/carts/subscriptions/quote`,
        { selection: subscriptionSelection(params.selection) },
        options,
      );
    },

    async checkoutSubscription(
      params: CheckoutSubscriptionParams,
      options?: RequestOptions,
    ): Promise<SubscriptionCheckoutResult> {
      const storeId = params.store_id || apiConfig.storeId;
      return checkoutSubscription(`${apiConfig.baseUrl}:${storeId}`, params, (payload) =>
        apiConfig.httpClient.post<SubscriptionCheckoutResult>(
          `/v1/stores/${storeId}/carts/subscriptions/checkout`, payload, options,
        ),
      );
    },

    async getQuote(
      params: GetQuoteParams,
      options?: RequestOptions,
    ): Promise<OrderQuote> {
      const { store_id, products, bookings, digital, audiences, ...rest } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<OrderQuote>(
        `/v1/stores/${encodeURIComponent(target_store_id)}/orders/quote`,
        {
          ...rest,
          locale: rest.locale ?? apiConfig.locale,
          products: products || [],
          bookings: bookings || [],
          digital: digital || [],
          audiences: audiences || [],
          market: rest.market,
        },
        options,
      );
    },

  };
};
