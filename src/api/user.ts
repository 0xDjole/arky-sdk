import type { ApiConfig } from '../index';
import type {
    UpdateUserProfileParams,
    LoginUserParams,
    RegisterUserParams,
    AddPhoneNumberParams,
    PhoneNumberConfirmParams,
    SearchUsersParams,
    SetRoleParams,
    ConfirmUserParams,
    GetLoginUrlParams,
    ForgotPasswordParams,
    ResetForgotPasswordParams,
    ResetPasswordParams,
    GetMeParams,
    LogoutParams,
    UserSubscribeParams,
    RequestOptions
} from '../types/api';

export const createUserApi = (apiConfig: ApiConfig) => {
    return {
        // ===== USER PROFILE =====

        async updateUser(params: UpdateUserProfileParams, options?: RequestOptions) {
            const payload: any = {};

            if (params.name !== undefined) payload.name = params.name;
            if (params.phoneNumbers !== undefined) payload.phoneNumbers = params.phoneNumbers;
            if (params.addresses !== undefined) payload.addresses = params.addresses;
            if (params.apiTokens !== undefined) payload.apiTokens = params.apiTokens;

            return apiConfig.httpClient.put('/v1/users', payload, options);
        },

        async addPhoneNumber(params: AddPhoneNumberParams, options?: RequestOptions) {
            return apiConfig.httpClient.post('/v1/users/phone-number', params, options);
        },

        async phoneNumberConfirm(params: PhoneNumberConfirmParams, options?: RequestOptions) {
            return apiConfig.httpClient.post('/v1/users/phone-number/confirm', params, options);
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

        async setRole(params: SetRoleParams, options?: RequestOptions) {
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
        },

        async subscribe(params: UserSubscribeParams, options?: RequestOptions) {
            return apiConfig.httpClient.post('/v1/users/subscribe', params, options);
        }
    };
};
