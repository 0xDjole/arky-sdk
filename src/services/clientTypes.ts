import type { EmailContact } from "../types/common";
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
  appId(label: string): string;
  appOrderToken(): string;
  pendingKey(flow: string, target: string): string;
  locale(options?: { locale?: string }): string;
  verifiedContact(): EmailContact | null;
}

export interface AdminSessionInternal {
  id: string;
  access_token: string;
  refresh_token: string;
  email?: string;
}

export type AdminSessionUpdater = (
  updater: (prev: AdminSessionInternal | null) => AdminSessionInternal | null,
) => void;
