import type { ApiConfig } from '../index';
import type {
    UpdateUserProfileParams,
    LoginUserParams,
    RegisterUserParams,
    UpdateProfilePhoneParams,
    VerifyPhoneCodeParams,
    SearchUsersParams,
    SetRoleParams,
    ConfirmUserParams,
    GetLoginUrlParams,
    ForgotPasswordParams,
    ResetForgotPasswordParams,
    ResetPasswordParams,
    GetMeParams,
    LogoutParams,
    RequestOptions
} from '../types/api';

export const createUserApi = (apiConfig: ApiConfig) => {
    return {
        // ===== USER PROFILE =====

        async updateUser(params: UpdateUserProfileParams, options?: RequestOptions) {
            const payload = {
                name: params.name,
                phoneNumbers: params.phoneNumbers || [],
                phoneNumber: params.phoneNumber || null,
                addresses: params.addresses || [],
                ...(params.apiTokens !== undefined && { apiTokens: params.apiTokens })
            };

            return apiConfig.httpClient.put('/v1/users/update', payload, options);
        },

        async updateProfilePhone(params: UpdateProfilePhoneParams, options?: RequestOptions) {
            const payload = {
                phoneNumbers: [],
                phoneNumber: params.phoneNumber,
                addresses: []
            };

            return apiConfig.httpClient.put('/v1/users/update', payload, options);
        },

        async verifyPhoneCode(params: VerifyPhoneCodeParams, options?: RequestOptions) {
            return apiConfig.httpClient.put('/v1/users/confirm/phone-number', params, options);
        },

        async getMe(params: GetMeParams, options?: RequestOptions) {
            return apiConfig.httpClient.get('/v1/users/me', options);
        },

        async searchUsers(params: SearchUsersParams, options?: RequestOptions) {
            return apiConfig.httpClient.get('/v1/users/search', {
                ...options,
                params: {
                    ...params,
                    businessId: apiConfig.businessId
                }
            });
        },

        async setUserRole(params: SetRoleParams, options?: RequestOptions) {
            return apiConfig.httpClient.put('/v1/users/set-role', params, options);
        },

        // ===== AUTHENTICATION =====

        async loginUser(params: LoginUserParams, options?: RequestOptions) {
            return apiConfig.httpClient.post('/v1/users/login', params, options);
        },

        async registerUser(params: RegisterUserParams, options?: RequestOptions) {
            return apiConfig.httpClient.post('/v1/users/register', params, options);
        },

        async logout(params: LogoutParams, options?: RequestOptions) {
            return apiConfig.httpClient.post('/v1/users/logout', {}, options);
        },

        async confirmUser(params: ConfirmUserParams, options?: RequestOptions) {
            return apiConfig.httpClient.put('/v1/users/confirm', params, options);
        },

        async getLoginUrl(params: GetLoginUrlParams, options?: RequestOptions) {
            return apiConfig.httpClient.get('/v1/users/login/url', {
                ...options,
                params
            });
        },

        // ===== PASSWORD MANAGEMENT =====

        async forgotPassword(params: ForgotPasswordParams, options?: RequestOptions) {
            return apiConfig.httpClient.post('/v1/users/forgot-password', params, options);
        },

        async resetForgotPassword(params: ResetForgotPasswordParams, options?: RequestOptions) {
            return apiConfig.httpClient.post('/v1/users/reset-forgot-password', params, options);
        },

        async resetPassword(params: ResetPasswordParams, options?: RequestOptions) {
            return apiConfig.httpClient.post('/v1/users/reset-password', params, options);
        }
    };
};
