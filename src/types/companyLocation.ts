import type { EpochMilliseconds } from "./time";
import type { CompanyAddress } from "./company";

export type CompanyLocationEditableStatus =
  { type: "active" } | { type: "archived" };
export type CompanyLocationStatus =
  CompanyLocationEditableStatus | { type: "deleting" };

export interface CompanyLocation {
  id: string;
  store_id: string;
  company_id: string;
  name: string;
  shipping_address: CompanyAddress;
  billing_address: CompanyAddress | null;
  status: CompanyLocationStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CreateCompanyLocationParams {
  store_id?: string;
  company_id: string;
  name: string;
  shipping_address: CompanyAddress;
  billing_address?: CompanyAddress | null;
  status: CompanyLocationEditableStatus;
}

export interface GetCompanyLocationParams {
  store_id?: string;
  id: string;
}

export interface UpdateCompanyLocationParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  name: string;
  shipping_address: CompanyAddress;
  billing_address: CompanyAddress | null;
  status: CompanyLocationEditableStatus;
}

export interface DeleteCompanyLocationParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindCompanyLocationsParams {
  store_id?: string;
  limit?: number;
  cursor?: string;
  company_id?: string;
}
