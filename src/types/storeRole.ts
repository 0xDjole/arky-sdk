import type { EpochMilliseconds } from "./time";
import type { EmailContact, SortDirection } from "./common";
import type { AccountName, AccountSortField } from "./account";
import type { StoreType } from "./store";

export type LocationReach =
  | { type: "everywhere" }
  | { type: "only"; store_location_ids: string[] };

export type StorePermissionAccess = "read" | "write";

export type CollectionScope = { type: "all" } | { type: "only"; collection_ids: string[] };

export type FormScope = { type: "all" } | { type: "only"; form_ids: string[] };

export type CustomerScope =
  | { type: "all" }
  | { type: "own" }
  | { type: "own_locations" }
  | { type: "customer"; customer_id: string }
  | { type: "package"; package_id: string }
  | { type: "company"; company_id: string };

export type BookingResourceScope =
  | { type: "all" }
  | { type: "own" }
  | { type: "own_locations" }
  | { type: "only"; booking_resource_ids: string[] };

export type BookingServiceScope = { type: "all" } | { type: "only"; booking_service_ids: string[] };

export type PhoneNumberScope = { type: "all" } | { type: "only"; phone_number_ids: string[] };

export type StorePermission =
  | { type: "admin" }
  | { type: "packages" }
  | { type: "orders"; access: StorePermissionAccess }
  | { type: "payments"; access: StorePermissionAccess }
  | { type: "customers"; customers: CustomerScope; access: StorePermissionAccess }
  | { type: "fulfillment"; locations: LocationReach }
  | { type: "inventory"; locations: LocationReach }
  | { type: "marketing" }
  | { type: "public_collections"; collections: CollectionScope; access: StorePermissionAccess }
  | { type: "private_collections"; collections: CollectionScope; access: StorePermissionAccess }
  | {
      type: "customer_entries";
      collections: CollectionScope;
      customers: CustomerScope;
      access: StorePermissionAccess;
    }
  | {
      type: "private_forms";
      forms: FormScope;
      customers: CustomerScope;
      access: StorePermissionAccess;
    }
  | { type: "bookings"; resources: BookingResourceScope; access: StorePermissionAccess }
  | { type: "booking_resources"; resources: BookingResourceScope; access: StorePermissionAccess }
  | { type: "booking_services"; services: BookingServiceScope; access: StorePermissionAccess }
  | { type: "conversations"; customers: CustomerScope; access: StorePermissionAccess }
  | { type: "support" }
  | { type: "email" }
  | { type: "analytics" }
  | { type: "calls"; phone_numbers: PhoneNumberScope; customers: CustomerScope };

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
  | { type: "invited"; contact: EmailContact }
  | { type: "active"; account_id: string }
  | { type: "disabled"; account_id: string };

export type StoreMembershipEditableStatus = { type: "active" } | { type: "disabled" };

export interface StoreMembership {
  id: string;
  store_id: string;
  role_ids: string[];
  store_location_ids: string[];
  status: StoreMembershipStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface StoreMembershipWithStoreName extends StoreMembership {
  store_name: string;
  store_type: StoreType;
  access: StoreAccess;
}

export type StoreMemberSecondFactor = "on" | "off" | "hidden";

export interface StoreMemberAccount {
  id: string;
  email: string;
  name: AccountName | null;
  phone: string | null;
  second_factor: StoreMemberSecondFactor;
}

export interface StoreMemberProfile {
  account_id: string;
  name: AccountName | null;
  phone: string | null;
}

export interface FindStoreMemberDirectoryParams {
  store_id: string;
  limit?: number;
  cursor?: string | null;
}

export interface FindStoreMemberSessionsParams {
  store_id: string;
  id: string;
  limit?: number;
  cursor?: string | null;
}

export interface RevokeStoreMemberSessionParams {
  store_id: string;
  id: string;
  session_id: string;
}

export interface StoreMember {
  account: StoreMemberAccount | null;
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

export interface InviteStoreMemberParams {
  store_id: string;
  id: string;
  contact: EmailContact;
  role_ids: string[];
}

export interface ResendStoreInviteParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface RemoveStoreMemberParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface UpdateStoreMemberRolesParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  role_ids: string[];
}

export interface UpdateStoreMemberLocationsParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  store_location_ids: string[];
}

export interface ChangeStoreMemberStatusParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  status: StoreMembershipEditableStatus;
}

export interface AcceptStoreInviteParams {
  store_id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface TransferStoreOwnershipParams {
  store_id: string;
  expected_updated_at: EpochMilliseconds;
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
