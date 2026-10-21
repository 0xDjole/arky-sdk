import { ArkyError } from "../types/apiError";
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
        throw new ArkyError('session_changed', 'The Account session changed during sign-in');
      }
      const next: AdminSessionInternal = {
        id: result.id,
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        access_expires_at: result.access_expires_at,
        email: email ?? previous?.email,
      };
      return next;
    });
  }

  function authPath(storeId: string | undefined, path: "code" | "verify"): string {
    return storeId === undefined ? `/v1/auth/${path}` : `/v1/stores/${requireStoreId(storeId)}/auth/${path}`;
  }

  return {
    async requestCode(
      params: RequestPendingAccountSessionParams,
      options?: RequestOptions,
    ): Promise<PendingAccountSession> {
      const body = params.store_id === undefined
        ? { email: params.email }
        : { email: params.email, language: params.language };
      const result = await apiConfig.httpClient.post<PendingAccountSession>(authPath(params.store_id, "code"), body, options);
      pendingEmails.set(result.session_id, params.email);
      return result;
    },

    async verify(
      params: VerifyPendingAccountSessionParams,
      options?: RequestOptions,
    ): Promise<AuthToken> {
      const expectedSessionId = apiConfig.authStorage.getTokens()?.id;
      const result = await apiConfig.httpClient.post<AuthToken>(
        authPath(params.store_id, "verify"),
        { session_id: params.session_id, code: params.code },
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
  };
};
