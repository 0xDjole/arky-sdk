import { requireRequestId } from "../utils/requestId";
import type { ReviewFirstOrderTermsParams, SealFirstOrderTermsParams, WithdrawFirstOrderTermsParams } from "../types/firstOrderTerms";
import type { CartAccessProductPreview, PreviewCartAccessProductParams } from "../types/purchaseAccess";
import { requireStoreId } from "../utils/storeTarget";
import type { ApiConfig } from "../services/clientTypes";
import type { AcceptCartFutureDeliveriesParams, CartFutureDeliveryQuote, QuoteCartFutureDeliveriesParams } from "../types/cartDelivery";
import type { OrderBooking, GetOrderBookingParams } from "../types/orderBooking";
import type { CancelPendingOrderParams, OrderCancellationAcceptance } from "../types/orderCancellation";
import { checkoutCart, cartCheckoutRequest, retainAdminCartCheckout, pendingAdminCartCheckout, recoverAdminCartCheckout, withCartMutation } from "../services/cartCheckout";
import { cartOnAccountCheckoutRequest, checkoutCartOnAccount, retainCartOnAccountCheckout, pendingCartOnAccountCheckout, recoverCartOnAccountCheckout } from "../services/cartOnAccountCheckout";
import type { CheckoutCartOnAccountParams, CartOnAccountCheckoutRequest, CartOnAccountCheckoutTransport } from "../types/cartOnAccountCheckout";
import { DurableRequestStorageError } from "../utils/durableRequest";
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
  GetBookingOfferingParams,
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
  type CheckoutContext = { scope: string; accountId: string; credentialId: string };

  function assertCheckoutContext(context: CheckoutContext): void {
    const current = apiConfig.authStorage.getTokens();
    if ((current?.id ?? current?.access_token) !== context.credentialId) {
      throw new DurableRequestStorageError("Cart Checkout Account changed before its retained request completed");
    }
  }

  async function checkoutContext(storeId: string, options?: RequestOptions): Promise<CheckoutContext> {
    const tokens = apiConfig.authStorage.getTokens();
    if (!tokens?.access_token) throw new DurableRequestStorageError("Cart Checkout requires the current authenticated Account");
    const identity = tokens.id ?? tokens.access_token;
    const account = await apiConfig.httpClient.get<unknown>("/v1/accounts/me", { signal: options?.signal });
    const current = apiConfig.authStorage.getTokens();
    if ((current?.id ?? current?.access_token) !== identity || typeof account !== "object" || account === null ||
      !("id" in account) || typeof account.id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(account.id) ||
      !("status" in account) || typeof account.status !== "object" || account.status === null ||
      !("type" in account.status) || account.status.type !== "active") {
      throw new DurableRequestStorageError("Cart Checkout could not confirm its unchanged current Account");
    }
    return { scope: `admin:${apiConfig.baseUrl}:${account.id}:${storeId}`, accountId: account.id, credentialId: identity };
  }

  async function withAdminCartMutation<T>(storeId: string, operation: () => Promise<T>): Promise<T> {
    if (typeof globalThis.window === "undefined") return operation();
    const context = await checkoutContext(storeId);
    return withCartMutation(context.scope, () => {
      assertCheckoutContext(context);
      return operation();
    });
  }

  function checkoutTransport(storeId: string, context?: CheckoutContext): CartCheckoutTransport<OrderCheckoutResult> {
    return {
      post: ({ id, request_id, ...request }, options) => { requireRequestId(request_id); if (context) assertCheckoutContext(context); return apiConfig.httpClient.post<OrderCheckoutResult>(
        `/v1/stores/${requireStoreId(storeId)}/carts/accept`,
        { ...request, request_id },
        options,
      ); },
      getOrder: async (id, options) => {
        const order = await apiConfig.httpClient.get<Order>(
          `/v1/stores/${requireStoreId(storeId)}/orders/${encodeURIComponent(id)}`, options,
        );
        if (context) assertCheckoutContext(context);
        if (context !== undefined && (order.store_id !== storeId || order.origin?.type !== "admin" ||
          order.origin.actor.account_id !== context.accountId)) {
          throw new DurableRequestStorageError("Cart Checkout did not confirm its exact accepting Account and Store");
        }
        return order;
      },
    };
  }

  function onAccountCheckoutTransport(storeId: string, context: CheckoutContext): CartOnAccountCheckoutTransport {
    return {
      post: ({ id, request_id, ...request }, options) => {
        assertCheckoutContext(context);
        return apiConfig.httpClient.post<OrderCheckoutResult>(
          `/v1/stores/${requireStoreId(storeId)}/carts/accept-on-account`,
          { ...request, request_id },
          options,
        );
      },
      getOrder: async (id, options) => {
        const order = await apiConfig.httpClient.get<Order>(
          `/v1/stores/${requireStoreId(storeId)}/orders/${encodeURIComponent(id)}`, options,
        );
        assertCheckoutContext(context);
        return order;
      },
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

    getBookingOffering(
      params: GetBookingOfferingParams,
      options?: RequestOptions,
    ): Promise<BookingOffering> {
      return apiConfig.httpClient.get<BookingOffering>(
        `/v1/stores/${encodeURIComponent(requireStoreId(params.store_id))}/booking-offerings/${encodeURIComponent(params.id)}`,
        options,
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
      return withAdminCartMutation(target_store_id, () => apiConfig.httpClient.post<CreatedCart>(
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
      return withAdminCartMutation(target_store_id, () => apiConfig.httpClient.put<Cart>(
        `/v1/stores/${requireStoreId(target_store_id)}/carts/${encodeURIComponent(id)}`,
        {
          ...payload,
          ...(line_items ? { line_items } : {}),
          ...(delivery_groups ? { delivery_groups } : {}),
        },
        options,
      ));
    },

    async reviewFirstOrderTerms(
      params: ReviewFirstOrderTermsParams,
      options?: RequestOptions,
    ): Promise<Cart> {
      const { id, store_id, ...payload } = params;
      const targetStoreId = requireStoreId(store_id);
      requireRequestId(payload.request_id);
      return withAdminCartMutation(targetStoreId, () => apiConfig.httpClient.post<Cart>(
        `/v1/stores/${targetStoreId}/carts/${encodeURIComponent(id)}/first-order-terms/review`,
        payload,
        options,
      ));
    },

    async sealFirstOrderTerms(
      params: SealFirstOrderTermsParams,
      options?: RequestOptions,
    ): Promise<Cart> {
      const { id, store_id, ...payload } = params;
      const targetStoreId = requireStoreId(store_id);
      requireRequestId(payload.request_id);
      return withAdminCartMutation(targetStoreId, () => apiConfig.httpClient.post<Cart>(
        `/v1/stores/${targetStoreId}/carts/${encodeURIComponent(id)}/first-order-terms/seal`,
        payload,
        options,
      ));
    },

    async withdrawFirstOrderTerms(
      params: WithdrawFirstOrderTermsParams,
      options?: RequestOptions,
    ): Promise<Cart> {
      const { id, store_id, version_id, expected_updated_at } = params;
      const targetStoreId = requireStoreId(store_id);
      return withAdminCartMutation(targetStoreId, () => apiConfig.httpClient.post<Cart>(
        `/v1/stores/${targetStoreId}/carts/${encodeURIComponent(id)}/first-order-terms/withdraw`,
        { version_id, expected_updated_at },
        options,
      ));
    },

    async addCartProduct(
      params: AddCartProductParams,
      options?: RequestOptions,
    ): Promise<Cart> {
      const { id, store_id, product } = params;
      const target_store_id = requireStoreId(store_id);
      return withAdminCartMutation(target_store_id, () => apiConfig.httpClient.post<Cart>(
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
      return withAdminCartMutation(target_store_id, () => apiConfig.httpClient.post<Cart>(
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
      return withAdminCartMutation(target_store_id, () => apiConfig.httpClient.post<Cart>(
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
      return withAdminCartMutation(target_store_id, () => apiConfig.httpClient.post<Cart>(
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
      return withAdminCartMutation(target_store_id, () => apiConfig.httpClient.post<Cart>(
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
      return withAdminCartMutation(target_store_id, () => apiConfig.httpClient.post<Cart>(
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
      return withAdminCartMutation(storeId, () => apiConfig.httpClient.put<Cart>(
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
      const request = cartCheckoutRequest(payload);
      if (typeof globalThis.window === "undefined") {
        return checkoutCart(request, checkoutTransport(target_store_id), options);
      }
      const context = await checkoutContext(target_store_id, options);
      return withCartMutation(context.scope, () => checkoutCart(request, checkoutTransport(target_store_id, context), options));
    },

    async retainCartCheckout(params: CheckoutCartParams): Promise<CartCheckoutRequest> {
      requireRequestId(params.request_id);
      const { store_id, ...payload } = params;
      const request = cartCheckoutRequest(payload);
      const context = await checkoutContext(requireStoreId(store_id));
      return retainAdminCartCheckout(context.scope, request);
    },

    async pendingCartCheckout(params: RecoverCartCheckoutParams): Promise<CartCheckoutRequest | null> {
      const storeId = requireStoreId(params.store_id);
      if (typeof globalThis.window === "undefined") return null;
      const context = await checkoutContext(storeId);
      return pendingAdminCartCheckout(context.scope);
    },

    async recoverCartCheckout(params: RecoverCartCheckoutParams, options?: RequestOptions): Promise<OrderCheckoutResult | null> {
      const storeId = requireStoreId(params.store_id);
      if (typeof globalThis.window === "undefined") return null;
      const context = await checkoutContext(storeId, options);
      return recoverAdminCartCheckout(context.scope, checkoutTransport(storeId, context), options);
    },

    async checkoutCartOnAccount(params: CheckoutCartOnAccountParams, options?: RequestOptions): Promise<OrderCheckoutResult> {
      const { store_id, ...payload } = params;
      const request = cartOnAccountCheckoutRequest(payload);
      const storeId = requireStoreId(store_id);
      const context = await checkoutContext(storeId, options);
      const operation = () => checkoutCartOnAccount(request, storeId, context.accountId, onAccountCheckoutTransport(storeId, context), options);
      return typeof globalThis.window === "undefined" ? operation() : withCartMutation(context.scope, operation);
    },

    async retainCartOnAccountCheckout(params: CheckoutCartOnAccountParams): Promise<CartOnAccountCheckoutRequest> {
      const { store_id, ...payload } = params;
      const request = cartOnAccountCheckoutRequest(payload);
      const context = await checkoutContext(requireStoreId(store_id));
      return retainCartOnAccountCheckout(context.scope, request);
    },

    async pendingCartOnAccountCheckout(params: RecoverCartCheckoutParams): Promise<CartOnAccountCheckoutRequest | null> {
      const storeId = requireStoreId(params.store_id);
      if (typeof globalThis.window === "undefined") return null;
      const context = await checkoutContext(storeId);
      return pendingCartOnAccountCheckout(context.scope);
    },

    async recoverCartOnAccountCheckout(params: RecoverCartCheckoutParams, options?: RequestOptions): Promise<OrderCheckoutResult | null> {
      const storeId = requireStoreId(params.store_id);
      if (typeof globalThis.window === "undefined") return null;
      const context = await checkoutContext(storeId, options);
      return recoverCartOnAccountCheckout(context.scope, storeId, context.accountId, onAccountCheckoutTransport(storeId, context), options);
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
