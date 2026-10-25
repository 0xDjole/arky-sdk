import type { EpochMilliseconds } from "./time";

export type { RequestOptions } from "./httpClient";

export type RequestPendingAccountSessionParams =
  | { session_id: string; email: string; store_id?: undefined }
  | { session_id: string; email: string; store_id: string; language: string };

export interface VerifyPendingAccountSessionParams {
  session_id: string;
  code: string;
  store_id?: string;
}

export interface RefreshAccountSessionParams {
  refresh_token: string;
}

export interface PendingAccountSession {
  session_id: string;
  verification_expires_at: EpochMilliseconds;
}

export interface AuthToken {
  id: string;
  access_token: string;
  refresh_token: string;
  access_expires_at: EpochMilliseconds;
  refresh_expires_at: EpochMilliseconds;
  authenticated_at: EpochMilliseconds;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}
