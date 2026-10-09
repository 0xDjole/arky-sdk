import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  Account,
  AccountApiToken,
  AccountApiTokenCreated,
  AccountSession,
  CreateAccountApiTokenParams,
  ListAccountApiTokensParams,
  ListAccountSessionsParams,
  RevokeAccountApiTokenParams,
  RevokeAccountSessionParams,
  SearchAccountsParams,
  UpdateAccountApiTokenParams,
} from "../types/account";
import { requireId } from "../utils/ids";
import { segment } from "./paths";

export interface DeleteAccountResult {
  success: boolean;
  message: string;
}

export const createAccountApi = (apiConfig: ApiConfig) => ({
  getMe(options?: RequestOptions): Promise<Account> {
    return apiConfig.httpClient.get<Account>("/v1/accounts/me", options);
  },

  delete(options?: RequestOptions): Promise<DeleteAccountResult> {
    return apiConfig.httpClient.delete<DeleteAccountResult>("/v1/accounts", options);
  },

  search(params: SearchAccountsParams = {}, options?: RequestOptions): Promise<PaginatedResponse<Account>> {
    return apiConfig.httpClient.get<PaginatedResponse<Account>>("/v1/accounts/search", { ...options, params });
  },

  apiToken: {
    list(params: ListAccountApiTokensParams = {}, options?: RequestOptions): Promise<PaginatedResponse<AccountApiToken>> {
      return apiConfig.httpClient.get<PaginatedResponse<AccountApiToken>>("/v1/accounts/me/api-tokens", {
        ...options,
        params,
      });
    },

    create(params: CreateAccountApiTokenParams, options?: RequestOptions): Promise<AccountApiTokenCreated> {
      requireId(params.id, "API key");
      return apiConfig.httpClient.post<AccountApiTokenCreated>(
        "/v1/accounts/me/api-tokens",
        { id: params.id, name: params.name, expires_at: params.expires_at },
        options,
      );
    },

    update(params: UpdateAccountApiTokenParams, options?: RequestOptions): Promise<AccountApiToken> {
      return apiConfig.httpClient.put<AccountApiToken>(
        `/v1/accounts/me/api-tokens/${segment(params.id)}`,
        { name: params.name },
        options,
      );
    },

    revoke(params: RevokeAccountApiTokenParams, options?: RequestOptions): Promise<boolean> {
      return apiConfig.httpClient.delete<boolean>(`/v1/accounts/me/api-tokens/${segment(params.id)}`, options);
    },
  },

  session: {
    list(params: ListAccountSessionsParams = {}, options?: RequestOptions): Promise<PaginatedResponse<AccountSession>> {
      return apiConfig.httpClient.get<PaginatedResponse<AccountSession>>("/v1/accounts/me/sessions", {
        ...options,
        params,
      });
    },

    revoke(params: RevokeAccountSessionParams, options?: RequestOptions): Promise<boolean> {
      return apiConfig.httpClient.delete<boolean>(`/v1/accounts/me/sessions/${segment(params.id)}`, options);
    },
  },
});
