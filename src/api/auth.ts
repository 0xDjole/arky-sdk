import type { ApiConfig } from '../index';
import type {
    MagicLinkRequestParams,
    MagicLinkVerifyParams,
    RequestOptions
} from '../types/api';

export const createAuthApi = (apiConfig: ApiConfig) => {
    return {
        
        async session(options?: RequestOptions) {
            return apiConfig.httpClient.post('/v1/auth/session', {}, options);
        },

        async signInAnonymously(options?: RequestOptions) {
            const tokens = await apiConfig.getToken();
            if (tokens?.accessToken) {
                
                return tokens;
            }
            
            const result = await apiConfig.httpClient.post('/v1/auth/session', {}, options);
            if (result?.accessToken) {
                apiConfig.setToken({ ...result, isGuest: true });
            }
            return result;
        },

        async isGuest(): Promise<boolean> {
            const tokens = await apiConfig.getToken();
            if (!tokens?.accessToken) return true;
            const email = (tokens as any).email || "";
            return !email || email.startsWith("guest+");
        },

        async code(params: { email: string }, options?: RequestOptions) {
            return apiConfig.httpClient.post('/v1/auth/code', params, options);
        },

        async verify(params: MagicLinkVerifyParams, options?: RequestOptions) {
            const result = await apiConfig.httpClient.post('/v1/auth/verify', params, options);
            if (result?.accessToken) {
                apiConfig.setToken({ ...result, email: params.email, isGuest: false });
            }
            return result;
        },

        async refresh(params: { refreshToken: string }, options?: RequestOptions) {
            return apiConfig.httpClient.post('/v1/auth/refresh', params, options);
        },

        async businessCode(businessId: string, params: { email: string }, options?: RequestOptions) {
            return apiConfig.httpClient.post(`/v1/businesses/${businessId}/auth/code`, params, options);
        },

        async businessVerify(businessId: string, params: MagicLinkVerifyParams, options?: RequestOptions) {
            const result = await apiConfig.httpClient.post(`/v1/businesses/${businessId}/auth/verify`, params, options);
            if (result?.accessToken) {
                apiConfig.setToken({ ...result, email: params.email, isGuest: false });
            }
            return result;
        },

        async magicLink(params: MagicLinkRequestParams, options?: RequestOptions) {
            return apiConfig.httpClient.post('/v1/auth/code', params, options);
        }
    };
};
