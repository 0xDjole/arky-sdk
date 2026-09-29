import { requireStoreId } from "../utils/storeTarget";
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
  refreshSession: (refreshToken: string) => Promise<AuthToken>,
) => {
  const pendingEmails = new Map<string, string>();

  function applyAuthToken(result: AuthToken, expectedSessionId: string | undefined, email?: string) {
    updateSession((previous) => {
      if (previous?.id !== expectedSessionId) {
        throw Object.assign(new Error('The Account session changed during sign-in'), { name: 'SessionChangedError' });
      }
      const next: AdminSessionInternal = {
        id: result.id,
        scope: result.scope,
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
      const expectedSessionId = apiConfig.authStorage.getTokens()?.id;
      const result = await apiConfig.httpClient.post<AuthToken>(
        "/v1/auth/verify",
        params,
        options,
      );
      if (result?.access_token) {
        applyAuthToken(result, expectedSessionId, pendingEmails.get(params.session_id));
        pendingEmails.delete(params.session_id);
      }
      return result;
    },

    async refresh(
      params: RefreshAccountSessionParams,
      options?: RequestOptions,
    ): Promise<AuthToken> {
      return refreshSession(params.refresh_token);
    },

    async storeCode(
      storeId: string,
      params: RequestPendingAccountSessionParams,
      options?: RequestOptions,
    ): Promise<PendingAccountSession> {
      const result = await apiConfig.httpClient.post<PendingAccountSession>(
        `/v1/stores/${requireStoreId(storeId)}/auth/code`,
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
      const expectedSessionId = apiConfig.authStorage.getTokens()?.id;
      const result = await apiConfig.httpClient.post<AuthToken>(
        `/v1/stores/${requireStoreId(storeId)}/auth/verify`,
        params,
        options,
      );
      if (result?.access_token) {
        applyAuthToken(result, expectedSessionId, pendingEmails.get(params.session_id));
        pendingEmails.delete(params.session_id);
      }
      return result;
    },
  };
};
