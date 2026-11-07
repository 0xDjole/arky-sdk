import type { EpochMilliseconds } from "./time";
import type { SortDirection } from "./common";
import type { StorePermission } from "./storeRole";

export type AccountStatus = { type: "active" } | { type: "deleting" };

export interface Account {
  id: string;
  email: string;
  status: AccountStatus;
  test_stores: number;
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
  | { type: "only"; store_ids: string[] }
  | { type: "test_stores" };

export type AccountTokenStatus = { type: "active" } | { type: "revoked"; revoked_at: EpochMilliseconds };

export interface AccountToken {
  id: string;
  account_id: string;
  name: string;
  token_hint: string;
  stores: AccountTokenStores;
  permissions: StorePermission[];
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
  permissions: StorePermission[];
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
