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
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post(
        `/v1/stores/${target_store_id}/products`,
        payload,
        options,
      );
    },

    async updateProduct(params: UpdateProductParams, options?: RequestOptions) {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put(
        `/v1/stores/${target_store_id}/products/${params.id}`,
        payload,
        options,
      );
    },

    async deleteProduct(params: DeleteProductParams, options?: RequestOptions) {
      const target_store_id = params.store_id || apiConfig.storeId;
      return apiConfig.httpClient.delete(
        `/v1/stores/${target_store_id}/products/${params.id}`,
        options,
      );
    },

    async getProduct(params: GetProductParams, options?: RequestOptions) {
      const target_store_id = params.store_id || apiConfig.storeId;
      let identifier: string;
      if (params.id) {
        identifier = params.id;
      } else if (params.slug) {
        identifier = `${target_store_id}:${apiConfig.locale}:${params.slug}`;
      } else {
        throw new Error("GetProductParams requires id or slug");
      }

      return apiConfig.httpClient.get(
        `/v1/stores/${target_store_id}/products/${identifier}`,
        options,
      );
    },

    async getProducts(params: GetProductsParams, options?: RequestOptions) {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get(
        `/v1/stores/${encodeURIComponent(target_store_id)}/products`,
        {
          ...options,
          params: queryParams,
        },
      );
    },

    async createOrder(params: CreateOrderParams, options?: RequestOptions) {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.post(
        `/v1/stores/${target_store_id}/orders`,
        payload,
        options,
      );
    },

    async updateOrder(params: UpdateOrderParams, options?: RequestOptions) {
      const { store_id, ...payload } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.put(
        `/v1/stores/${target_store_id}/orders/${params.id}`,
        payload,
        options,
      );
    },

    async getOrder(params: GetOrderParams, options?: RequestOptions) {
      const target_store_id = params.store_id || apiConfig.storeId;
      
      return apiConfig.httpClient.get(
        `/v1/stores/${target_store_id}/orders/${params.id}`,
        options,
      );
    },

    async getOrders(params: GetOrdersParams, options?: RequestOptions) {
      const { store_id, ...queryParams } = params;
      const target_store_id = store_id || apiConfig.storeId;
      return apiConfig.httpClient.get(
        `/v1/stores/${target_store_id}/orders`,
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
        `/v1/stores/${apiConfig.storeId}/orders/quote`,
        { ...rest, shipping_address, market: apiConfig.market },
        options,
      );
    },

    async processRefund(
      params: ProcessOrderRefundParams,
      options?: RequestOptions,
    ) {
      return apiConfig.httpClient.post(
        `/v1/stores/${apiConfig.storeId}/orders/${params.id}/refund`,
        { amount: params.amount },
        options,
      );
    },
  };
};
