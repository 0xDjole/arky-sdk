import type { ApiConfig } from "../services/clientTypes";
import type { RequestOptions } from "../types/api";
import type { DeletedResponse, PaginatedResponse } from "../types/common";
import type {
  Account,
  AccountSession,
  AccountToken,
  AccountTokenCreated,
  CreateAccountTokenParams,
  DeleteAccountTokenParams,
  FindAccountSessionsParams,
  FindAccountsParams,
  FindAccountTokensParams,
  RevokeAccountSessionParams,
  RevokeAccountTokenParams,
} from "../types/account";
import { requireId } from "../utils/ids";
import { segment } from "./paths";

const tokensPath = "/v1/accounts/me/tokens";

export const createAccountApi = (apiConfig: ApiConfig) => ({
  getMe(options?: RequestOptions): Promise<Account> {
    return apiConfig.httpClient.get<Account>("/v1/accounts/me", options);
  },

  delete(options?: RequestOptions): Promise<Account> {
    return apiConfig.httpClient.delete<Account>("/v1/accounts", options);
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

  token: {
    create(params: CreateAccountTokenParams, options?: RequestOptions): Promise<AccountTokenCreated> {
      return apiConfig.httpClient.post<AccountTokenCreated>(
        tokensPath,
        {
          id: requireId(params.id, "account token"),
          name: params.name,
          stores: params.stores,
          expires_at: params.expires_at,
        },
        options,
      );
    },

    find(params: FindAccountTokensParams = {}, options?: RequestOptions): Promise<PaginatedResponse<AccountToken>> {
      return apiConfig.httpClient.get<PaginatedResponse<AccountToken>>(tokensPath, { ...options, params });
    },

    revoke(params: RevokeAccountTokenParams, options?: RequestOptions): Promise<AccountToken> {
      return apiConfig.httpClient.post<AccountToken>(
        `${tokensPath}/${segment(params.id)}/revoke`,
        { expected_updated_at: params.expected_updated_at },
        options,
      );
    },

    delete(params: DeleteAccountTokenParams, options?: RequestOptions): Promise<DeletedResponse> {
      return apiConfig.httpClient.delete<DeletedResponse>(`${tokensPath}/${segment(params.id)}`, {
        ...options,
        params: { expected_updated_at: params.expected_updated_at },
      });
    },
  },
});
