import type { Days, EpochMilliseconds } from "./time";
import type { Block } from "./block";
import type { EmailContact, PostalAddress, PostalAddressInput, SortDirection } from "./common";
import type { CompanyPermissionType, CompanyRolePermission } from "./permission";

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

export type BuyerTax =
  | { type: "standard"; registrations: TaxRegistration[] }
  | { type: "reverse_charge"; registration: TaxRegistration }
  | { type: "exempt"; reason: string; registrations: TaxRegistration[] };

export type StorefrontTaxRegistrationStatus =
  | { type: "unverified" }
  | { type: "verified"; verified_at: EpochMilliseconds }
  | { type: "rejected"; rejected_at: EpochMilliseconds };

export interface StorefrontTaxRegistration {
  country: string;
  region: string | null;
  identifier: string;
  status: StorefrontTaxRegistrationStatus;
}

export type StorefrontBuyerTax =
  | { type: "standard"; registrations: StorefrontTaxRegistration[] }
  | { type: "reverse_charge"; registration: StorefrontTaxRegistration }
  | { type: "exempt"; reason: string; registrations: StorefrontTaxRegistration[] };

export interface SetCompanyTaxParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  tax: BuyerTax;
}

export type PaymentTerms =
  | { type: "due_on_receipt" }
  | { type: "net"; term: Days };

export type CompanyPaymentPolicy =
  | { type: "standard_checkout"; billing_address: PostalAddress | null }
  | { type: "on_account"; terms: PaymentTerms; billing_address: PostalAddress };

export interface CompanyPurchasingPolicy {
  payment: CompanyPaymentPolicy;
  allowed_payment_option_ids: string[];
  purchase_order_number_required: boolean;
}

