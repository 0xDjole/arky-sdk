import type { EpochMilliseconds } from "./time";

export type CompanyPermission =
  | "admin"
  | "place_orders"
  | "create_subscriptions"
  | "access_digital_products"
  | "view_own_orders"
  | "view_company_orders"
  | "view_own_subscriptions"
  | "view_company_subscriptions"
  | "manage_company"
  | "manage_addresses"
  | "manage_members"
  | "manage_company_subscriptions"
  | "manage_payment_methods";
export type CompanyRoleStatus = { type: "active" } | { type: "deleting" };

export interface CompanyRole {
  id: string;
  store_id: string;
  key: string;
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
  store_id: string;
  key: string;
  permissions: CompanyPermission[];
}

export interface GetCompanyRoleParams {
  store_id: string;
  id: string;
  company_id?: string;
}

export interface UpdateCompanyRoleParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  permissions: CompanyPermission[];
}

export interface DeleteCompanyRoleParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindCompanyRolesParams {
  store_id: string;
  limit?: number;
  cursor?: string;
  company_id?: string;
  key?: string;
}
