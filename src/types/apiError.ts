import type { ServerError } from "./httpClient";

const arkyErrorBrand = Symbol.for("arky.ArkyError");

export class ArkyError extends Error {
  readonly name: string = "ArkyError";
  readonly code: string;
  readonly [arkyErrorBrand] = true;

  static [Symbol.hasInstance](value: unknown): boolean {
    return value instanceof Error && arkyErrorBrand in value;
  }

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

const apiErrorBrand = Symbol.for("arky.ArkyApiError");

export interface ArkyApiErrorDetails {
  message: string;
  code: string;
  statusCode: number;
  validationErrors?: ServerError["validationErrors"];
  response?: unknown;
  method?: string;
  url?: string;
  requestId?: string;
}

export class ArkyApiError extends ArkyError {
  readonly name: string = "ApiError";
  readonly statusCode: number;
  readonly validationErrors: ServerError["validationErrors"];
  readonly response: unknown;
  readonly method: string | undefined;
  readonly url: string | undefined;
  readonly requestId: string | undefined;
  readonly [apiErrorBrand] = true;

  static [Symbol.hasInstance](value: unknown): boolean {
    return value instanceof Error && apiErrorBrand in value;
  }

  constructor(details: ArkyApiErrorDetails) {
    super(details.code, details.message);
    this.statusCode = details.statusCode;
    this.validationErrors = details.validationErrors ?? [];
    this.response = details.response;
    this.method = details.method;
    this.url = details.url;
    this.requestId = details.requestId;
  }
}

export function isArkyApiError(value: unknown): value is ArkyApiError {
  return value instanceof ArkyApiError;
}

export type ArkyNetworkErrorCode = "network" | "aborted" | "unreadable_answer";

const networkErrorNames: Record<ArkyNetworkErrorCode, string> = {
  network: "NetworkError",
  aborted: "AbortError",
  unreadable_answer: "ParseError",
};

const networkErrorBrand = Symbol.for("arky.ArkyNetworkError");

export interface ArkyNetworkErrorDetails {
  method?: string;
  url?: string;
  statusCode?: number;
}

export class ArkyNetworkError extends ArkyError {
  readonly name: string;
  readonly code: ArkyNetworkErrorCode;
  readonly method: string | undefined;
  readonly url: string | undefined;
  readonly statusCode: number | undefined;
  readonly aborted: boolean;
  readonly [networkErrorBrand] = true;

  static [Symbol.hasInstance](value: unknown): boolean {
    return value instanceof Error && networkErrorBrand in value;
  }

  constructor(code: ArkyNetworkErrorCode, message: string, details: ArkyNetworkErrorDetails = {}) {
    super(code, message);
    this.code = code;
    this.name = networkErrorNames[code];
    this.method = details.method;
    this.url = details.url;
    this.statusCode = details.statusCode;
    this.aborted = code === "aborted";
  }
}

export interface ArkyErrorInfo {
  code: string;
  message: string;
}

export function errorInfo(error: unknown): ArkyErrorInfo {
  const message = error instanceof Error && error.message ? error.message : "The request failed";
  if (error instanceof ArkyError) return { code: error.code, message };
  if (error instanceof TypeError) return { code: "invalid_input", message };
  return { code: "failed", message };
}
