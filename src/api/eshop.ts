import type { ApiConfig } from "../index";
import type {
  CreateProductParams,
  UpdateProductParams,
  DeleteProductParams,
  GetProductParams,
  GetProductsParams,
  GetQuoteParams,
  CheckoutParams,
  CreateOrderParams,
  UpdateOrderParams,
  GetOrderParams,
  GetOrdersParams,
  UpdateOrderStatusParams,
  UpdateOrderPaymentStatusParams,
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
      const response = await apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/products/${formattedId}`,
        options,
      );

      // Add helper methods that automatically use SDK's current locale
      return {
        ...response,
        getName() {
          const locale = apiConfig.locale;
          return response.name?.[locale] || response.name?.en || response.name || '';
        },
        getDescription() {
          const locale = apiConfig.locale;
          return response.description?.[locale] || response.description?.en || response.description || '';
        }
      };
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
        `/v1/businesses/${apiConfig.businessId}/orders/update`,
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

    async updateOrderStatus(
      params: UpdateOrderStatusParams,
      options?: RequestOptions,
    ) {
      return apiConfig.httpClient.put(
        `/v1/businesses/${apiConfig.businessId}/orders/${params.id}/status`,
        params,
        options,
      );
    },

    async updateOrderPaymentStatus(
      params: UpdateOrderPaymentStatusParams,
      options?: RequestOptions,
    ) {
      return apiConfig.httpClient.put(
        `/v1/businesses/${apiConfig.businessId}/orders/${params.id}/payment-status`,
        params,
        options,
      );
    },

    // ===== PAYMENTS =====

    async getQuote(params: GetQuoteParams, options?: RequestOptions) {
      const lines = params.items.map((item) => ({
        type: "PRODUCT_VARIANT",
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      const { items, ...rest } = params;

      const payload = {
        businessId: apiConfig.businessId,
        market: apiConfig.market,
        lines: lines,
        ...rest,
      };

      return apiConfig.httpClient.post(`/v1/payments/quote`, payload, options);
    },

    async checkout(params: CheckoutParams, options?: RequestOptions) {
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
