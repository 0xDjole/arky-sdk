import type { ApiConfig } from "../index";
import type {
  CreateProductParams,
  UpdateProductParams,
  DeleteProductParams,
  GetProductParams,
  GetProductsParams,
  GetQuoteParams,
  OrderCheckoutParams,
  CreateOrderParams,
  UpdateOrderParams,
  GetOrderParams,
  GetOrdersParams,
  RequestOptions,
} from "../types/api";

import { formatIdOrSlug } from "../utils/slug";

export const createEshopApi = (apiConfig: ApiConfig) => {
  return {
    // ===== PRODUCTS =====

    async createProduct(params: CreateProductParams, options?: RequestOptions) {
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/products`,
        params,
        options,
      );
    },

    async updateProduct(params: UpdateProductParams, options?: RequestOptions) {
      return apiConfig.httpClient.put(
        `/v1/businesses/${apiConfig.businessId}/products/${params.id}`,
        params,
        options,
      );
    },

    async deleteProduct(params: DeleteProductParams, options?: RequestOptions) {
      return apiConfig.httpClient.delete(
        `/v1/businesses/${apiConfig.businessId}/products/${params.id}`,
        options,
      );
    },

    async getProduct(params: GetProductParams, options?: RequestOptions) {
      const formattedId = formatIdOrSlug(params.id, apiConfig);
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/products/${formattedId}`,
        options,
      );
    },

    async getProducts(params: GetProductsParams, options?: RequestOptions) {
      return apiConfig.httpClient.get(
        `/v1/businesses/${encodeURIComponent(apiConfig.businessId)}/products`,
        {
          ...options,
          params,
        },
      );
    },

    // ===== ORDERS =====

    async createOrder(params: CreateOrderParams, options?: RequestOptions) {
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/orders`,
        params,
        options,
      );
    },

    async updateOrder(params: UpdateOrderParams, options?: RequestOptions) {
      return apiConfig.httpClient.put(
        `/v1/businesses/${apiConfig.businessId}/orders/${params.id}`,
        params,
        options,
      );
    },

    async getOrder(params: GetOrderParams, options?: RequestOptions) {
      // Orders use UUID only - no SEO slug support
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/orders/${params.id}`,
        options,
      );
    },

    async getOrders(params: GetOrdersParams, options?: RequestOptions) {
      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/orders`,
        {
          ...options,
          params,
        },
      );
    },

    // ===== PAYMENTS =====

    async getQuote(params: GetQuoteParams, options?: RequestOptions) {
      const payload = {
        market: apiConfig.market,
        ...params,
      };

      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/orders/quote`,
        payload,
        options,
      );
    },

    async checkout(params: OrderCheckoutParams, options?: RequestOptions) {
      const payload = {
        businessId: apiConfig.businessId,
        market: apiConfig.market,
        ...params,
      };

      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/orders/checkout`,
        payload,
        options,
      );
    },
  };
};
