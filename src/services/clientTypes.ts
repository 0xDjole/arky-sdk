import type { EpochMilliseconds } from "../types/time";
import type { AuthStorage, HttpClient } from "./createHttpClient";

export interface ApiConfig {
  httpClient: HttpClient;
  baseUrl: string;
  authStorage: AuthStorage;
}

export interface StorefrontApiConfig {
  httpClient: HttpClient;
  publishableKeyHttpClient: HttpClient;
  apiUrl: string;
  publishableKey: string;
  authStorage: AuthStorage;
}

export interface StorefrontFlowContext {
  newId(label: string): string;
  newOrderToken(): string;
  pendingKey(flow: string, target: string): string;
  locale(options?: { locale?: string }): string;
  verifiedEmail(): string | null;
}

export interface AdminSessionInternal {
  id: string;
  access_token: string;
  refresh_token: string;
  access_expires_at: EpochMilliseconds;
  email?: string;
}

export type AdminSessionUpdater = (
  updater: (prev: AdminSessionInternal | null) => AdminSessionInternal | null,
) => void;
