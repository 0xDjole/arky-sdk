import type { EpochMilliseconds } from "../types/time";
import type { AuthStorage, HttpClient } from "./createHttpClient";

export interface ApiConfig {
  httpClient: HttpClient;
  storeId: string;
  baseUrl: string;
  market: string;
  locale: string;
  authStorage: AuthStorage;
}

export interface StorefrontApiConfig {
  httpClient: HttpClient;
  publishableKeyHttpClient: HttpClient;
  apiUrl: string;
  publishableKey: string;
  market: string;
  locale: string;
  authStorage: AuthStorage;
}

export interface AdminSessionInternal {
  access_token: string;
  refresh_token: string;
  access_expires_at?: EpochMilliseconds;
  email?: string;
}

export type AdminSessionUpdater = (
  updater: (prev: AdminSessionInternal | null) => AdminSessionInternal | null,
) => void;
