import type { ApiConfig } from "../index";
import type {
  CreateProviderParams,
  CreateProductParams,
  CreateServiceParams,
  CreateServiceProviderParams,
  DeleteProviderParams,
  UpdateProductParams,
  DeleteProductParams,
  DeleteServiceParams,
  DeleteServiceProviderParams,
  FindServiceProvidersParams,
  GetProviderParams,
  GetProductParams,
  GetProductsParams,
  GetProvidersParams,
  GetQuoteParams,
  GetAvailabilityParams,
  AvailabilityResponse,
  AddCartBookingParams,
  AddCartProductParams,
  CheckoutCartParams,
  ClearCartParams,
  CreateCartParams,
  FindCartsParams,
  GetCartParams,
  GetServiceParams,
  GetServicesParams,
  UpdateOrderParams,
  UpdateProviderParams,
  UpdateServiceParams,
  UpdateServiceProviderParams,
  GetOrderParams,
  GetOrdersParams,
  CreateOrderRefundParams,
  CreateOrderRefundResponse,
  FindOrderRefundsParams,
  GetOrderRefundParams,
  GetOrderPaymentParams,
  FindOrderPaymentAttemptsParams,
  GetOrderPaymentAttemptParams,
  FindOrderDisputesParams,
  GetOrderDisputeParams,
  QuoteCartParams,
  RemoveCartItemParams,
  RequestOptions,
  UpdateCartParams,
} from "../types/api";
import type {
  Order,
  Product,
  Provider,
  Service,
  ServiceProvider,
  OrderQuote,
  OrderRefund,
  OrderPayment,
  OrderPaymentAttempt,
  OrderDispute,
  Cart,
  PaginatedResponse,
} from "../types";

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

    async createService(
      params: CreateServiceParams,
      options?: RequestOptions,
    ): Promise<Service> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Service>(
        `/v1/stores/${target_store_id}/services`,
        payload,
        options,
      );
    },

    async updateService(
      params: UpdateServiceParams,
      options?: RequestOptions,
    ): Promise<Service> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<Service>(
        `/v1/stores/${target_store_id}/services/${params.id}`,
        payload,
        options,
      );
    },

    async deleteService(
      params: DeleteServiceParams,
      options?: RequestOptions,
    ): Promise<void> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<void>(
        `/v1/stores/${target_store_id}/services/${params.id}`,
        options,
      );
    },

    async getService(
      params: GetServiceParams,
      options?: RequestOptions,
    ): Promise<Service> {
      const store_id = params.store_id || apiConfig.storeId;
      let identifier: string;
      if (params.id) {
        identifier = params.id;
      } else if (params.slug) {
        identifier = `${store_id}:${apiConfig.locale}:${params.slug}`;
      } else {
        throw new Error("GetServiceParams requires id or slug");
      }

      return apiConfig.httpClient.get<Service>(
        `/v1/stores/${store_id}/services/${identifier}`,
        options,
      );
    },

    async getServices(
      params: GetServicesParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Service>> {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<Service>>(
        `/v1/stores/${target_store_id}/services`,
        {
          ...options,
          params: queryParams,
        },
      );
    },

    async getServiceAvailability(
      params: GetAvailabilityParams,
      options?: RequestOptions,
    ): Promise<AvailabilityResponse> {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<AvailabilityResponse>(
        `/v1/stores/${target_store_id}/services/availability`,
        { ...options, params: queryParams },
      );
    },

    async createProvider(
      params: CreateProviderParams,
      options?: RequestOptions,
    ): Promise<Provider> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Provider>(
        `/v1/stores/${target_store_id}/providers`,
        payload,
        options,
      );
    },

    async updateProvider(
      params: UpdateProviderParams,
      options?: RequestOptions,
    ): Promise<Provider> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<Provider>(
        `/v1/stores/${target_store_id}/providers/${params.id}`,
        payload,
        options,
      );
    },

    async deleteProvider(
      params: DeleteProviderParams,
      options?: RequestOptions,
    ): Promise<void> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<void>(
        `/v1/stores/${target_store_id}/providers/${params.id}`,
        options,
      );
    },

    async getProvider(
      params: GetProviderParams,
      options?: RequestOptions,
    ): Promise<Provider> {
      const store_id = params.store_id || apiConfig.storeId;
      let identifier: string;
      if (params.id) {
        identifier = params.id;
      } else if (params.slug) {
        identifier = `${store_id}:${apiConfig.locale}:${params.slug}`;
      } else {
        throw new Error("GetProviderParams requires id or slug");
      }

      return apiConfig.httpClient.get<Provider>(
        `/v1/stores/${store_id}/providers/${identifier}`,
        options,
      );
    },

    async getProviders(
      params: GetProvidersParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<Provider>> {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<Provider>>(
        `/v1/stores/${target_store_id}/providers`,
        {
          ...options,
          params: queryParams,
        },
      );
    },

    async findServiceProviders(
      params: FindServiceProvidersParams,
      options?: RequestOptions,
    ): Promise<ServiceProvider[]> {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<ServiceProvider[]>(
        `/v1/stores/${target_store_id}/service-providers`,
        { ...options, params: queryParams },
      );
    },

    async createServiceProvider(
      params: CreateServiceProviderParams,
      options?: RequestOptions,
    ): Promise<ServiceProvider> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<ServiceProvider>(
        `/v1/stores/${target_store_id}/service-providers`,
        payload,
        options,
      );
    },

    async updateServiceProvider(
      params: UpdateServiceProviderParams,
      options?: RequestOptions,
    ): Promise<ServiceProvider> {
      const { store_id, id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<ServiceProvider>(
        `/v1/stores/${target_store_id}/service-providers/${id}`,
        payload,
        options,
      );
    },

    async deleteServiceProvider(
      params: DeleteServiceProviderParams,
      options?: RequestOptions,
    ): Promise<void> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<void>(
        `/v1/stores/${target_store_id}/service-providers/${params.id}`,
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
        },
        options,
      );
    },

    async updateCart(
      params: UpdateCartParams,
      options?: RequestOptions,
    ): Promise<Cart> {
      const { id, store_id, product_items, booking_items, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<Cart>(
        `/v1/stores/${target_store_id}/carts/${id}`,
        {
          ...payload,
          ...(product_items ? { product_items } : {}),
          ...(booking_items ? { booking_items } : {}),
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
      return apiConfig.httpClient.post<
        import("../types").OrderCheckoutResult
      >(`/v1/stores/${target_store_id}/carts/${id}/checkout`, payload, options);
    },

    async getQuote(
      params: GetQuoteParams,
      options?: RequestOptions,
    ): Promise<OrderQuote> {
      const { location, store_id, products, bookings, ...rest } = params;
      const target_store_id = store_id || apiConfig.storeId;
      const shipping_address = location
        ? {
            country: location.country || "",
            state: location.state || "",
            city: location.city || "",
            postal_code: location.postal_code || "",
            name: "",
            street1: "",
            street2: null,
          }
        : rest.shipping_address;
      return apiConfig.httpClient.post<OrderQuote>(
        `/v1/stores/${target_store_id}/orders/quote`,
        {
          ...rest,
          products,
          bookings,
          shipping_address,
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
          },
          options,
        );
      if (response.refund_id !== params.refund_id) {
        throw new Error(
          "Refund response did not match the requested refund_id",
        );
      }
      if (
        !Number.isSafeInteger(response.amount) ||
        response.amount !== params.amount
      ) {
        throw new Error("Refund response did not match the requested amount");
      }
      if (
        ![
          "requested",
          "processing",
          "succeeded",
          "rejected",
          "failed",
          "unknown",
        ].includes(response.status)
      ) {
        throw new Error("Refund response contained an invalid status");
      }
      return response;
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

    async getPaymentAttempts(
      params: FindOrderPaymentAttemptsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<OrderPaymentAttempt>> {
      const { order_id, store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<OrderPaymentAttempt>>(
        `/v1/stores/${target_store_id}/orders/${order_id}/payment/attempts`,
        { ...options, params: queryParams },
      );
    },

    async getPaymentAttempt(
      params: GetOrderPaymentAttemptParams,
      options?: RequestOptions,
    ): Promise<OrderPaymentAttempt> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<OrderPaymentAttempt>(
        `/v1/stores/${target_store_id}/orders/${params.order_id}/payment/attempts/${params.attempt_id}`,
        options,
      );
    },

    async getDisputes(
      params: FindOrderDisputesParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<OrderDispute>> {
      const { order_id, store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<OrderDispute>>(
        `/v1/stores/${target_store_id}/orders/${order_id}/disputes`,
        { ...options, params: queryParams },
      );
    },

    async getDispute(
      params: GetOrderDisputeParams,
      options?: RequestOptions,
    ): Promise<OrderDispute> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<OrderDispute>(
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
