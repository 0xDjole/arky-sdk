import type { EpochMilliseconds } from "./time";
import type { Block } from "./block";
import type { PostalAddress, PostalAddressInput, SortDirection } from "./common";

export type CompanyStatus =
  | { type: "active" }
  | { type: "archived" }
  | { type: "deleting" };

export type CompanyEditableStatus = Exclude<CompanyStatus, { type: "deleting" }>;

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

export type PaymentTerms =
  | { type: "due_on_receipt" }
  | { type: "net_days"; days: number };

export type CompanyPaymentPolicy =
  | { type: "standard_checkout"; billing_address: PostalAddress | null }
  | { type: "on_account"; terms: PaymentTerms; billing_address: PostalAddress };

export interface CompanyPurchasingPolicy {
  payment: CompanyPaymentPolicy;
  allowed_payment_option_ids: string[];
  purchase_order_number_required: boolean;
}

export interface Company {
  id: string;
  store_id: string;
  name: string;
  contact_email: string;
  tax_registrations: TaxRegistration[];
  purchasing: CompanyPurchasingPolicy;
  blocks: Block[];
  status: CompanyStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type CompanyLocationFulfillment =
  | { type: "routing" }
  | { type: "served_from"; store_location_id: string };

export type CompanyLocationStatus =
  | { type: "active" }
  | { type: "archived" }
  | { type: "deleting" };

export type CompanyLocationEditableStatus = Exclude<CompanyLocationStatus, { type: "deleting" }>;

export interface CompanyLocation {
  id: string;
  store_id: string;
  company_id: string;
  name: string;
  shipping_address: PostalAddress | null;
  tax_registrations: TaxRegistration[];
  purchasing: CompanyPurchasingPolicy;
  fulfillment: CompanyLocationFulfillment;
  status: CompanyLocationStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type CompanyPermission =
  | "admin"
  | "place_orders"
  | "join_customer_groups"
  | "access_digital_products"
  | "view_own_orders"
  | "view_company_orders"
  | "view_own_customer_groups"
  | "view_company_customer_groups"
  | "manage_company"
  | "manage_addresses"
  | "manage_members"
  | "manage_company_customer_groups"
  | "manage_payment_methods";

export interface CompanyRole {
  id: string;
  store_id: string;
  key: string;
  permissions: CompanyPermission[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type CompanyMembershipScope =
  | { type: "company" }
  | { type: "all_locations" }
  | { type: "company_location"; company_location_id: string };

export interface CompanyMembershipGrant {
  scope: CompanyMembershipScope;
  role_ids: string[];
}

export type CompanyMembershipStatus = { type: "active" } | { type: "disabled" };

export interface CompanyMembership {
  id: string;
  store_id: string;
  company_id: string;
  customer_id: string;
  grants: CompanyMembershipGrant[];
  status: CompanyMembershipStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CompanyAccessGrant {
  scope: CompanyMembershipScope;
  permissions: CompanyPermission[];
}

export interface CompanyCustomerAccess {
  company: Company;
  grants: CompanyAccessGrant[];
}

export interface CreateCompanyParams {
  store_id: string;
  id: string;
  name: string;
  contact_email: string;
  billing_address?: PostalAddressInput | null;
  blocks: Block[];
  status: CompanyEditableStatus;
}

export interface GetCompanyParams {
  store_id: string;
  id: string;
}

export interface UpdateCompanyParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  name: string;
  contact_email: string;
  billing_address: PostalAddressInput | null;
  blocks: Block[];
  status: CompanyEditableStatus;
}

export interface DeleteCompanyParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindCompaniesParams {
  store_id: string;
  query?: string;
  status?: CompanyStatus["type"];
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface CreateCompanyLocationParams {
  store_id: string;
  id: string;
  company_id: string;
  name: string;
  shipping_address: PostalAddressInput | null;
  billing_address: PostalAddressInput | null;
  status: CompanyLocationEditableStatus;
}

export interface GetCompanyLocationParams {
  store_id: string;
  id: string;
}

export interface UpdateCompanyLocationParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  name: string;
  shipping_address: PostalAddressInput | null;
  billing_address: PostalAddressInput | null;
  status: CompanyLocationEditableStatus;
}

export interface CompanyTaxRegistrationInput {
  country: string;
  region: string | null;
  identifier: string;
}

export type CompanyTaxRegistrationReview =
  | { type: "verified" }
  | { type: "rejected"; reason: string | null }
  | { type: "remove" };

export interface SubmitCompanyTaxRegistrationParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  registration: CompanyTaxRegistrationInput;
}

export interface ReviewCompanyTaxRegistrationParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  registration: CompanyTaxRegistrationInput;
  review: CompanyTaxRegistrationReview;
}

export interface SetCompanyPurchasingParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  purchasing: CompanyPurchasingPolicy;
}

export interface SetCompanyLocationFulfillmentParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  fulfillment: CompanyLocationFulfillment;
}

export interface DeleteCompanyLocationParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindCompanyLocationsParams {
  store_id: string;
  company_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface StorefrontFindCompanyLocationsParams {
  company_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface CreateCompanyRoleParams {
  store_id: string;
  id: string;
  key: string;
  permissions: CompanyPermission[];
}

export interface GetCompanyRoleParams {
  store_id: string;
  id: string;
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
  key?: string;
  limit?: number;
  cursor?: string | null;
}

export interface CreateCompanyMembershipParams {
  store_id: string;
  id: string;
  company_id: string;
  customer_id: string;
  grants: CompanyMembershipGrant[];
}

export interface GetCompanyMembershipParams {
  store_id: string;
  id: string;
}

export interface UpdateCompanyMembershipParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  grants: CompanyMembershipGrant[];
  status: CompanyMembershipStatus;
}

export interface DeleteCompanyMembershipParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindCompanyMembershipsParams {
  store_id: string;
  company_id?: string;
  customer_id?: string;
  role_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface StorefrontFindCompanyMembershipsParams {
  limit?: number;
  cursor?: string | null;
}
