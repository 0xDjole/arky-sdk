import type { EpochMilliseconds } from "./time";
import type { QueryParams } from "../utils/queryParams";

export interface TokenSet {
  id?: string;
  access_token: string;
  refresh_token?: string;
  access_expires_at?: EpochMilliseconds;
}

export interface AuthStorage {
  getTokens(): TokenSet | null;
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
  order_token?: string | null;
  locale?: string;
  market?: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  onSuccess?: (ctx: RequestSuccessContext<T>) => void | Promise<void>;
  onError?: (ctx: RequestErrorContext) => void | Promise<void>;
}

export type TransportOptions<T = unknown> = RequestOptions<T> & { params?: QueryParams };

export type RequestContextOverride = Pick<RequestOptions, "locale" | "market">;

export interface HttpClient {
  get<T>(path: string, opts?: TransportOptions<T>): Promise<T>;
  post<T>(path: string, body: unknown, opts?: TransportOptions<T>): Promise<T>;
  put<T>(path: string, body: unknown, opts?: TransportOptions<T>): Promise<T>;
  patch<T>(path: string, body: unknown, opts?: TransportOptions<T>): Promise<T>;
  delete<T>(path: string, opts?: TransportOptions<T> & { body?: unknown }): Promise<T>;
}

export interface HttpClientConfig {
  baseUrl: string;
  authStorage: AuthStorage;
  storefrontMode?: boolean;
  forcedHeaders?: Record<string, string> | ((context: RequestContextOverride) => Record<string, string>);
  onUnauthorized?: (context: {
    hadAuthorization: boolean;
    authorizationToken: string | null;
    path: string;
    response: { status: number; data: unknown };
  }) => boolean | Promise<boolean>;
  refreshCredentials?: (expected: TokenSet | null) => Promise<void>;
}

export interface ServerError {
  message: string;
  error: string;
  statusCode: number;
  validationErrors: Array<{ field: string; error: string }>;
}
