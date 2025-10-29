import type { ApiConfig } from '../index';
import type {
    CreateNewsletterParams,
    UpdateNewsletterParams,
    DeleteNewsletterParams,
    GetSubscribersParams,
    NewsletterSubscribeParams,
    NewsletterFindParams,
    NewsletterGetParams,
    UnsubscribeParams,
    RequestOptions
} from '../types/api';

export const createNewsletterApi = (apiConfig: ApiConfig) => {
    return {
        // ===== NEWSLETTERS =====

        async find(params: NewsletterFindParams, options?: RequestOptions) {
            return apiConfig.httpClient.get(`/v1/newsletters`, {
                ...options,
                params: { businessId: apiConfig.businessId }
            });
        },

        async get(params: NewsletterGetParams, options?: RequestOptions) {
            return apiConfig.httpClient.get(`/v1/newsletters/${params.id}`, options);
        },

        async create(params: CreateNewsletterParams, options?: RequestOptions) {
            return apiConfig.httpClient.post(`/v1/newsletters`, params, options);
        },

        async update(params: UpdateNewsletterParams, options?: RequestOptions) {
            return apiConfig.httpClient.put(`/v1/newsletters/${params.id}`, params, options);
        },

        async delete(params: DeleteNewsletterParams, options?: RequestOptions) {
            return apiConfig.httpClient.delete(`/v1/newsletters/${params.id}`, options);
        },

        // ===== SUBSCRIBERS =====

        async getSubscribers(params: GetSubscribersParams, options?: RequestOptions) {
            return apiConfig.httpClient.get(`/v1/newsletters/${params.id}/subscribers`, options);
        },

        async subscribe(params: NewsletterSubscribeParams, options?: RequestOptions) {
            const { newsletterId, email, customerId, payment } = params;

            const payload = {
                newsletterId,
                email,
                market: apiConfig.market,
                ...(customerId && { customerId }),
                ...(payment && { payment })
            };

            return apiConfig.httpClient.post(
                `/v1/newsletters/${newsletterId}/subscribe`,
                payload,
                options
            );
        },

        async unsubscribe(params: UnsubscribeParams, options?: RequestOptions) {
            return apiConfig.httpClient.post(`/v1/newsletters/unsubscribe`, params, options);
        },

        async unsubscribeWithToken(params: UnsubscribeParams, options?: RequestOptions) {
            return apiConfig.httpClient.get(`/v1/newsletters/unsubscribe`, {
                ...options,
                params
            });
        }
    };
};
