import type { ApiConfig } from '../index';
import type {
    UpdateAccountContactParams,
    SearchAccountsParams,
    DeleteAccountParams,
    GetMeParams,
    RequestOptions
} from '../types/api';
import type { Account, AccountUpdateResponse } from '../types';

export const createAccountApi = (apiConfig: ApiConfig) => {
    return {
        async updateAccount(params: UpdateAccountContactParams, options?: RequestOptions): Promise<AccountUpdateResponse> {
            const payload: Record<string, unknown> = {};

            if (params.phone_numbers !== undefined) payload.phone_numbers = params.phone_numbers;
            if (params.addresses !== undefined) payload.addresses = params.addresses;
            if (params.api_tokens !== undefined) payload.api_tokens = params.api_tokens;

            return apiConfig.httpClient.put<AccountUpdateResponse>('/v1/accounts', payload, options);
        },

        async deleteAccount(_params: DeleteAccountParams, options?: RequestOptions): Promise<{ deleted: boolean }> {
            return apiConfig.httpClient.delete<{ deleted: boolean }>('/v1/accounts', options);
        },

        async getMe(_params: GetMeParams, options?: RequestOptions): Promise<Account> {
            return apiConfig.httpClient.get<Account>('/v1/accounts/me', options);
        },

        async searchAccounts(params: SearchAccountsParams, options?: RequestOptions): Promise<{ items: Account[]; cursor?: string | null }> {
            return apiConfig.httpClient.get<{ items: Account[]; cursor?: string | null }>('/v1/accounts/search', {
                ...options,
                params: {
                    ...params,
                    store_id: apiConfig.storeId
                }
            });
        },
    };
};
