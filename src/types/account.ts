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
      email: string;
      failed_attempts: number;
      verification_expires_at: EpochMilliseconds;
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

export interface AccountSession {
  id: string;
  status: AccountSessionStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type AccountSortField = "email";

export interface SearchAccountsParams {
  query?: string;
  sort_field?: AccountSortField;
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
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
