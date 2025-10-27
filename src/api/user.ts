import type { ApiConfig } from '../index';
import type {
    UpdateUserParams,
    LoginUserParams,
    RegisterUserParams,
    UpdateProfilePhoneParams,
    VerifyPhoneCodeParams,
    RequestOptions
} from '../types/api';

export const createUserApi = (apiConfig: ApiConfig) => {
    return {
        async updateUser(params: UpdateUserParams, options?: RequestOptions) {
            const { id, ...updateData } = params;

            return apiConfig.httpClient.put(`/v1/users/${id}`, updateData, options);
        },

        async loginUser(params: LoginUserParams, options?: RequestOptions) {
            return apiConfig.httpClient.post('/v1/users/login', params, options);
        },

        async registerUser(params: RegisterUserParams, options?: RequestOptions) {
            return apiConfig.httpClient.post('/v1/users', params, options);
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

        async getGuestToken(params: { existingToken?: string }, options?: RequestOptions): Promise<string> {
            if (params.existingToken) {
                return params.existingToken;
            }

            const result = await apiConfig.httpClient.post('/v1/users/login', {
                provider: 'GUEST'
            }, options);

            const token = result.accessToken || result.token || '';
            if (token) {
                apiConfig.setTokens(result);
            }
            return token;
        }
    };
};
