import type { ServerError } from "./httpClient";

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

export class ArkyApiError extends Error {
  readonly name: string = "ApiError";
  readonly code: string;
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
    super(details.message);
    this.code = details.code;
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
