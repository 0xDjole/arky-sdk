import type { EpochMilliseconds } from "./time";
import type { SortDirection } from "./common";

export type AccountAccess = { type: "network"; network_id: string } | { type: "platform" };

export type AccountStatus = { type: "active" } | { type: "deleting" };

export interface AccountName {
  first_name: string;
  last_name: string;
}

export type AccountSecondFactor =
  | { type: "off" }
  | { type: "totp"; since: EpochMilliseconds; recovery_codes_left: number };

export interface Account {
  id: string;
  email: string;
  name: AccountName | null;
  phone: string | null;
  status: AccountStatus;
  access: AccountAccess;
  second_factor: AccountSecondFactor;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface UpdateAccountProfileParams {
  name?: AccountName | null;
  phone?: string | null;
  expected_updated_at: EpochMilliseconds;
}

export interface NewRecoveryCodesParams {
  code: string;
}

export interface RecoveryCodes {
  account: Account;
  recovery_codes: string[];
}

export interface ResetAccountSecondFactorParams {
  account_id: string;
}

export interface SecondFactorSetup {
  secret: string;
  setup_token: string;
  expires_at: EpochMilliseconds;
}

export interface TurnOnSecondFactorParams {
  setup_token: string;
  code: string;
}

export interface SecondFactorTurnedOn {
  account: Account;
  recovery_codes: string[];
}

export interface TurnOffSecondFactorParams {
  code: string;
}

export type AccountSessionStatus =
  | {
      type: "pending_verification";
      email: string;
      failed_attempts: number;
      verification_expires_at: EpochMilliseconds;
    }
  | {
      type: "pending_second_factor";
      account_id: string;
      failed_attempts: number;
      expires_at: EpochMilliseconds;
    }
  | {
      type: "active";
      account_id: string;
      access_expires_at: EpochMilliseconds;
      refresh_expires_at: EpochMilliseconds;
      authenticated_at: EpochMilliseconds;
    }
  | { type: "superseded" }
  | { type: "revoked" };

export type AccountSessionScope =
  | { type: "platform" }
  | { type: "network"; network_id: string }
  | { type: "store"; store_id: string };

export interface AccountSession {
  id: string;
  scope: AccountSessionScope;
  status: AccountSessionStatus;
  user_agent: string | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type AccountSortField = "email";

export interface FindAccountsParams {
  query?: string;
  sort_field?: AccountSortField;
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface FindAccountSessionsParams {
  limit?: number;
  cursor?: string | null;
}

export interface RevokeAccountSessionParams {
  id: string;
}

export type AccountTokenStores =
  | { type: "all" }
  | { type: "only"; store_ids: string[] };

export type AccountTokenStatus = { type: "active" } | { type: "revoked"; revoked_at: EpochMilliseconds };

export interface AccountToken {
  id: string;
  account_id: string;
  name: string;
  token_hint: string;
  stores: AccountTokenStores;
  expires_at: EpochMilliseconds | null;
  status: AccountTokenStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type AccountTokenCreated =
  | { type: "secret_created"; token: AccountToken; value: string }
  | { type: "existing"; token: AccountToken };

export interface CreateAccountTokenParams {
  id: string;
  name: string;
  stores: AccountTokenStores;
  expires_at: EpochMilliseconds | null;
}

export interface FindAccountTokensParams {
  limit?: number;
  cursor?: string | null;
}

export interface RevokeAccountTokenParams {
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface DeleteAccountTokenParams {
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindPlatformAccountsParams {
  limit?: number;
  cursor?: string | null;
}

export interface AddPlatformAccountParams {
  id: string;
  email: string;
}

export interface DeletePlatformAccountParams {
  account_id: string;
}
