import type { EpochMilliseconds } from "./time";
import type { SortDirection } from "./common";

export type AccountAccess = { type: "regular" } | { type: "platform_admin" };

export type AccountStatus = { type: "active" } | { type: "deleting" };

export interface Account {
  id: string;
  email: string;
  status: AccountStatus;
  access: AccountAccess;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
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

export type AccountSessionScope = { type: "arky" } | { type: "store"; store_id: string };

export interface AccountSession {
  id: string;
  scope: AccountSessionScope;
  status: AccountSessionStatus;
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

export interface FindPlatformAdminsParams {
  limit?: number;
  cursor?: string | null;
}

export interface SetAccountAccessParams {
  account_id: string;
  access: AccountAccess;
}
