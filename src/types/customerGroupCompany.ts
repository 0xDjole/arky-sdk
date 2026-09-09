import type { EpochMilliseconds } from "./time";

export type CustomerGroupCompanyStatus =
  { type: "active" } | { type: "deleting" };

export interface CustomerGroupCompany {
  id: string;
  store_id: string;
  customer_group_id: string;
  company_id: string;
  status: CustomerGroupCompanyStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CreateCustomerGroupCompanyParams {
  store_id?: string;
  customer_group_id: string;
  company_id: string;
}

export interface GetCustomerGroupCompanyParams {
  store_id?: string;
  id: string;
}

export interface DeleteCustomerGroupCompanyParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindCustomerGroupCompaniesParams {
  store_id?: string;
  limit?: number;
  cursor?: string;
  customer_group_id?: string;
  company_id?: string;
}
