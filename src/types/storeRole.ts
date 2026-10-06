import type { EpochMilliseconds } from "./time";

export type StorePermissionType =
  | "admin"
  | "catalog"
  | "orders"
  | "customers"
  | "fulfillment"
  | "inventory"
  | "marketing"
  | "content"
  | "support"
  | "automation"
  | "analytics";

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
  | { type: "automation" }
  | { type: "analytics" };

export type StoreRoleStatus = { type: "active" } | { type: "deleting" };

export interface StoreRole {
  id: string;
  store_id: string;
  key: string;
  permissions: StorePermission[];
  status: StoreRoleStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface StoreAccess {
  permissions: StorePermission[];
}

export interface CreateStoreRoleParams {
  store_id: string;
  key: string;
  permissions: StorePermission[];
}

export interface GetStoreRoleParams {
  store_id: string;
  id: string;
}

export interface UpdateStoreRoleParams extends GetStoreRoleParams {
  expected_updated_at: EpochMilliseconds;
  key: string;
  permissions: StorePermission[];
}

export interface DeleteStoreRoleParams extends GetStoreRoleParams {
  expected_updated_at: EpochMilliseconds;
}

export interface FindStoreRolesParams {
  store_id: string;
  limit?: number;
  cursor?: string | null;
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
  status: { type: "active" } | { type: "disabled" };
}
