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

        /**
         * Sign in anonymously (creates guest session if not already authenticated)
         * Following Firebase/Supabase pattern - idempotent, safe to call multiple times
         */
        async signInAnonymously(options?: RequestOptions) {
            const tokens = await apiConfig.getToken();
            if (tokens?.accessToken) {
                // Already authenticated, return current tokens
                return tokens;
            }
            // Create guest session - mark as guest
            const result = await apiConfig.httpClient.post('/v1/auth/session', {}, options);
            if (result?.accessToken) {
                apiConfig.setToken({ ...result, isGuest: true });
            }
            return result;
        },

        /**
         * Check if current user is a guest (anonymous)
         * Guest emails follow pattern: guest+uuid@arky.io
         */
        async isGuest(): Promise<boolean> {
            const tokens = await apiConfig.getToken();
            if (!tokens?.accessToken) return true;
            const email = (tokens as any).email || "";
            return !email || email.startsWith("guest+");
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
         * Verify platform auth code - automatically sets token on success
         * POST /auth/verify
         */
        async verify(params: MagicLinkVerifyParams, options?: RequestOptions) {
            const result = await apiConfig.httpClient.post('/v1/auth/verify', params, options);
            if (result?.accessToken) {
                apiConfig.setToken({ ...result, email: params.email, isGuest: false });
            }
            return result;
        },

        /**
         * Refresh access token
         * POST /auth/refresh
         */
        async refresh(params: { refreshToken: string }, options?: RequestOptions) {
            return apiConfig.httpClient.post('/v1/auth/refresh', params, options);
        },

        // ==================== BUSINESS AUTH (arky.io, delfin, soulofstrings) ====================

        /**
         * Request business auth code
         * POST /businesses/{businessId}/auth/code
         */
        async businessCode(businessId: string, params: { email: string }, options?: RequestOptions) {
            return apiConfig.httpClient.post(`/v1/businesses/${businessId}/auth/code`, params, options);
        },

        /**
         * Verify business auth code - automatically sets token on success
         * POST /businesses/{businessId}/auth/verify
         */
        async businessVerify(businessId: string, params: MagicLinkVerifyParams, options?: RequestOptions) {
            const result = await apiConfig.httpClient.post(`/v1/businesses/${businessId}/auth/verify`, params, options);
            if (result?.accessToken) {
                apiConfig.setToken({ ...result, email: params.email, isGuest: false });
            }
            return result;
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