export interface StorefrontCompany {
  id: string;
  tenant_id: string;
  name: string;
  contact: EmailContact | null;
  tax: StorefrontBuyerTax;
  purchasing: CompanyPurchasingPolicy;
  status: CompanyStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface Company extends StorefrontCompany {
  tax: BuyerTax;
  blocks: Block[];
}

export type CompanyLocationFulfillment =
  | { type: "routing" }
  | { type: "served_from"; tenant_location_id: string };

export type CompanyLocationStatus =
  | { type: "active" }
  | { type: "archived" };

export type CompanyLocationEditableStatus = CompanyLocationStatus;

export interface StorefrontCompanyLocation {
  id: string;
  tenant_id: string;
  company_id: string;
  name: string;
  shipping_address: PostalAddress | null;
  tax: StorefrontBuyerTax;
  purchasing: CompanyPurchasingPolicy;
  fulfillment: CompanyLocationFulfillment;
  status: CompanyLocationStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CompanyLocation extends StorefrontCompanyLocation {
  tax: BuyerTax;
  blocks: Block[];
}

export interface CompanyRole {
  id: string;
  tenant_id: string;
  company_id: string;
  key: string;
  permissions: CompanyRolePermission[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type CompanyMembershipStatus =
  | { type: "invited"; contact: EmailContact }
  | { type: "active"; user_id: string }
  | { type: "disabled"; user_id: string };

export interface CompanyMembership {
  id: string;
  tenant_id: string;
  company_id: string;
  role_ids: string[];
  status: CompanyMembershipStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type StorefrontAccessCompany =
  | ({ type: "company" } & StorefrontCompany)
  | { type: "locations"; id: string; name: string; status: CompanyStatus };

export interface CompanyUserAccess {
  company: StorefrontAccessCompany;
  permissions: CompanyPermissionType[];
}

export interface CreateCompanyParams {
  tenant_id: string;
  id: string;
  name: string;
  contact?: EmailContact | null;
  billing_address?: PostalAddressInput | null;
  blocks: Block[];
  status: CompanyEditableStatus;
}

export interface GetCompanyParams {
  tenant_id: string;
  id: string;
}

export interface UpdateCompanyParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  name: string;
  contact: EmailContact | null;
  billing_address: PostalAddressInput | null;
  blocks: Block[];
  status: CompanyEditableStatus;
}

export interface DeleteCompanyParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindCompaniesBySearchParams {
  tenant_id: string;
  ids?: never;
  tax_registration_country?: never;
  tax_registration_identifier?: never;
  query?: string;
  status?: CompanyStatus["type"];
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface FindCompaniesByIdsParams {
  tenant_id: string;
  ids: string[];
  tax_registration_country?: never;
  tax_registration_identifier?: never;
  query?: never;
  status?: never;
  sort_field?: never;
  sort_direction?: never;
  limit?: never;
  cursor?: never;
}

export interface FindCompaniesByTaxRegistrationParams {
  tenant_id: string;
  ids?: never;
  tax_registration_country: string;
  tax_registration_identifier: string;
  query?: never;
  status?: never;
  sort_field?: never;
  sort_direction?: never;
  limit?: number;
  cursor?: string | null;
}

export type FindCompaniesParams = FindCompaniesBySearchParams | FindCompaniesByIdsParams | FindCompaniesByTaxRegistrationParams;

export interface CreateCompanyLocationParams {
  tenant_id: string;
  id: string;
  company_id: string;
  name: string;
  shipping_address: PostalAddressInput | null;
  billing_address: PostalAddressInput | null;
  status: CompanyLocationEditableStatus;
  blocks: Block[];
}

export interface GetCompanyLocationParams {
  tenant_id: string;
  id: string;
}

export interface UpdateCompanyLocationParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  name: string;
  shipping_address: PostalAddressInput | null;
  billing_address: PostalAddressInput | null;
  status: CompanyLocationEditableStatus;
  blocks: Block[];
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
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  registration: CompanyTaxRegistrationInput;
}

export interface ReviewCompanyTaxRegistrationParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  registration: CompanyTaxRegistrationInput;
  review: CompanyTaxRegistrationReview;
}

export interface SetCompanyPurchasingParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  purchasing: CompanyPurchasingPolicy;
}

export interface SetCompanyLocationFulfillmentParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  fulfillment: CompanyLocationFulfillment;
}

export interface DeleteCompanyLocationParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindCompanyLocationsByCompanyParams {
  tenant_id: string;
  ids?: never;
  company_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface FindCompanyLocationsByIdsParams {
  tenant_id: string;
  ids: string[];
  company_id?: never;
  limit?: never;
  cursor?: never;
}

export type FindCompanyLocationsParams = FindCompanyLocationsByCompanyParams | FindCompanyLocationsByIdsParams;

export interface StorefrontFindCompanyLocationsParams {
  company_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface StorefrontGetCompanyLocationParams {
  id: string;
}

export interface StorefrontGetCompanyAccessParams {
  id: string;
}

export interface StorefrontUpdateCompanyParams {
  id: string;
  expected_updated_at: EpochMilliseconds;
  name: string;
  contact: EmailContact | null;
  billing_address: PostalAddressInput | null;
}

export interface StorefrontCreateCompanyLocationParams {
  id: string;
  company_id: string;
  name: string;
  shipping_address: PostalAddressInput | null;
  billing_address: PostalAddressInput | null;
  status: CompanyLocationEditableStatus;
  blocks: [];
}

export interface StorefrontUpdateCompanyLocationParams {
  id: string;
  expected_updated_at: EpochMilliseconds;
  name: string;
  shipping_address: PostalAddressInput | null;
  billing_address: PostalAddressInput | null;
  status: CompanyLocationEditableStatus;
}

export interface StorefrontDeleteCompanyLocationParams {
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface CreateCompanyRoleParams {
  tenant_id: string;
  id: string;
  company_id: string;
  key: string;
  permissions: CompanyPermissionType[];
}

export interface GetCompanyRoleParams {
  tenant_id: string;
  id: string;
  company_id: string;
}

export interface UpdateCompanyRoleParams {
  tenant_id: string;
  id: string;
  company_id: string;
  expected_updated_at: EpochMilliseconds;
  permissions: CompanyPermissionType[];
}

export interface DeleteCompanyRoleParams {
  tenant_id: string;
  id: string;
  company_id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindCompanyRolesParams {
  tenant_id: string;
  company_id: string;
  key?: string;
  limit?: number;
  cursor?: string | null;
}

export interface CreateCompanyMembershipParams {
  tenant_id: string;
  id: string;
  company_id: string;
  contact: EmailContact;
  role_ids: string[];
}

export interface GetCompanyMembershipParams {
  tenant_id: string;
  id: string;
}

export interface UpdateCompanyMembershipParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  role_ids: string[];
  status?: { type: "active" } | { type: "disabled" };
}

export interface DeleteCompanyMembershipParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export type FindCompanyMembershipsBySearchParams = {
  tenant_id: string;
  email?: never;
  role_id?: string;
  limit?: number;
  cursor?: string | null;
} & ({ company_id?: string; user_id?: never } | { company_id?: never; user_id?: string });

export interface FindCompanyMembershipByUserParams {
  tenant_id: string;
  company_id: string;
  user_id: string;
  email?: never;
  role_id?: never;
  limit?: never;
  cursor?: never;
}

export interface FindCompanyMembershipByEmailParams {
  tenant_id: string;
  company_id: string;
  email: string;
  user_id?: never;
  role_id?: never;
  limit?: never;
  cursor?: never;
}

export type FindCompanyMembershipsParams =
  | FindCompanyMembershipsBySearchParams
  | FindCompanyMembershipByUserParams
  | FindCompanyMembershipByEmailParams;

export interface StorefrontFindCompanyMembershipsParams {
  company_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface StorefrontCreateCompanyMembershipParams {
  id: string;
  company_id: string;
  contact: EmailContact;
  role_ids: string[];
}

export interface StorefrontUpdateCompanyMembershipParams {
  id: string;
  expected_updated_at: EpochMilliseconds;
  role_ids: string[];
  status?: { type: "active" } | { type: "disabled" };
}

export interface StorefrontDeleteCompanyMembershipParams {
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface StorefrontResendCompanyInviteParams {
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface StorefrontFindCompanyRolesParams {
  company_id: string;
  key?: string;
  limit?: number;
  cursor?: string | null;
}

export interface ResendCompanyInviteParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}
