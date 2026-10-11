import type { EpochMilliseconds } from "./time";
import type { SortDirection } from "./common";

export type AccountStatus = { type: "active" } | { type: "deleting" };

export interface Account {
  id: string;
  email: string;
  status: AccountStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface PlatformAdministrator {
  id: string;
  account_id: string;
  email: string;
  created_at: EpochMilliseconds;
}

export type AccountSessionStatus =
  | {
      type: "pending_verification";
      failed_attempts: number;
      verification_expires_at: EpochMilliseconds;
    }
  | {
      type: "active";
      access_expires_at: EpochMilliseconds;
      refresh_expires_at: EpochMilliseconds;
      authenticated_at: EpochMilliseconds;
    }
  | { type: "locked" }
  | { type: "superseded" }
  | { type: "revoked" };

export interface AccountSession {
  id: string;
  account_id: string;
  status: AccountSessionStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type AccountApiTokenStatus =
  | { type: "active" }
  | { type: "revoked"; revoked_at: EpochMilliseconds };

export interface AccountApiToken {
  id: string;
  account_id: string;
  token_hint: string;
  name: string;
  status: AccountApiTokenStatus;
  expires_at: EpochMilliseconds | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type AccountApiTokenCreated =
  | { type: "created"; token: AccountApiToken; value: string }
  | { type: "existing"; token: AccountApiToken };

export type AccountSortField = "email";

export interface SearchAccountsParams {
  query?: string;
  sort_field?: AccountSortField;
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface ListAccountApiTokensParams {
  limit?: number;
  cursor?: string | null;
}

export interface CreateAccountApiTokenParams {
  id: string;
  name: string;
  expires_at: EpochMilliseconds | null;
}

export interface UpdateAccountApiTokenParams {
  id: string;
  name: string;
}

export interface RevokeAccountApiTokenParams {
  id: string;
}

export interface ListAccountSessionsParams {
  limit?: number;
  cursor?: string | null;
}

export interface RevokeAccountSessionParams {
  id: string;
}

export interface FindPlatformAdministratorsParams {
  cursor?: string | null;
}

export interface AddPlatformAdministratorParams {
  id: string;
  account_id: string;
}

export interface RemovePlatformAdministratorParams {
  id: string;
}
