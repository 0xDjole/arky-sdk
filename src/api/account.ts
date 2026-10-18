import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { PaginatedResponse } from "../types/common";
import type {
  Account,
  AccountSession,
  FindAccountSessionsParams,
  FindAccountsParams,
  RevokeAccountSessionParams,
} from "../types/account";
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

  find(params: FindAccountsParams = {}, options?: RequestOptions): Promise<PaginatedResponse<Account>> {
    return apiConfig.httpClient.get<PaginatedResponse<Account>>("/v1/accounts/search", { ...options, params });
  },

  session: {
    find(params: FindAccountSessionsParams = {}, options?: RequestOptions): Promise<PaginatedResponse<AccountSession>> {
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
