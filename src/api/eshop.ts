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
      const { business_id, ...payload } = params;
      const target_business_id = business_id || apiConfig.businessId;
      return apiConfig.httpClient.post(
        `/v1/businesses/${target_business_id}/products`,
        payload,
        options,
      );
    },

    async updateProduct(params: UpdateProductParams, options?: RequestOptions) {
      const { business_id, ...payload } = params;
      const target_business_id = business_id || apiConfig.businessId;
      return apiConfig.httpClient.put(
        `/v1/businesses/${target_business_id}/products/${params.id}`,
        payload,
        options,
      );
    },

    async deleteProduct(params: DeleteProductParams, options?: RequestOptions) {
      const target_business_id = params.business_id || apiConfig.businessId;
      return apiConfig.httpClient.delete(
        `/v1/businesses/${target_business_id}/products/${params.id}`,
        options,
      );
    },

    async getProduct(params: GetProductParams, options?: RequestOptions) {
      const target_business_id = params.business_id || apiConfig.businessId;
      let identifier: string;
      if (params.id) {
        identifier = params.id;
      } else if (params.slug) {
        identifier = `${target_business_id}:${apiConfig.locale}:${params.slug}`;
      } else {
        throw new Error("GetProductParams requires id or slug");
      }

      return apiConfig.httpClient.get(
        `/v1/businesses/${target_business_id}/products/${identifier}`,
        options,
      );
    },

    async getProducts(params: GetProductsParams, options?: RequestOptions) {
      const { business_id, ...queryParams } = params;
      const target_business_id = business_id || apiConfig.businessId;
      return apiConfig.httpClient.get(
        `/v1/businesses/${encodeURIComponent(target_business_id)}/products`,
        {
          ...options,
          params: queryParams,
        },
      );
    },

    async createOrder(params: CreateOrderParams, options?: RequestOptions) {
      const { business_id, ...payload } = params;
      const target_business_id = business_id || apiConfig.businessId;
      return apiConfig.httpClient.post(
        `/v1/businesses/${target_business_id}/orders`,
        payload,
        options,
      );
    },

    async updateOrder(params: UpdateOrderParams, options?: RequestOptions) {
      const { business_id, ...payload } = params;
      const target_business_id = business_id || apiConfig.businessId;
      return apiConfig.httpClient.put(
        `/v1/businesses/${target_business_id}/orders/${params.id}`,
        payload,
        options,
      );
    },

    async getOrder(params: GetOrderParams, options?: RequestOptions) {
      const target_business_id = params.business_id || apiConfig.businessId;
      
      return apiConfig.httpClient.get(
        `/v1/businesses/${target_business_id}/orders/${params.id}`,
        options,
      );
    },

    async getOrders(params: GetOrdersParams, options?: RequestOptions) {
      const { business_id, ...queryParams } = params;
      const target_business_id = business_id || apiConfig.businessId;
      return apiConfig.httpClient.get(
        `/v1/businesses/${target_business_id}/orders`,
        {
          ...options,
          params: queryParams,
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
