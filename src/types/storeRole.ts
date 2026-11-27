import type { EpochMilliseconds } from "./time";
import type { EmailContact, SortDirection } from "./common";
import type { AccountName, AccountSortField } from "./account";
import type { StoreType } from "./store";
import type { CreateStoreAgreementInput } from "./network";
import type {
  CustomerPermissionType,
  CustomerRolePermission,
  StorePermissionType,
  StoreRolePermission,
} from "./permission";

export interface StoreRole {
  id: string;
  store_id: string;
  key: string;
  permissions: StoreRolePermission[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CustomerRole {
  id: string;
  store_id: string;
  key: string;
  permissions: CustomerRolePermission[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface StoreRoleAccess {
  role_id: string;
  permissions: StorePermissionType[];
}

export type WithheldStorePermission =
  | { type: "second_factor_off"; role_id: string; permission: StorePermissionType }
  | { type: "account_token"; role_id: string; permission: StorePermissionType };

export interface StoreAccess {
  owner: boolean;
  roles: StoreRoleAccess[];
  withheld: WithheldStorePermission[];
}

export type StoreMembershipStatus =
  | { type: "invited"; contact: EmailContact }
  | { type: "owner_invited"; contact: EmailContact }
  | { type: "active"; account_id: string }
  | { type: "disabled"; account_id: string };

export type StoreMembershipEditableStatus = { type: "active" } | { type: "disabled" };

export interface StoreMembership {
  id: string;
  store_id: string;
  role_ids: string[];
  status: StoreMembershipStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface StoreAssistantMembership {
  id: string;
  store_id: string;
  assistant_id: string;
  role_ids: string[];
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
  permissions: StorePermissionType[];
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
  permissions: StorePermissionType[];
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

export interface GetCustomerRoleParams {
  store_id: string;
}

export interface CreateCustomerRoleParams {
  store_id: string;
  id: string;
  key: string;
  permissions: CustomerPermissionType[];
}

export interface UpdateCustomerRoleParams {
  store_id: string;
  expected_updated_at: EpochMilliseconds;
  key: string;
  permissions: CustomerPermissionType[];
}

export interface DeleteCustomerRoleParams {
  store_id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindStoreAssistantMembershipsParams {
  store_id: string;
  assistant_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetStoreAssistantMembershipParams {
  store_id: string;
  id: string;
}

export interface CreateStoreAssistantMembershipParams {
  store_id: string;
  id: string;
  assistant_id: string;
  role_ids: string[];
}

export interface UpdateStoreAssistantMembershipParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  role_ids: string[];
}

export interface DeleteStoreAssistantMembershipParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
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

export interface ChangeStoreMemberStatusParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  status: StoreMembershipEditableStatus;
}

export interface AcceptStoreInviteParams {
  store_id: string;
  expected_updated_at: EpochMilliseconds;
  agreement?: CreateStoreAgreementInput;
}

export type StoreMemberSearchStatus = "active" | "disabled" | "invited";

export interface FindStoreMembersParams {
  store_id: string;
  query?: string;
  role_id?: string;
  status?: StoreMemberSearchStatus;
  account_id?: string;
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
