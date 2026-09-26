import type { EpochMilliseconds } from "./time";
import type { CompanyAddress } from "./company";

export type CompanyLocationEditableStatus =
  { type: "active" } | { type: "archived" };
export type CompanyLocationStatus =
  CompanyLocationEditableStatus | { type: "deleting" };

export type TaxRegistrationStatus =
  | { type: "unverified" }
  | { type: "verified"; verified_at: EpochMilliseconds }
  | { type: "rejected"; rejected_at: EpochMilliseconds; reason: string | null };

export interface TaxRegistration {
  country: string;
  region: string | null;
  identifier: string;
  status: TaxRegistrationStatus;
}

export interface TaxExemption {
  code: string;
  country: string | null;
  region: string | null;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
}

export interface CompanyLocationTaxSettings {
  registrations: TaxRegistration[];
  exemptions: TaxExemption[];
}

export interface CompanyLocationCommercePolicy {
  payment_terms_id: string | null;
  allowed_payment_option_ids: string[] | null;
  purchase_order_number_required: boolean;
}

export interface CompanyLocation {
  id: string;
  store_id: string;
  company_id: string;
  name: string;
  shipping_address: CompanyAddress | null;
  billing_address: CompanyAddress | null;
  tax: CompanyLocationTaxSettings;
  commerce: CompanyLocationCommercePolicy;
  status: CompanyLocationStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CreateCompanyLocationParams {
  store_id?: string;
  company_id: string;
  name: string;
  shipping_address?: CompanyAddress | null;
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
  shipping_address: CompanyAddress | null;
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
