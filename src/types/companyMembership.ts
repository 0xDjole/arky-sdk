import type { EpochMilliseconds } from "./time";

export type CompanyMembershipEditableStatus =
  { type: "active" } | { type: "disabled" };
export type CompanyMembershipStatus =
  CompanyMembershipEditableStatus | { type: "deleting" };

export interface CompanyMembership {
  id: string;
  store_id: string;
  company_id: string;
  customer_id: string;
  role_ids: string[];
  status: CompanyMembershipStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CreateCompanyMembershipParams {
  store_id?: string;
  company_id: string;
  customer_id: string;
  role_ids: string[];
}

export interface GetCompanyMembershipParams {
  store_id?: string;
  id: string;
}

export interface UpdateCompanyMembershipParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  role_ids: string[];
  status: CompanyMembershipEditableStatus;
}

export interface DeleteCompanyMembershipParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindCompanyMembershipsParams {
  store_id?: string;
  limit?: number;
  cursor?: string;
  company_id?: string;
  customer_id?: string;
  role_id?: string;
}
