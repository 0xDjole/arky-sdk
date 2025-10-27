import type { ApiConfig } from '../index';
import type {
    GetQuoteParams,
    CheckoutParams,
    GetProductsParams,
    GetProductBySlugParams,
    RequestOptions
} from '../types/api';

export const createEshopApi = (apiConfig: ApiConfig) => {
    return {
        async getProducts(params?: GetProductsParams, options?: RequestOptions) {
            const queryParams = params ? { ...params } : {};

            return apiConfig.httpClient.get(
                `/v1/businesses/${encodeURIComponent(apiConfig.businessId)}/products`,
                {
                    ...options,
                    params: queryParams
                }
            );
        },

        async getProductBySlug(params: GetProductBySlugParams, options?: RequestOptions) {
            const { businessId, slug } = params;

            return apiConfig.httpClient.get(
                `/v1/businesses/${encodeURIComponent(businessId)}/products/slug/${encodeURIComponent(businessId)}/${encodeURIComponent(slug)}`,
                options
            );
        },

        async getQuote(params: GetQuoteParams, options?: RequestOptions) {
            const lines = params.items.map(item => ({
                type: 'PRODUCT_VARIANT',
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity
            }));

            const payload = {
                businessId: apiConfig.businessId,
                market: params.market,
                currency: params.currency,
                paymentMethod: params.paymentMethod,
                lines: lines,
                ...(params.shippingMethodId && { shippingMethodId: params.shippingMethodId }),
                ...(params.promoCode && { promoCode: params.promoCode })
            };

            return apiConfig.httpClient.post(`/v1/payments/quote`, payload, options);
        },

        async checkout(params: CheckoutParams, options?: RequestOptions) {
            const payload = {
                businessId: apiConfig.businessId,
                market: params.market,
                paymentMethod: params.paymentMethod,
                shippingMethodId: params.shippingMethodId,
                items: params.items,
                blocks: params.blocks || [],
                ...(params.promoCode && { promoCode: params.promoCode })
            };

            return apiConfig.httpClient.post(
                `/v1/businesses/${apiConfig.businessId}/orders/checkout`,
                payload,
                options
            );
        }
    };
};
