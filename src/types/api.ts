import type { EpochMilliseconds } from "./time";

export type { AdminRequestOptions, RequestOptions, StorefrontRequestOptions } from "./httpClient";

export type RequestPendingAccountSessionParams =
  | { session_id: string; email: string; network_id: string; store_id?: undefined }
  | { session_id: string; email: string; store_id: string; language: string };

export interface RequestPlatformAccountSessionParams {
  session_id: string;
  email: string;
}

export interface VerifyPlatformAccountSessionParams {
  session_id: string;
  code: string;
}

export type VerifyPendingAccountSessionParams =
  | { session_id: string; code: string; network_id: string; store_id?: undefined }
  | { session_id: string; code: string; store_id: string; network_id?: undefined };

export interface RefreshAccountSessionParams {
  refresh_token: string;
}

export interface PendingAccountSession {
  session_id: string;
  verification_expires_at: EpochMilliseconds;
}

export type VerifySecondFactorParams =
  | { session_id: string; code: string; second_factor_code: string; network_id: string; store_id?: undefined }
  | { session_id: string; code: string; second_factor_code: string; store_id: string; network_id?: undefined };

export type SetUpSecondFactorParams =
  | { session_id: string; code: string; network_id: string; store_id?: undefined }
  | { session_id: string; code: string; store_id: string; network_id?: undefined };

export type ConfirmSecondFactorParams =
  | {
      session_id: string;
      code: string;
      setup_token: string;
      second_factor_code: string;
      network_id: string;
      store_id?: undefined;
    }
  | {
      session_id: string;
      code: string;
      setup_token: string;
      second_factor_code: string;
      store_id: string;
      network_id?: undefined;
    };

export interface VerifyPlatformSecondFactorParams {
  session_id: string;
  code: string;
  second_factor_code: string;
}

export interface SetUpPlatformSecondFactorParams {
  session_id: string;
  code: string;
}

export interface ConfirmPlatformSecondFactorParams {
  session_id: string;
  code: string;
  setup_token: string;
  second_factor_code: string;
}

export interface SecondFactorSignedIn {
  token: AuthToken;
  recovery_codes: string[];
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
