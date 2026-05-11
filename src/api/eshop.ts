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
  ProcessOrderRefundParams,
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
  Cart,
  PaginatedResponse,
} from "../types";
import {
  normalizeOrderCheckoutItems,
  normalizeOrderQuoteItems,
} from "../utils/orderItems";

const normalizeTaxonomyAliases = <T extends { taxonomies?: unknown; filters?: unknown }>(
  payload: T,
) => {
  const { filters, ...rest } = payload;
  return {
    ...rest,
    ...(!rest.taxonomies && filters ? { taxonomies: filters } : {}),
  };
};

export const createEshopApi = (apiConfig: ApiConfig) => {
  return {

    async createProduct(params: CreateProductParams, options?: RequestOptions): Promise<Product> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Product>(
        `/v1/stores/${target_store_id}/products`,
        normalizeTaxonomyAliases(payload),
        options,
      );
    },

    async updateProduct(params: UpdateProductParams, options?: RequestOptions): Promise<Product> {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put<Product>(
        `/v1/stores/${target_store_id}/products/${params.id}`,
        normalizeTaxonomyAliases(payload),
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
        normalizeTaxonomyAliases(payload),
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
        normalizeTaxonomyAliases(payload),
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
        normalizeTaxonomyAliases(payload),
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
        normalizeTaxonomyAliases(payload),
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
        ...(items ? { items: normalizeOrderCheckoutItems(items) } : {}),
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
          items: normalizeOrderCheckoutItems(payload.items || []),
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
          ...(items ? { items: normalizeOrderCheckoutItems(items) } : {}),
        },
        options,
      );
    },

    async addCartItem(params: AddCartItemParams, options?: RequestOptions): Promise<Cart> {
      const { id, store_id, item } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post<Cart>(
        `/v1/stores/${target_store_id}/carts/${id}/items`,
        { item: normalizeOrderCheckoutItems([item])[0] },
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
      return apiConfig.httpClient.post<import("../types").OrderCheckoutResult>(
        `/v1/stores/${target_store_id}/carts/${id}/checkout`,
        payload,
        options,
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
          items: normalizeOrderQuoteItems(items),
          shipping_address,
          market: rest.market || apiConfig.market,
        },
        options,
      );
    },

    async processRefund(
      params: ProcessOrderRefundParams,
      options?: RequestOptions,
    ): Promise<Order> {
      return apiConfig.httpClient.post<Order>(
        `/v1/stores/${apiConfig.storeId}/orders/${params.id}/refund`,
        { amount: params.amount },
        options,
      );
    },
  };
};
