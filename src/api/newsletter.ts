import type { ApiConfig } from '../index';
import type {
    NewsletterSubscribeParams,
    NewsletterFindParams,
    NewsletterGetParams,
    RequestOptions
} from '../types/api';

export const createNewsletterApi = (apiConfig: ApiConfig) => {
    return {
        async find(params: NewsletterFindParams, options?: RequestOptions) {
            return apiConfig.httpClient.get(`/v1/newsletters`, {
                ...options,
                params: { businessId: params.businessId }
            });
        },

        async get(params: NewsletterGetParams, options?: RequestOptions) {
            return apiConfig.httpClient.get(`/v1/newsletters/${params.id}`, options);
        },

        async subscribe(params: NewsletterSubscribeParams, options?: RequestOptions) {
            const { newsletterId, email, customerId, payment } = params;

            const payload = {
                newsletterId,
                email,
                market: 'US',
                ...(customerId && { customerId }),
                ...(payment && { payment })
            };

            return apiConfig.httpClient.post(
                `/v1/newsletters/${newsletterId}/subscribe`,
                payload,
                options
            );
        }
    };
};
