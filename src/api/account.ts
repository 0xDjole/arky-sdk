import type { ApiConfig } from '../index';
import type {
    UpdateAccountProfileParams,
    AddPhoneNumberParams,
    PhoneNumberConfirmParams,
    SearchAccountsParams,
    SetRoleParams,
    DeleteAccountParams,
    GetMeParams,
    AccountSubscribeParams,
    RequestOptions
} from '../types/api';

export const createAccountApi = (apiConfig: ApiConfig) => {
    return {
        // ===== ACCOUNT PROFILE =====

        async updateAccount(params: UpdateAccountProfileParams, options?: RequestOptions) {
            const payload: any = {};

            if (params.phoneNumbers !== undefined) payload.phoneNumbers = params.phoneNumbers;
            if (params.addresses !== undefined) payload.addresses = params.addresses;
            if (params.apiTokens !== undefined) payload.apiTokens = params.apiTokens;

            return apiConfig.httpClient.put('/v1/accounts', payload, options);
        },

        async deleteAccount(params: DeleteAccountParams, options?: RequestOptions) {
            return apiConfig.httpClient.delete('/v1/accounts', options);
        },

        async addPhoneNumber(params: AddPhoneNumberParams, options?: RequestOptions) {
            return apiConfig.httpClient.post('/v1/accounts/phone-number', params, options);
        },

        async phoneNumberConfirm(params: PhoneNumberConfirmParams, options?: RequestOptions) {
            return apiConfig.httpClient.post('/v1/accounts/phone-number/confirm', params, options);
        },

        async getMe(params: GetMeParams, options?: RequestOptions) {
            return apiConfig.httpClient.get('/v1/accounts/me', options);
        },

        async searchAccounts(params: SearchAccountsParams, options?: RequestOptions) {
            return apiConfig.httpClient.get('/v1/accounts/search', {
                ...options,
                params: {
                    ...params,
                    businessId: apiConfig.businessId
                }
            });
        },

        async setRole(params: SetRoleParams, options?: RequestOptions) {
            return apiConfig.httpClient.put('/v1/accounts/set-role', params, options);
        },

        // ===== SUBSCRIPTION =====

        async subscribe(params: AccountSubscribeParams, options?: RequestOptions) {
            return apiConfig.httpClient.post('/v1/accounts/subscribe', params, options);
        }
    };
};
