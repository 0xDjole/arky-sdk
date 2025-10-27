import type { ApiConfig } from '../index';
import type {
    GetServicesParams,
    ReservationCheckoutParams,
    GetReservationQuoteParams,
    GetAvailableSlotsParams,
    RequestOptions
} from '../types/api';

export const createReservationApi = (apiConfig: ApiConfig) => {
    return {
        async getServices(params?: GetServicesParams, options?: RequestOptions) {
            const queryParams = params ? { ...params } : {};

            return apiConfig.httpClient.get(
                `/v1/businesses/${apiConfig.businessId}/services`,
                {
                    ...options,
                    params: queryParams
                }
            );
        },

        async getQuote(params: GetReservationQuoteParams, options?: RequestOptions) {
            const lines = params.parts.map((part) => ({
                type: 'SERVICE',
                serviceId: part.serviceId,
                quantity: 1
            }));

            const payload = {
                businessId: apiConfig.businessId,
                market: params.market,
                currency: params.currency,
                paymentMethod: params.paymentMethod,
                lines: lines,
                ...(params.promoCode && { promoCode: params.promoCode })
            };

            return apiConfig.httpClient.post(`/v1/payments/quote`, payload, options);
        },

        async checkout(params: ReservationCheckoutParams, options?: RequestOptions) {
            const payload = {
                businessId: apiConfig.businessId,
                blocks: params.blocks || [],
                market: params.market || 'US',
                parts: params.parts.map((p) => ({
                    serviceId: p.serviceId,
                    from: p.from,
                    to: p.to,
                    blocks: p.blocks,
                    reservationMethod: p.reservationMethod,
                    providerId: p.providerId
                })),
                ...(params.paymentMethod && { paymentMethod: params.paymentMethod }),
                ...(params.promoCode && { promoCode: params.promoCode })
            };

            return apiConfig.httpClient.post(`/v1/reservations/checkout`, payload, options);
        },

        async getAvailableSlots(params: GetAvailableSlotsParams, options?: RequestOptions) {
            const { serviceId, ...queryParams } = params;

            return apiConfig.httpClient.get(
                `/v1/businesses/${apiConfig.businessId}/services/${serviceId}/available-slots`,
                {
                    ...options,
                    params: {
                        ...queryParams,
                        limit: queryParams.limit || 1000
                    }
                }
            );
        }
    };
};
