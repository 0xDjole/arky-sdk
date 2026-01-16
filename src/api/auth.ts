import type { ApiConfig } from '../index';
import type {
    MagicLinkRequestParams,
    MagicLinkVerifyParams,
    RequestOptions
} from '../types/api';

export const createAuthApi = (apiConfig: ApiConfig) => {
    return {
        /**
         * Create a guest session (anonymous user)
         * POST /auth/session
         */
        async session(options?: RequestOptions) {
            return apiConfig.httpClient.post('/v1/auth/session', {}, options);
        },

        // ==================== PLATFORM AUTH (Admin) ====================

        /**
         * Request platform auth code (Arky admin)
         * POST /auth/code
         */
        async code(params: { email: string }, options?: RequestOptions) {
            return apiConfig.httpClient.post('/v1/auth/code', params, options);
        },

        /**
         * Verify platform auth code
         * POST /auth/verify
         */
        async verify(params: MagicLinkVerifyParams, options?: RequestOptions) {
            return apiConfig.httpClient.post('/v1/auth/verify', params, options);
        },

        /**
         * Refresh access token
         * POST /auth/refresh
         */
        async refresh(params: { refreshToken: string }, options?: RequestOptions) {
            return apiConfig.httpClient.post('/v1/auth/refresh', params, options);
        },

        // ==================== BUSINESS AUTH (arky.io, delfin, korvus) ====================

        /**
         * Request business auth code
         * POST /businesses/{businessId}/auth/code
         */
        async businessCode(businessId: string, params: { email: string }, options?: RequestOptions) {
            return apiConfig.httpClient.post(`/v1/businesses/${businessId}/auth/code`, params, options);
        },

        /**
         * Verify business auth code
         * POST /businesses/{businessId}/auth/verify
         */
        async businessVerify(businessId: string, params: MagicLinkVerifyParams, options?: RequestOptions) {
            return apiConfig.httpClient.post(`/v1/businesses/${businessId}/auth/verify`, params, options);
        },

        // ==================== DEPRECATED (for backwards compatibility) ====================

        /**
         * @deprecated Use code() instead
         */
        async magicLink(params: MagicLinkRequestParams, options?: RequestOptions) {
            return apiConfig.httpClient.post('/v1/auth/code', params, options);
        }
    };
};
