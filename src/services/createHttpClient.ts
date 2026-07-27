import { buildQueryString, type QueryParams } from "../utils/queryParams";

export interface TokenSet {
  access_token: string;
  refresh_token?: string;
  access_expires_at?: number;
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

export interface ScheduledMutationOptions<T = unknown>
  extends RequestOptions<T> {
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

interface ServerError {
  message: string;
  error: string;
  statusCode: number;
  validationErrors: Array<{ field: string; error: string }>;
}

interface HttpRequestErrorDetails {
  statusCode?: number;
  validationErrors?: ServerError["validationErrors"];
  method?: string;
  url?: string;
  requestId?: string;
  aborted?: boolean;
}

function requestError(
  name: "ApiError" | "NetworkError" | "ParseError" | "AbortError",
  message: string,
  details: HttpRequestErrorDetails = {},
): Error & HttpRequestErrorDetails {
  return Object.assign(new Error(message), { name }, details);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function omitStorefrontRouting(value: unknown): unknown {
  if (!isRecord(value) || Array.isArray(value)) return value;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return value;
  const result = { ...value };
  delete result.store_id;
  delete result.market;
  return result;
}

function isTokenSet(value: unknown): value is TokenSet {
  return (
    isRecord(value) &&
    typeof value.access_token === "string" &&
    (value.refresh_token === undefined ||
      typeof value.refresh_token === "string") &&
    (value.access_expires_at === undefined ||
      typeof value.access_expires_at === "number")
  );
}

function isValidationError(
  value: unknown,
): value is ServerError["validationErrors"][number] {
  return (
    isRecord(value) &&
    typeof value.field === "string" &&
    typeof value.error === "string"
  );
}

function toServerError(value: unknown, statusCode: number): ServerError {
  const payload = isRecord(value) ? value : {};
  const validationErrors = Array.isArray(payload.validationErrors)
    ? payload.validationErrors.filter(isValidationError)
    : [];

  return {
    message:
      typeof payload.message === "string" ? payload.message : "Request failed",
    error: typeof payload.error === "string" ? payload.error : "REQUEST_FAILED",
    statusCode:
      typeof payload.statusCode === "number" ? payload.statusCode : statusCode,
    validationErrors,
  };
}

function normalizeValidationErrors(
  validationErrors: ServerError["validationErrors"],
): ServerError["validationErrors"] {
  return validationErrors.map((validationError) => ({
    field: validationError.field,
    error: validationError.error || "GENERAL.VALIDATION_ERROR",
  }));
}

export function createHttpClient(cfg: HttpClientConfig): HttpClient {
  const { authStorage } = cfg;
  let refreshPromise: Promise<void> | null = null;

  function getRefreshEndpoint() {
    const refreshPath =
      typeof cfg.refreshPath === "function"
        ? cfg.refreshPath()
        : cfg.refreshPath || "/v1/auth/refresh";
    return `${cfg.baseUrl}${refreshPath}`;
  }

  async function ensureFreshToken() {
    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = (async () => {
      const tokens = authStorage.getTokens();
      const refresh_token = tokens?.refresh_token;
      if (!refresh_token) {
        authStorage.onForcedLogout();
        throw requestError("ApiError", "No refresh token available", {
          statusCode: 401,
        });
      }

      const refRes = await fetch(getRefreshEndpoint(), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token }),
      });

      if (!refRes.ok) {
        authStorage.onForcedLogout();
        throw requestError("ApiError", "Token refresh failed", {
          statusCode: 401,
        });
      }

      const data: unknown = await refRes.json();
      if (!isTokenSet(data)) {
        authStorage.onForcedLogout();
        throw requestError(
          "ParseError",
          "Token refresh returned an invalid response",
          { statusCode: refRes.status },
        );
      }
      authStorage.onTokensRefreshed(data);
    })().finally(() => {
      refreshPromise = null;
    });

    return refreshPromise;
  }

  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: RequestOptions<T>,
    retried = false,
  ): Promise<T> {
    if (!retried && options?.transformRequest) {
      body = options.transformRequest(body);
    }

    if (cfg.storefrontMode) {
      body = omitStorefrontRouting(body);
    }

    const forcedHeaders =
      typeof cfg.forcedHeaders === "function"
        ? cfg.forcedHeaders()
        : cfg.forcedHeaders || {};
    const callerHeaders = { ...(options?.headers || {}) };
    const protectedHeaderNames = new Set(
      Object.keys(forcedHeaders).map((name) => name.toLowerCase()),
    );
    if (cfg.storefrontMode) protectedHeaderNames.add("authorization");
    for (const name of Object.keys(callerHeaders)) {
      if (protectedHeaderNames.has(name.toLowerCase())) {
        delete callerHeaders[name];
      }
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...callerHeaders,
      ...forcedHeaders,
    };

    let tokens = authStorage.getTokens();
    const nowSec = Date.now() / 1000;
    if (tokens?.access_expires_at && nowSec > tokens.access_expires_at) {
      await ensureFreshToken();
      tokens = authStorage.getTokens();
    }

    if (tokens?.access_token) {
      headers["Authorization"] = `Bearer ${tokens.access_token}`;
    }

    const requestParams = cfg.storefrontMode
      ? (omitStorefrontRouting(options?.params) as QueryParams | undefined)
      : options?.params;
    const finalPath = requestParams
      ? path + buildQueryString(requestParams)
      : path;

    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: options?.signal,
    };
    if (!["GET", "DELETE"].includes(method) && body !== undefined) {
      fetchOptions.body =
        body instanceof URLSearchParams
          ? body.toString()
          : JSON.stringify(body);
    }

    const fullUrl = `${cfg.baseUrl}${finalPath}`;
    let res: Response;
    let data: unknown;
    const startedAt = Date.now();

    try {
      res = await fetch(fullUrl, fetchOptions);
    } catch (error) {
      const aborted =
        options?.signal?.aborted ||
        (error instanceof Error && error.name === "AbortError");
      const err = requestError(
        aborted ? "AbortError" : "NetworkError",
        error instanceof Error ? error.message : "Network request failed",
        { method, url: fullUrl, aborted },
      );
      if (options?.onError && method !== "GET") {
        Promise.resolve(
          options.onError({ error: err, method, url: fullUrl, aborted }),
        ).catch(() => {});
      }
      throw err;
    }

    if (res.status === 401 && !retried) {
      if (cfg.onUnauthorized) {
        const recovered = await cfg.onUnauthorized({
          hadAuthorization: Boolean(tokens?.access_token),
          authorizationToken: tokens?.access_token || null,
          path,
        });
        if (recovered) {
          return request<T>(method, path, body, options, true);
        }
      } else {
        await ensureFreshToken();
        return request<T>(method, path, body, options, true);
      }
    }

    try {
      const contentLength = res.headers.get("content-length");
      const contentType = res.headers.get("content-type");
      if (
        res.status === 204 ||
        contentLength === "0" ||
        !contentType?.includes("application/json")
      ) {
        data = {};
      } else {
        data = await res.json();
      }
    } catch (error) {
      const err = requestError("ParseError", "Failed to parse response", {
        method,
        url: fullUrl,
        statusCode: res.status,
      });
      if (options?.onError && method !== "GET") {
        Promise.resolve(
          options.onError({
            error: err,
            method,
            url: fullUrl,
            status: res.status,
          }),
        ).catch(() => {});
      }
      throw err;
    }

    if (!res.ok) {
      const serverErr = toServerError(data, res.status);
      const requestId =
        res.headers.get("x-request-id") || res.headers.get("request-id");
      const err = requestError("ApiError", serverErr.message, {
        statusCode: serverErr.statusCode,
        validationErrors: normalizeValidationErrors(serverErr.validationErrors),
        method,
        url: fullUrl,
        requestId: requestId || undefined,
      });
      if (options?.onError && method !== "GET") {
        Promise.resolve(
          options.onError({
            error: err,
            method,
            url: fullUrl,
            status: res.status,
            response: serverErr,
            request_id: requestId || null,
            duration_ms: Date.now() - startedAt,
          }),
        ).catch(() => {});
      }
      throw err;
    }

    if (options?.onSuccess && method !== "GET") {
      const requestId =
        res.headers.get("x-request-id") || res.headers.get("request-id");
      Promise.resolve(
        options.onSuccess({
          data: data as T,
          method,
          url: fullUrl,
          status: res.status,
          request_id: requestId || null,
          duration_ms: Date.now() - startedAt,
        }),
      ).catch(() => {});
    }
    return data as T;
  }

  return {
    get: <T>(path: string, opts?: RequestOptions<T>) =>
      request<T>("GET", path, undefined, opts),
    post: <T>(path: string, body: unknown, opts?: RequestOptions<T>) =>
      request<T>("POST", path, body, opts),
    put: <T>(path: string, body: unknown, opts?: RequestOptions<T>) =>
      request<T>("PUT", path, body, opts),
    patch: <T>(path: string, body: unknown, opts?: RequestOptions<T>) =>
      request<T>("PATCH", path, body, opts),
    delete: <T>(path: string, opts?: RequestOptions<T>) =>
      request<T>("DELETE", path, undefined, opts),
  };
}
