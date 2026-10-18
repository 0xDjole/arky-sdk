import { epochMilliseconds, epochMillisecondsNow } from "../utils/time";
import { buildQueryString, type QueryParams } from "../utils/queryParams";
import { ArkyApiError, ArkyNetworkError } from "../types/apiError";

import type { TokenSet, HttpClient, HttpClientConfig, ServerError, TransportOptions } from "../types/httpClient";
export type { TokenSet, AuthStorage, RequestSuccessContext, RequestErrorContext, RequestOptions, HttpClient, HttpClientConfig } from "../types/httpClient";

function sessionEnded(message: string): ArkyApiError {
  return new ArkyApiError({ message, code: "GENERAL.UNAUTHENTICATED", statusCode: 401 });
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
  const validationErrors = Array.isArray(payload.validation_errors)
    ? payload.validation_errors.filter(isValidationError)
    : [];

  return {
    message:
      typeof payload.message === "string" ? payload.message : "Request failed",
    error: typeof payload.error === "string" ? payload.error : "REQUEST_FAILED",
    statusCode:
      typeof payload.status_code === "number" ? payload.status_code : statusCode,
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

  async function refreshedTokens(expected: TokenSet): Promise<TokenSet | null> {
    if (!cfg.refreshCredentials) return expected;
    await cfg.refreshCredentials(expected);
    const refreshed = authStorage.getTokens();
    if (expected.id && refreshed?.id !== expected.id) {
      throw sessionEnded("The Account session changed");
    }
    return refreshed;
  }

  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: TransportOptions<T> & { body?: unknown },
    retried = false,
  ): Promise<T> {
    if (!cfg.storefrontMode && (options?.locale !== undefined || options?.market !== undefined)) {
      throw new TypeError("A per-call locale or market is a storefront request option");
    }

    if (cfg.storefrontMode) {
      body = omitStorefrontRouting(body);
    }

    const forcedHeaders =
      typeof cfg.forcedHeaders === "function"
        ? cfg.forcedHeaders({ locale: options?.locale, market: options?.market })
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

    const multipart = typeof FormData !== "undefined" && body instanceof FormData;
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(multipart ? {} : { "Content-Type": "application/json" }),
      ...callerHeaders,
      ...forcedHeaders,
    };

    let tokens = authStorage.getTokens();
    if (
      tokens?.access_expires_at !== undefined &&
      epochMillisecondsNow() >= epochMilliseconds(tokens.access_expires_at)
    ) {
      tokens = await refreshedTokens(tokens);
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
    if (
      method !== "GET" &&
      body !== undefined &&
      (method !== "DELETE" || options?.body !== undefined)
    ) {
      fetchOptions.body = multipart
        ? (body as FormData)
        : body instanceof URLSearchParams
          ? body.toString()
          : JSON.stringify(body);
    }

    const fullUrl = `${cfg.baseUrl}${finalPath}`;
    let res: Response;
    let data: unknown;
    const startedAt = performance.now();

    try {
      res = await fetch(fullUrl, fetchOptions);
    } catch (error) {
      const aborted =
        options?.signal?.aborted ||
        (error instanceof Error && error.name === "AbortError");
      const err = new ArkyNetworkError(
        aborted ? "aborted" : "network",
        error instanceof Error ? error.message : "Network request failed",
        { method, url: fullUrl },
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
        const authorization = Object.entries(headers).find(([name]) => name.toLowerCase() === "authorization")?.[1];
        const recovered = await cfg.onUnauthorized({
          hadAuthorization: Boolean(authorization),
          authorizationToken: authorization?.replace(/^Bearer\s+/i, "") || null,
          path,
        });
        if (recovered) {
          return request<T>(method, path, body, options, true);
        }
      } else if (cfg.refreshCredentials && tokens) {
        await refreshedTokens(tokens);
        return request<T>(method, path, body, options, true);
      }
    }

    try {
      const contentLength = res.headers.get("content-length");
      const contentType = res.headers.get("content-type");
      if (res.status === 204) {
        data = undefined;
      } else if (
        contentLength === "0" ||
        !contentType?.includes("application/json")
      ) {
        data = {};
      } else {
        data = await res.json();
      }
    } catch (error) {
      const err = new ArkyNetworkError("unreadable_answer", "Failed to parse response", {
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
      const err = new ArkyApiError({
        message: serverErr.message,
        code: serverErr.error,
        response: data,
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
            duration_ms: performance.now() - startedAt,
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
          duration_ms: performance.now() - startedAt,
        }),
      ).catch(() => {});
    }
    return data as T;
  }

  return {
    get: <T>(path: string, opts?: TransportOptions<T>) =>
      request<T>("GET", path, undefined, opts),
    post: <T>(path: string, body: unknown, opts?: TransportOptions<T>) =>
      request<T>("POST", path, body, opts),
    put: <T>(path: string, body: unknown, opts?: TransportOptions<T>) =>
      request<T>("PUT", path, body, opts),
    patch: <T>(path: string, body: unknown, opts?: TransportOptions<T>) =>
      request<T>("PATCH", path, body, opts),
    delete: <T>(path: string, opts?: TransportOptions<T> & { body?: unknown }) =>
      request<T>("DELETE", path, opts?.body, opts),
  };
}
