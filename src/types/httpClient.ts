import type { EpochMilliseconds } from "./time";
import type { QueryParams } from "../utils/queryParams";

export interface TokenSet {
  access_token: string;
  refresh_token?: string;
  access_expires_at?: EpochMilliseconds;
}

export interface AuthStorage {
  getTokens(): TokenSet | null;
  onTokensRefreshed(tokens: TokenSet): void;
  onForcedLogout(): void;
}

export interface RequestSuccessContext<T = unknown> {
  data: T;
  method: string;
  url: string;
  status: number;
  request?: unknown;
  duration_ms?: number;
  request_id?: string | null;
}

export interface RequestErrorContext {
  error: unknown;
  method: string;
  url: string;
  status?: number;
  request?: unknown;
  response?: unknown;
  duration_ms?: number;
  request_id?: string | null;
  aborted?: boolean;
}

export interface RequestOptions<T = unknown> {
  headers?: Record<string, string>;
  params?: QueryParams;
  signal?: AbortSignal;
  transformRequest?: (data: unknown) => unknown;
  onSuccess?: (ctx: RequestSuccessContext<T>) => void | Promise<void>;
  onError?: (ctx: RequestErrorContext) => void | Promise<void>;
}

export interface ScheduledMutationOptions<
  T = unknown,
> extends RequestOptions<T> {
  onScheduledResponse?: (response: T) => void | Promise<void>;
}

export interface HttpClient {
  get<T>(path: string, opts?: RequestOptions<T>): Promise<T>;
  post<T>(path: string, body: unknown, opts?: RequestOptions<T>): Promise<T>;
  put<T>(path: string, body: unknown, opts?: RequestOptions<T>): Promise<T>;
  patch<T>(path: string, body: unknown, opts?: RequestOptions<T>): Promise<T>;
  delete<T>(path: string, opts?: RequestOptions<T>): Promise<T>;
}

export interface HttpClientConfig {
  baseUrl: string;
  storeId?: string;
  authStorage: AuthStorage;
  storefrontMode?: boolean;
  forcedHeaders?: Record<string, string> | (() => Record<string, string>);
  onUnauthorized?: (context: {
    hadAuthorization: boolean;
    authorizationToken: string | null;
    path: string;
  }) => boolean | Promise<boolean>;
  refreshPath?: string | (() => string);
  navigate?: (path: string) => void;
  loginFallbackPath?: string;
}

export interface ServerError {
  message: string;
  error: string;
  statusCode: number;
  validationErrors: Array<{ field: string; error: string }>;
}

export interface HttpRequestErrorDetails {
  code?: string;
  response?: unknown;
  statusCode?: number;
  validationErrors?: ServerError["validationErrors"];
  method?: string;
  url?: string;
  requestId?: string;
  aborted?: boolean;
}
