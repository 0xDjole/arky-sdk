import type { ApiConfig } from "../index";
import type {
  CreateProductParams,
  UpdateProductParams,
  DeleteProductParams,
  GetProductParams,
  GetProductsParams,
  GetQuoteParams,
  CreateOrderParams,
  UpdateOrderParams,
  GetOrderParams,
  GetOrdersParams,
  ProcessOrderRefundParams,
  RequestOptions,
} from "../types/api";
import type { Order, Product, OrderQuote, PaginatedResponse } from "../types";
import {
  normalizeOrderCheckoutItems,
  normalizeOrderQuoteItems,
} from "../utils/orderItems";

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

    async createOrder(params: CreateOrderParams, options?: RequestOptions): Promise<Order> {
      const { store_id, items, ...rest } = params;
      const target_store_id = store_id || apiConfig.storeId;
      const payload = {
        ...rest,
        market: rest.market || apiConfig.market,
        items: normalizeOrderCheckoutItems(items),
      };

      return apiConfig.httpClient.post<Order>(
        `/v1/stores/${target_store_id}/orders`,
        payload,
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
