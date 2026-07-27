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
  AddCartItemParams,
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
  FindDigitalAccessGrantsParams,
  GetDigitalAccessGrantParams,
  DownloadDigitalAccessParams,
  ActivateDigitalAccessGrantParams,
  RevokeDigitalAccessGrantParams,
  CreateOrderRefundParams,
  CreateOrderRefundResponse,
  FindOrderRefundsParams,
  GetOrderRefundParams,
  GetOrderPaymentParams,
  RetryPaymentTransactionParams,
  FindPaymentTransactionsParams,
  GetPaymentTransactionParams,
  QuoteCartParams,
  RemoveCartItemParams,
  RequestOptions,
  UpdateCartParams,
} from "../types/api";
import {
  pollScheduledResult,
  prepareScheduledMutation,
  scheduledObservationOptions,
} from "../utils/scheduledResult";
import type {
  Order,
  DigitalAccessGrant,
  DigitalAccessDownloadResponse,
  Product,
  Provider,
  Service,
  ServiceProvider,
  OrderQuote,
  OrderRefund,
  OrderPayment,
  PaymentTransaction,
  Cart,
  PaginatedResponse,
} from "../types";

export const createEshopApi = (apiConfig: ApiConfig) => {
  return {

    async createProduct(params: CreateProductParams, options?: RequestOptions): Promise<Product> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Product>(
        `/v1/stores/${target_store_id}/products`,
        payload,
        options,
      );
    },

    async updateProduct(params: UpdateProductParams, options?: RequestOptions): Promise<Product> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<Product>(
        `/v1/stores/${target_store_id}/products/${params.id}`,
        payload,
        options,
      );
    },

    async deleteProduct(params: DeleteProductParams, options?: RequestOptions): Promise<{ deleted: boolean }> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete<{ deleted: boolean }>(
        `/v1/stores/${target_store_id}/products/${params.id}`,
        options,
      );
    },

    async getProduct(params: GetProductParams, options?: RequestOptions): Promise<Product> {
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

    async getProducts(params: GetProductsParams, options?: RequestOptions): Promise<PaginatedResponse<Product>> {
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

    async updateOrder(params: UpdateOrderParams, options?: RequestOptions): Promise<Order> {
      const { store_id, items, ...rest } = params;
      const target_store_id = store_id || apiConfig.storeId;
      const payload = {
        ...rest,
        ...(items ? { items } : {}),
      };

      return apiConfig.httpClient.put<Order>(
        `/v1/stores/${target_store_id}/orders/${params.id}`,
        payload,
        options,
      );
    },

    async getOrder(params: GetOrderParams, options?: RequestOptions): Promise<Order> {
      const target_store_id = params.store_id || apiConfig.storeId;

      return apiConfig.httpClient.get<Order>(
        `/v1/stores/${target_store_id}/orders/${params.id}`,
        options,
      );
    },

    async getOrders(params: GetOrdersParams, options?: RequestOptions): Promise<PaginatedResponse<Order>> {
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

    async getCarts(params: FindCartsParams = {}, options?: RequestOptions): Promise<PaginatedResponse<Cart>> {
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

    async getCart(params: GetCartParams, options?: RequestOptions): Promise<Cart> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<Cart>(
        `/v1/stores/${target_store_id}/carts/${params.id}`,
        options,
      );
    },

    async createCart(params: CreateCartParams, options?: RequestOptions): Promise<Cart> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Cart>(
        `/v1/stores/${target_store_id}/carts`,
        {
          ...payload,
          items: payload.items || [],
        },
        options,
      );
    },

    async updateCart(params: UpdateCartParams, options?: RequestOptions): Promise<Cart> {
      const { id, store_id, items, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<Cart>(
        `/v1/stores/${target_store_id}/carts/${id}`,
        {
          ...payload,
          ...(items ? { items } : {}),
        },
        options,
      );
    },

    async addCartItem(params: AddCartItemParams, options?: RequestOptions): Promise<Cart> {
      const { id, store_id, item } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Cart>(
        `/v1/stores/${target_store_id}/carts/${id}/items`,
        { item },
        options,
      );
    },

    async removeCartItem(params: RemoveCartItemParams, options?: RequestOptions): Promise<Cart> {
      const { id, store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Cart>(
        `/v1/stores/${target_store_id}/carts/${id}/items/remove`,
        payload,
        options,
      );
    },

    async clearCart(params: ClearCartParams, options?: RequestOptions): Promise<Cart> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Cart>(
        `/v1/stores/${target_store_id}/carts/${params.id}/clear`,
        {},
        options,
      );
    },

    async quoteCart(params: QuoteCartParams, options?: RequestOptions): Promise<OrderQuote> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<OrderQuote>(
        `/v1/stores/${target_store_id}/carts/${params.id}/quote`,
        {},
        options,
      );
    },

    async checkoutCart(params: CheckoutCartParams, options?: RequestOptions): Promise<import("../types").OrderCheckoutResult> {
      const { id, store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      const path = `/v1/stores/${target_store_id}/carts/${id}/checkout`;
      const mutation = prepareScheduledMutation(payload, options);
      const requested =
        await apiConfig.httpClient.post<import("../types").OrderCheckoutResult>(
          path,
          mutation.body,
          mutation.options,
        );
      return pollScheduledResult(
        requested,
        (observationSignal) =>
          apiConfig.httpClient.post<import("../types").OrderCheckoutResult>(
            path,
            mutation.body,
            scheduledObservationOptions(options, observationSignal),
          ),
        (result) =>
          result.payment.status.status === "pending" ||
          result.payment.status.status === "processing",
        options?.signal,
      );
    },

    async getQuote(params: GetQuoteParams, options?: RequestOptions): Promise<OrderQuote> {
      const { location, store_id, items, ...rest } = params;
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
          items,
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
      const response = await apiConfig.httpClient.post<CreateOrderRefundResponse>(
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

    async retryPaymentTransaction(
      params: RetryPaymentTransactionParams,
      options?: RequestOptions,
    ): Promise<PaymentTransaction> {
      const target_store_id = params.store_id || apiConfig.storeId;
      const path =
        `/v1/stores/${target_store_id}/orders/${params.order_id}` +
        `/payment/transactions/${params.transaction_id}`;
      const requested = await apiConfig.httpClient.post<PaymentTransaction>(
        `${path}/retry`,
        {},
        options,
      );
      if (
        requested.status !== "requested" &&
        requested.status !== "processing"
      ) {
        return requested;
      }
      return pollScheduledResult(
        requested,
        (observationSignal) =>
          apiConfig.httpClient.get<PaymentTransaction>(
            path,
            scheduledObservationOptions(options, observationSignal),
          ),
        (transaction) =>
          transaction.status === "requested" ||
          transaction.status === "processing",
        options?.signal,
      );
    },

    async getPaymentTransactions(
      params: FindPaymentTransactionsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<PaymentTransaction>> {
      const { order_id, store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<PaymentTransaction>>(
        `/v1/stores/${target_store_id}/orders/${order_id}/payment/transactions`,
        { ...options, params: queryParams },
      );
    },

    async getPaymentTransaction(
      params: GetPaymentTransactionParams,
      options?: RequestOptions,
    ): Promise<PaymentTransaction> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaymentTransaction>(
        `/v1/stores/${target_store_id}/orders/${params.order_id}/payment/transactions/${params.transaction_id}`,
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

    async downloadDigitalAccess(
      params: DownloadDigitalAccessParams,
      options?: RequestOptions,
    ): Promise<DigitalAccessDownloadResponse> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<DigitalAccessDownloadResponse>(
        `/v1/stores/${target_store_id}/orders/${params.order_id}/digital-access/${params.grant_id}/download`,
        {},
        options,
      );
    },

    async activateDigitalAccess(
      params: ActivateDigitalAccessGrantParams,
      options?: RequestOptions,
    ): Promise<DigitalAccessGrant> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<DigitalAccessGrant>(
        `/v1/stores/${target_store_id}/orders/${params.order_id}/digital-access/${params.grant_id}/activate`,
        {},
        options,
      );
    },

    async revokeDigitalAccess(
      params: RevokeDigitalAccessGrantParams,
      options?: RequestOptions,
    ): Promise<DigitalAccessGrant> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<DigitalAccessGrant>(
        `/v1/stores/${target_store_id}/orders/${params.order_id}/digital-access/${params.grant_id}/revoke`,
        {},
        options,
      );
    },

    async findDigitalAccess(
      params: FindDigitalAccessGrantsParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<DigitalAccessGrant>> {
      const { order_id, store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<PaginatedResponse<DigitalAccessGrant>>(
        `/v1/stores/${target_store_id}/orders/${order_id}/digital-access`,
        { ...options, params: queryParams },
      );
    },

    async getDigitalAccess(
      params: GetDigitalAccessGrantParams,
      options?: RequestOptions,
    ): Promise<DigitalAccessGrant> {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.get<DigitalAccessGrant>(
        `/v1/stores/${target_store_id}/orders/${params.order_id}/digital-access/${params.grant_id}`,
        options,
      );
    },
  };
};
