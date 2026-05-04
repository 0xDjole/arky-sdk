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

export const createEshopApi = (apiConfig: ApiConfig) => {
  return {
    
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
      let identifier: string;
      if (params.id) {
        identifier = params.id;
      } else if (params.slug) {
        identifier = `${apiConfig.businessId}:${apiConfig.locale}:${params.slug}`;
      } else {
        throw new Error("GetProductParams requires id or slug");
      }

      return apiConfig.httpClient.get(
        `/v1/businesses/${apiConfig.businessId}/products/${identifier}`,
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

    async getQuote(params: GetQuoteParams, options?: RequestOptions) {
      const { location, ...rest } = params;
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
        : undefined;
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/orders/quote`,
        { ...rest, shipping_address, market: apiConfig.market },
        options,
      );
    },

    async processRefund(
      params: ProcessOrderRefundParams,
      options?: RequestOptions,
    ) {
      return apiConfig.httpClient.post(
        `/v1/businesses/${apiConfig.businessId}/orders/${params.id}/refund`,
        { amount: params.amount },
        options,
      );
    },
  };
};
