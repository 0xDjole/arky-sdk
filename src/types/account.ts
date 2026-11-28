import type { EpochMilliseconds } from "./time";
import type { SortDirection } from "./common";

export type AccountStatus = { type: "active" } | { type: "deleting" };

export interface AccountName {
  first_name: string;
  last_name: string;
}

export type AccountSecondFactor =
  | { type: "off" }
  | { type: "totp"; since: EpochMilliseconds; recovery_codes_left: number };

export type LoginAddress =
  | { type: "email"; email: string }
  | { type: "phone"; number: string };

export type LoginContact =
  | { type: "email"; email: string; language: string }
  | { type: "phone"; number: string; language: string };

export interface LoginCodeSent {
  code_expires_at: EpochMilliseconds;
}

export type PlatformLogin = { type: "email"; email: string; since: EpochMilliseconds };

export type NetworkLogin =
  | { type: "member_email"; email: string; language: string; since: EpochMilliseconds }
  | { type: "user_email"; email: string; language: string; since: EpochMilliseconds }
  | { type: "user_phone"; number: string; language: string; since: EpochMilliseconds };

export type AccountType =
  | {
      type: "platform";
      logins: PlatformLogin[];
      name: AccountName | null;
      second_factor: AccountSecondFactor;
    }
  | {
      type: "network";
      network_id: string;
      logins: NetworkLogin[];
      name: AccountName | null;
      phone: string | null;
      second_factor: AccountSecondFactor;
    };

export interface Account {
  id: string;
  type: AccountType;
  status: AccountStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface AccountMe {
  id: string;
  type: AccountType;
  status: AccountStatus;
  session_email: string;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type ListedAccountType = { type: "platform" } | { type: "network"; network_id: string };

export interface ListedAccount {
  id: string;
  type: ListedAccountType;
  email: string;
  name: AccountName | null;
  second_factor: AccountSecondFactor;
  status: AccountStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface UpdateAccountProfileParams {
  name?: AccountName | null;
  phone?: string | null;
  expected_updated_at: EpochMilliseconds;
}

export interface RequestAccountLoginCodeParams {
  email: string;
  language: string;
}

export interface VerifyAccountLoginParams {
  email: string;
  code: string;
  confirm_join: boolean;
}

export interface RemoveAccountLoginParams {
  address: LoginAddress;
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
  | { type: "tenant"; tenant_id: string };

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

export type AccountTokenTenants =
  | { type: "all" }
  | { type: "ids"; tenant_ids: string[] };

export type AccountTokenStatus = { type: "active" } | { type: "revoked"; revoked_at: EpochMilliseconds };

export type AccountTokenExpiry = { type: "never" } | { type: "at"; expires_at: EpochMilliseconds };

export interface AccountToken {
  id: string;
  account_id: string;
  email: string;
  name: string;
  token_hint: string;
  tenants: AccountTokenTenants;
  expiry: AccountTokenExpiry;
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
  tenants: AccountTokenTenants;
  expiry: AccountTokenExpiry;
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
