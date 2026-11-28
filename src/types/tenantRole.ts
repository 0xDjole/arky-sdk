import type { EpochMilliseconds } from "./time";
import type { EmailContact, SortDirection } from "./common";
import type { AccountName, AccountSortField } from "./account";
import type { TenantType } from "./tenant";
import type { CreateTenantAgreementInput } from "./network";
import type {
  UserPermissionType,
  UserRolePermission,
  TenantPermissionType,
  TenantRolePermission,
} from "./permission";

export interface TenantRole {
  id: string;
  tenant_id: string;
  key: string;
  permissions: TenantRolePermission[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface UserRole {
  id: string;
  tenant_id: string;
  key: string;
  permissions: UserRolePermission[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface TenantRoleAccess {
  role_id: string;
  permissions: TenantPermissionType[];
}

export type WithheldTenantPermission =
  | { type: "second_factor_off"; role_id: string; permission: TenantPermissionType }
  | { type: "account_token"; role_id: string; permission: TenantPermissionType };

export interface TenantAccess {
  owner: boolean;
  roles: TenantRoleAccess[];
  withheld: WithheldTenantPermission[];
}

export type TenantMembershipStatus =
  | { type: "invited"; contact: EmailContact }
  | { type: "owner_invited"; contact: EmailContact }
  | { type: "active"; account_id: string }
  | { type: "disabled"; account_id: string };

export type TenantMembershipEditableStatus = { type: "active" } | { type: "disabled" };

export interface TenantMembership {
  id: string;
  tenant_id: string;
  role_ids: string[];
  status: TenantMembershipStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface TenantAssistantMembership {
  id: string;
  tenant_id: string;
  assistant_id: string;
  role_ids: string[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface TenantMembershipWithTenantName extends TenantMembership {
  tenant_name: string;
  tenant_type: TenantType;
  access: TenantAccess;
}

export type TenantMemberSecondFactor = "on" | "off" | "hidden";

export interface TenantMemberAccount {
  id: string;
  email: string;
  name: AccountName | null;
  phone: string | null;
  second_factor: TenantMemberSecondFactor;
}

export interface TenantMemberProfile {
  account_id: string;
  name: AccountName | null;
  phone: string | null;
}

export interface FindTenantMemberDirectoryParams {
  tenant_id: string;
  limit?: number;
  cursor?: string | null;
}

export interface FindTenantMemberSessionsParams {
  tenant_id: string;
  id: string;
  limit?: number;
  cursor?: string | null;
}

export interface RevokeTenantMemberSessionParams {
  tenant_id: string;
  id: string;
  session_id: string;
}

export interface TenantMember {
  account: TenantMemberAccount | null;
  membership: TenantMembership;
}

export interface CreateTenantRoleParams {
  tenant_id: string;
  id: string;
  key: string;
  permissions: TenantPermissionType[];
}

export interface GetTenantRoleParams {
  tenant_id: string;
  id: string;
}

export interface UpdateTenantRoleParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key: string;
  permissions: TenantPermissionType[];
}

export interface DeleteTenantRoleParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindTenantRolesParams {
  tenant_id: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetUserRoleParams {
  tenant_id: string;
}

export interface CreateUserRoleParams {
  tenant_id: string;
  id: string;
  key: string;
  permissions: UserPermissionType[];
}

export interface UpdateUserRoleParams {
  tenant_id: string;
  expected_updated_at: EpochMilliseconds;
  key: string;
  permissions: UserPermissionType[];
}

export interface DeleteUserRoleParams {
  tenant_id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindTenantAssistantMembershipsParams {
  tenant_id: string;
  assistant_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetTenantAssistantMembershipParams {
  tenant_id: string;
  id: string;
}

export interface CreateTenantAssistantMembershipParams {
  tenant_id: string;
  id: string;
  assistant_id: string;
  role_ids: string[];
}

export interface UpdateTenantAssistantMembershipParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  role_ids: string[];
}

export interface DeleteTenantAssistantMembershipParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface InviteTenantMemberParams {
  tenant_id: string;
  id: string;
  contact: EmailContact;
  role_ids: string[];
}

export interface ResendTenantInviteParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface RemoveTenantMemberParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface UpdateTenantMemberRolesParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  role_ids: string[];
}

export interface ChangeTenantMemberStatusParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  status: TenantMembershipEditableStatus;
}

export interface AcceptTenantInviteParams {
  tenant_id: string;
  expected_updated_at: EpochMilliseconds;
  agreement?: CreateTenantAgreementInput;
}

export type TenantMemberSearchStatus = "active" | "disabled" | "invited";

export interface FindTenantMembersParams {
  tenant_id: string;
  query?: string;
  role_id?: string;
  status?: TenantMemberSearchStatus;
  account_id?: string;
  sort_field?: AccountSortField;
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface FindOwnTenantMembershipsParams {
  limit?: number;
  cursor?: string | null;
}

export interface GetOwnTenantMembershipParams {
  tenant_id: string;
}
