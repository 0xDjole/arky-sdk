import type { ApiConfig } from '../index';
import type {
    MagicLinkRequestParams,
    MagicLinkVerifyParams,
    AuthToken,
    RequestOptions
} from '../types/api';

export const createAuthApi = (apiConfig: ApiConfig) => {
    return {

        async code(params: { email: string }, options?: RequestOptions): Promise<{ sent: boolean }> {
            return apiConfig.httpClient.post<{ sent: boolean }>('/v1/auth/code', params, options);
        },

        async verify(params: MagicLinkVerifyParams, options?: RequestOptions): Promise<AuthToken> {
            const result = await apiConfig.httpClient.post<AuthToken & { access_token?: string }>(
                '/v1/auth/verify',
                params,
                options,
            );
            if (result?.access_token) {
                apiConfig.setToken({ access_token: result.access_token, refresh_token: result.refresh_token });
            }
            return result;
        },

        async refresh(params: { refresh_token: string }, options?: RequestOptions): Promise<AuthToken> {
            return apiConfig.httpClient.post<AuthToken>('/v1/auth/refresh', params, options);
        },

        async storeCode(storeId: string, params: { email: string }, options?: RequestOptions): Promise<{ sent: boolean }> {
            return apiConfig.httpClient.post<{ sent: boolean }>(`/v1/stores/${storeId}/auth/code`, params, options);
        },

        async storeVerify(storeId: string, params: MagicLinkVerifyParams, options?: RequestOptions): Promise<AuthToken> {
            const result = await apiConfig.httpClient.post<AuthToken & { access_token?: string }>(
                `/v1/stores/${storeId}/auth/verify`,
                params,
                options,
            );
            if (result?.access_token) {
                apiConfig.setToken({ access_token: result.access_token, refresh_token: result.refresh_token });
            }
            return result;
        },

        async magicLink(params: MagicLinkRequestParams, options?: RequestOptions): Promise<{ sent: boolean }> {
            return apiConfig.httpClient.post<{ sent: boolean }>('/v1/auth/code', params, options);
        }
    };
};
