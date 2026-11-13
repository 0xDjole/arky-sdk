import { ArkyError } from "../types/apiError";
import { requireId } from "../utils/ids";
import { requireStoreId } from "../utils/storeTarget";
import type {
  ApiConfig,
  AdminSessionInternal,
  AdminSessionUpdater,
} from "../services/clientTypes";
import type {
  AuthToken,
  ConfirmPlatformSecondFactorParams,
  ConfirmSecondFactorParams,
  PendingAccountSession,
  RefreshAccountSessionParams,
  RequestOptions,
  RequestPendingAccountSessionParams,
  RequestPlatformAccountSessionParams,
  SecondFactorSignedIn,
  SetUpPlatformSecondFactorParams,
  SetUpSecondFactorParams,
  VerifyPendingAccountSessionParams,
  VerifyPlatformAccountSessionParams,
  VerifyPlatformSecondFactorParams,
  VerifySecondFactorParams,
} from "../types/api";
import type { SecondFactorSetup } from "../types/account";

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
      const keptEmail = email ?? previous?.email;
      const next: AdminSessionInternal = {
        id: result.id,
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      };
      return keptEmail === undefined ? next : { ...next, email: keptEmail };
    });
  }

  function authPath(
    storeId: string | undefined,
    path: "code" | "verify" | "second-factor" | "second-factor/setup" | "second-factor/confirm",
  ): string {
    return storeId === undefined ? `/v1/auth/${path}` : `/v1/stores/${requireStoreId(storeId)}/auth/${path}`;
  }

  function withNetwork<T extends object>(
    params: { store_id?: string; network_id?: string },
    body: T,
  ): T | (T & { network_id: string }) {
    return params.store_id === undefined ? { ...body, network_id: requireId(params.network_id, "network") } : body;
  }

  function keepVerified(result: AuthToken, expectedSessionId: string | undefined, sessionId: string): AuthToken {
    if (result?.access_token) {
      applyAuthToken(result, expectedSessionId, pendingEmails.get(sessionId));
      pendingEmails.delete(sessionId);
    }
    return result;
  }

  return {
    async requestCode(
      params: RequestPendingAccountSessionParams,
      options?: RequestOptions,
    ): Promise<PendingAccountSession> {
      const sessionId = requireId(params.session_id, "sign-in session");
      const body = params.store_id === undefined
        ? { session_id: sessionId, email: params.email, network_id: requireId(params.network_id, "network") }
        : { session_id: sessionId, email: params.email, language: params.language };
      const result = await apiConfig.httpClient.post<PendingAccountSession>(authPath(params.store_id, "code"), body, options);
      pendingEmails.set(result.session_id, params.email);
      return result;
    },

    async verify(
      params: VerifyPendingAccountSessionParams,
      options?: RequestOptions,
    ): Promise<AuthToken> {
      const expectedSessionId = apiConfig.authStorage.getTokens()?.id;
      const body = params.store_id === undefined
        ? { network_id: requireId(params.network_id, "network"), session_id: params.session_id, code: params.code }
        : { session_id: params.session_id, code: params.code };
      const result = await apiConfig.httpClient.post<AuthToken>(authPath(params.store_id, "verify"), body, options);
      return keepVerified(result, expectedSessionId, params.session_id);
    },

    async requestPlatformCode(
      params: RequestPlatformAccountSessionParams,
      options?: RequestOptions,
    ): Promise<PendingAccountSession> {
      const result = await apiConfig.httpClient.post<PendingAccountSession>(
        "/v1/platform/auth/code",
        { session_id: requireId(params.session_id, "sign-in session"), email: params.email },
        options,
      );
      pendingEmails.set(result.session_id, params.email);
      return result;
    },

    async verifyPlatform(
      params: VerifyPlatformAccountSessionParams,
      options?: RequestOptions,
    ): Promise<AuthToken> {
      const expectedSessionId = apiConfig.authStorage.getTokens()?.id;
      const result = await apiConfig.httpClient.post<AuthToken>(
        "/v1/platform/auth/verify",
        { session_id: params.session_id, code: params.code },
        options,
      );
      return keepVerified(result, expectedSessionId, params.session_id);
    },

    async verifySecondFactor(params: VerifySecondFactorParams, options?: RequestOptions): Promise<AuthToken> {
      const expectedSessionId = apiConfig.authStorage.getTokens()?.id;
      const result = await apiConfig.httpClient.post<AuthToken>(
        authPath(params.store_id, "second-factor"),
        withNetwork(params, {
          session_id: params.session_id,
          code: params.code,
          second_factor_code: params.second_factor_code,
        }),
        options,
      );
      return keepVerified(result, expectedSessionId, params.session_id);
    },

    async setUpSecondFactor(params: SetUpSecondFactorParams, options?: RequestOptions): Promise<SecondFactorSetup> {
      return apiConfig.httpClient.post<SecondFactorSetup>(
        authPath(params.store_id, "second-factor/setup"),
        withNetwork(params, { session_id: params.session_id, code: params.code }),
        options,
      );
    },

    async confirmSecondFactor(
      params: ConfirmSecondFactorParams,
      options?: RequestOptions,
    ): Promise<SecondFactorSignedIn> {
      const expectedSessionId = apiConfig.authStorage.getTokens()?.id;
      const result = await apiConfig.httpClient.post<SecondFactorSignedIn>(
        authPath(params.store_id, "second-factor/confirm"),
        withNetwork(params, {
          session_id: params.session_id,
          code: params.code,
          setup_token: params.setup_token,
          second_factor_code: params.second_factor_code,
        }),
        options,
      );
      keepVerified(result.token, expectedSessionId, params.session_id);
      return result;
    },

    async verifyPlatformSecondFactor(
      params: VerifyPlatformSecondFactorParams,
      options?: RequestOptions,
    ): Promise<AuthToken> {
      const expectedSessionId = apiConfig.authStorage.getTokens()?.id;
      const result = await apiConfig.httpClient.post<AuthToken>(
        "/v1/platform/auth/second-factor",
        { session_id: params.session_id, code: params.code, second_factor_code: params.second_factor_code },
        options,
      );
      return keepVerified(result, expectedSessionId, params.session_id);
    },

    async setUpPlatformSecondFactor(
      params: SetUpPlatformSecondFactorParams,
      options?: RequestOptions,
    ): Promise<SecondFactorSetup> {
      return apiConfig.httpClient.post<SecondFactorSetup>(
        "/v1/platform/auth/second-factor/setup",
        { session_id: params.session_id, code: params.code },
        options,
      );
    },

    async confirmPlatformSecondFactor(
      params: ConfirmPlatformSecondFactorParams,
      options?: RequestOptions,
    ): Promise<SecondFactorSignedIn> {
      const expectedSessionId = apiConfig.authStorage.getTokens()?.id;
      const result = await apiConfig.httpClient.post<SecondFactorSignedIn>(
        "/v1/platform/auth/second-factor/confirm",
        {
          session_id: params.session_id,
          code: params.code,
          setup_token: params.setup_token,
          second_factor_code: params.second_factor_code,
        },
        options,
      );
      keepVerified(result.token, expectedSessionId, params.session_id);
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
