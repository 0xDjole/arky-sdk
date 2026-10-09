import type { EpochMilliseconds } from "./time";
import type { SortDirection } from "./common";
import type { Account, AccountSortField } from "./account";

export type LocationReach =
  | { type: "everywhere" }
  | { type: "only"; store_location_ids: string[] };

export type StorePermission =
  | { type: "admin" }
  | { type: "catalog" }
  | { type: "orders" }
  | { type: "customers" }
  | { type: "fulfillment"; locations: LocationReach }
  | { type: "inventory"; locations: LocationReach }
  | { type: "marketing" }
  | { type: "content" }
  | { type: "support" }
  | { type: "email" }
  | { type: "analytics" };

export type StorePermissionType = StorePermission["type"];

export interface StoreRole {
  id: string;
  store_id: string;
  key: string;
  permissions: StorePermission[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface StoreAccess {
  permissions: StorePermission[];
}

export type StoreMembershipStatus =
  | { type: "invited" }
  | { type: "active" }
  | { type: "disabled" };

export interface StoreMembership {
  id: string;
  store_id: string;
  account_id: string;
  role_ids: string[];
  status: StoreMembershipStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface StoreMembershipWithStoreName extends StoreMembership {
  store_name: string;
  access: StoreAccess;
}

export interface StoreMember {
  account: Account;
  membership: StoreMembership;
}

export interface CreateStoreRoleParams {
  store_id: string;
  id: string;
  key: string;
  permissions: StorePermission[];
}

export interface GetStoreRoleParams {
  store_id: string;
  id: string;
}

export interface UpdateStoreRoleParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key: string;
  permissions: StorePermission[];
}

export interface DeleteStoreRoleParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindStoreRolesParams {
  store_id: string;
  limit?: number;
  cursor?: string | null;
}

export interface AddStoreMemberParams {
  store_id: string;
  email: string;
  role_ids: string[];
}

export interface InviteStoreMemberParams {
  store_id: string;
  email: string;
  role_ids: string[];
}

export interface RemoveStoreMemberParams {
  store_id: string;
  account_id: string;
}

export interface UpdateStoreMemberRolesParams {
  store_id: string;
  account_id: string;
  expected_updated_at: EpochMilliseconds;
  role_ids: string[];
}

export interface ChangeStoreMemberStatusParams {
  store_id: string;
  account_id: string;
  expected_updated_at: EpochMilliseconds;
  status: StoreMembershipStatus;
}

export interface TransferStoreOwnershipParams {
  store_id: string;
  account_id: string;
}

export interface FindStoreMembersParams {
  store_id: string;
  query?: string;
  sort_field?: AccountSortField;
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface FindOwnStoreMembershipsParams {
  limit?: number;
  cursor?: string | null;
}

export interface GetOwnStoreMembershipParams {
  store_id: string;
}
