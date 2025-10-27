import type { ApiConfig } from '../index';
import type {
    HandleStripeWebhookParams,
    GetBusinessMarketsParams,
    GetBusinessMarketParams,
    RequestOptions
} from '../types/api';

export const createPaymentApi = (apiConfig: ApiConfig) => {
    return {
        async handleStripeWebhook(params: HandleStripeWebhookParams, options?: RequestOptions) {
            return apiConfig.httpClient.post(`/v1/payments/webhooks/stripe`, params, options);
        },

        async getBusinessMarkets(params: GetBusinessMarketsParams, options?: RequestOptions) {
            return apiConfig.httpClient.get(
                `/v1/payments/businesses/${apiConfig.businessId}/markets`,
                options
            );
        },

        async getBusinessMarket(params: GetBusinessMarketParams, options?: RequestOptions) {
            return apiConfig.httpClient.get(
                `/v1/payments/businesses/${apiConfig.businessId}/markets/${params.marketId}`,
                options
            );
        }
    };
};
