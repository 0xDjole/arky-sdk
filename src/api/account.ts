import type { ApiConfig } from "../index";
import type {
  CreateAccountApiTokenParams,
  DeleteAccountParams,
  GetMeParams,
  RequestOptions,
  SearchAccountsParams,
  UpdateAccountApiTokenParams,
  UpdateAccountContactParams,
} from "../types/api";
import type {
  Account,
  AccountApiToken,
  AccountApiTokenCreated,
  AccountSession,
  AccountUpdateResponse,
  PaginatedResponse,
} from "../types";

export const createAccountApi = (apiConfig: ApiConfig) => ({
  async updateAccount(
    _params: UpdateAccountContactParams,
    options?: RequestOptions,
  ): Promise<AccountUpdateResponse> {
    return apiConfig.httpClient.put<AccountUpdateResponse>(
      "/v1/accounts",
      {},
      options,
    );
  },

  async deleteAccount(
    _params: DeleteAccountParams,
    options?: RequestOptions,
  ): Promise<{ success: boolean; message: string }> {
    return apiConfig.httpClient.delete<{ success: boolean; message: string }>(
      "/v1/accounts",
      options,
    );
  },

  async getMe(
    _params: GetMeParams,
    options?: RequestOptions,
  ): Promise<Account> {
    return apiConfig.httpClient.get<Account>("/v1/accounts/me", options);
  },

  async searchAccounts(
    params: SearchAccountsParams,
    options?: RequestOptions,
  ): Promise<PaginatedResponse<Account>> {
    return apiConfig.httpClient.get<PaginatedResponse<Account>>(
      "/v1/accounts/search",
      { ...options, params },
    );
  },

  async listApiTokens(
    options?: RequestOptions,
  ): Promise<PaginatedResponse<AccountApiToken>> {
    return apiConfig.httpClient.get<PaginatedResponse<AccountApiToken>>(
      "/v1/accounts/me/api-tokens",
      options,
    );
  },

  async createApiToken(
    params: CreateAccountApiTokenParams,
    options?: RequestOptions,
  ): Promise<AccountApiTokenCreated> {
    return apiConfig.httpClient.post<AccountApiTokenCreated>(
      "/v1/accounts/me/api-tokens",
      params,
      options,
    );
  },

  async updateApiToken(
    params: UpdateAccountApiTokenParams,
    options?: RequestOptions,
  ): Promise<AccountApiToken> {
    const { id, ...payload } = params;
    return apiConfig.httpClient.put<AccountApiToken>(
      `/v1/accounts/me/api-tokens/${id}`,
      payload,
      options,
    );
  },

  async revokeApiToken(
    id: string,
    options?: RequestOptions,
  ): Promise<boolean> {
    return apiConfig.httpClient.delete<boolean>(
      `/v1/accounts/me/api-tokens/${id}`,
      options,
    );
  },

  async listSessions(
    options?: RequestOptions,
  ): Promise<PaginatedResponse<AccountSession>> {
    return apiConfig.httpClient.get<PaginatedResponse<AccountSession>>(
      "/v1/accounts/me/sessions",
      options,
    );
  },

  async revokeSession(
    id: string,
    options?: RequestOptions,
  ): Promise<boolean> {
    return apiConfig.httpClient.delete<boolean>(
      `/v1/accounts/me/sessions/${id}`,
      options,
    );
  },
});
