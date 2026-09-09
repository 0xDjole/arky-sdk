import type { EpochMilliseconds } from "./time";

export interface CompanyAddress {
  name: string | null;
  company: string | null;
  street1: string | null;
  street2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
}
export interface CompanyProfile {
  legal_name: string | null;
  registration_number: string | null;
  tax_number: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  registered_address: CompanyAddress | null;
}
export type CompanyEditableStatus = { type: "active" } | { type: "archived" };
export type CompanyStatus = CompanyEditableStatus | { type: "deleting" };

export interface Company {
  id: string;
  store_id: string;
  name: string;
  profile: CompanyProfile;
  status: CompanyStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CompanyUsage {
  catalog_entitlement_ids: string[];
  more_catalog_entitlements: boolean;
  cart_ids: string[];
  more_carts: boolean;
  membership_ids: string[];
  more_memberships: boolean;
  location_ids: string[];
  more_locations: boolean;
  group_edge_ids: string[];
  more_group_edges: boolean;
}

export interface CreateCompanyParams {
  store_id?: string;
  name: string;
  profile: CompanyProfile;
  status: CompanyEditableStatus;
}

export interface GetCompanyParams {
  store_id?: string;
  id: string;
}

export interface UpdateCompanyParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  name: string;
  profile: CompanyProfile;
  status: CompanyEditableStatus;
}

export interface DeleteCompanyParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindCompaniesParams {
  store_id?: string;
  limit?: number;
  cursor?: string;
}
