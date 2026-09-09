import type { EpochMilliseconds } from "./time";

export type CompanyPermission =
  | "place_orders"
  | "view_own_orders"
  | "view_company_orders"
  | "manage_company"
  | "manage_addresses"
  | "manage_members"
  | "create_subscriptions"
  | "view_own_subscriptions"
  | "view_company_subscriptions"
  | "manage_company_subscriptions";
export type CompanyRoleStatus = { type: "active" } | { type: "deleting" };

export interface CompanyRole {
  id: string;
  store_id: string;
  key: string;
  name: string;
  is_system: boolean;
  permissions: CompanyPermission[];
  status: CompanyRoleStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CompanyRoleUsage {
  membership_ids: string[];
  more_memberships: boolean;
}

export interface CreateCompanyRoleParams {
  store_id?: string;
  key: string;
  name: string;
  permissions: CompanyPermission[];
}

export interface GetCompanyRoleParams {
  store_id?: string;
  id: string;
  company_id?: string;
}

export interface UpdateCompanyRoleParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  name: string;
  permissions: CompanyPermission[];
}

export interface DeleteCompanyRoleParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindCompanyRolesParams {
  store_id?: string;
  limit?: number;
  cursor?: string;
  company_id?: string;
  key?: string;
}
