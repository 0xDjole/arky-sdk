import type { ApiConfig } from '../index';
import type {
    MagicLinkRequestParams,
    MagicLinkVerifyParams,
    RequestOptions
} from '../types/api';

export const createAuthApi = (apiConfig: ApiConfig) => {
    return {

        async code(params: { email: string }, options?: RequestOptions) {
            return apiConfig.httpClient.post('/v1/auth/code', params, options);
        },

        async verify(params: MagicLinkVerifyParams, options?: RequestOptions) {
            const result = await apiConfig.httpClient.post('/v1/auth/verify', params, options);
            if (result?.access_token) {
                apiConfig.setToken({ ...result, email: params.email, is_verified: true });
            }
            return result;
        },

        async refresh(params: { refresh_token: string }, options?: RequestOptions) {
            return apiConfig.httpClient.post('/v1/auth/refresh', params, options);
        },

        async storeCode(storeId: string, params: { email: string }, options?: RequestOptions) {
            return apiConfig.httpClient.post(`/v1/stores/${storeId}/auth/code`, params, options);
        },

        async storeVerify(storeId: string, params: MagicLinkVerifyParams, options?: RequestOptions) {
            const result = await apiConfig.httpClient.post(`/v1/stores/${storeId}/auth/verify`, params, options);
            if (result?.access_token) {
                apiConfig.setToken({ ...result, email: params.email, is_verified: true });
            }
            return result;
        },

        async magicLink(params: MagicLinkRequestParams, options?: RequestOptions) {
            return apiConfig.httpClient.post('/v1/auth/code', params, options);
        }
    };
};
