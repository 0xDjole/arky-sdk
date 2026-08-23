import type {
  ApiConfig,
  AdminSessionInternal,
  AdminSessionUpdater,
} from "../services/clientTypes";
import type {
  AuthToken,
  PendingAccountSession,
  RefreshAccountSessionParams,
  RequestOptions,
  RequestPendingAccountSessionParams,
  VerifyPendingAccountSessionParams,
} from "../types/api";

export const createAuthApi = (
  apiConfig: ApiConfig,
  updateSession: AdminSessionUpdater,
) => {
  const pendingEmails = new Map<string, string>();

  function applyAuthToken(result: AuthToken, email?: string) {
    updateSession((previous) => {
      const next: AdminSessionInternal = {
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        access_expires_at: result.access_expires_at,
        email: email ?? previous?.email,
      };
      return next;
    });
  }

  return {
    async code(
      params: RequestPendingAccountSessionParams,
      options?: RequestOptions,
    ): Promise<PendingAccountSession> {
      const result = await apiConfig.httpClient.post<PendingAccountSession>(
        "/v1/auth/code",
        params,
        options,
      );
      pendingEmails.set(result.session_id, params.email);
      return result;
    },

    async verify(
      params: VerifyPendingAccountSessionParams,
      options?: RequestOptions,
    ): Promise<AuthToken> {
      const result = await apiConfig.httpClient.post<AuthToken>(
        "/v1/auth/verify",
        params,
        options,
      );
      if (result?.access_token) {
        applyAuthToken(result, pendingEmails.get(params.session_id));
        pendingEmails.delete(params.session_id);
      }
      return result;
    },

    async refresh(
      params: RefreshAccountSessionParams,
      options?: RequestOptions,
    ): Promise<AuthToken> {
      const result = await apiConfig.httpClient.post<AuthToken>(
        "/v1/auth/refresh",
        params,
        options,
      );
      if (result?.access_token) applyAuthToken(result);
      return result;
    },

    async storeCode(
      storeId: string,
      params: RequestPendingAccountSessionParams,
      options?: RequestOptions,
    ): Promise<PendingAccountSession> {
      const result = await apiConfig.httpClient.post<PendingAccountSession>(
        `/v1/stores/${storeId}/auth/code`,
        params,
        options,
      );
      pendingEmails.set(result.session_id, params.email);
      return result;
    },

    async storeVerify(
      storeId: string,
      params: VerifyPendingAccountSessionParams,
      options?: RequestOptions,
    ): Promise<AuthToken> {
      const result = await apiConfig.httpClient.post<AuthToken>(
        `/v1/stores/${storeId}/auth/verify`,
        params,
        options,
      );
      if (result?.access_token) {
        applyAuthToken(result, pendingEmails.get(params.session_id));
        pendingEmails.delete(params.session_id);
      }
      return result;
    },
  };
};
