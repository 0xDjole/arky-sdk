import type { ApiConfig, AdminSessionInternal, AdminSessionUpdater } from '../index';
import type {
    AuthCodeVerifyParams,
    AuthToken,
    RequestOptions,
    VerificationChallengeResponse,
} from '../types/api';

export const createAuthApi = (apiConfig: ApiConfig, updateSession: AdminSessionUpdater) => {
    const pendingEmails = new Map<string, string>();

    function applyAuthToken(result: AuthToken, email?: string) {
        const next: AdminSessionInternal = {
            access_token: result.access_token,
            refresh_token: result.refresh_token,
            access_expires_at: result.access_expires_at,
            email,
        };
        updateSession(() => next);
    }

    return {

        async code(params: { email: string }, options?: RequestOptions): Promise<VerificationChallengeResponse> {
            const result = await apiConfig.httpClient.post<VerificationChallengeResponse>('/v1/auth/code', params, options);
            pendingEmails.set(result.challenge_id, params.email);
            return result;
        },

        async verify(params: AuthCodeVerifyParams, options?: RequestOptions): Promise<AuthToken> {
            const result = await apiConfig.httpClient.post<AuthToken>(
                '/v1/auth/verify',
                params,
                options,
            );
            if (result?.access_token) {
                applyAuthToken(result, pendingEmails.get(params.challenge_id));
                pendingEmails.delete(params.challenge_id);
            }
            return result;
        },

        async refresh(params: { refresh_token: string }, options?: RequestOptions): Promise<AuthToken> {
            return apiConfig.httpClient.post<AuthToken>('/v1/auth/refresh', params, options);
        },

        async storeCode(storeId: string, params: { email: string }, options?: RequestOptions): Promise<VerificationChallengeResponse> {
            const result = await apiConfig.httpClient.post<VerificationChallengeResponse>(`/v1/stores/${storeId}/auth/code`, params, options);
            pendingEmails.set(result.challenge_id, params.email);
            return result;
        },

        async storeVerify(storeId: string, params: AuthCodeVerifyParams, options?: RequestOptions): Promise<AuthToken> {
            const result = await apiConfig.httpClient.post<AuthToken>(
                `/v1/stores/${storeId}/auth/verify`,
                params,
                options,
            );
            if (result?.access_token) {
                applyAuthToken(result, pendingEmails.get(params.challenge_id));
                pendingEmails.delete(params.challenge_id);
            }
            return result;
        }
    };
};
