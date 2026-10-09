import type { EpochMilliseconds } from "./time";
import type { Block } from "./block";
import type { PostalAddress, PostalAddressInput, SortDirection } from "./common";
import type { PurchaseRequirementUnit } from "./subscription";

export type CompanyStatus =
  | { type: "active" }
  | { type: "archived" }
  | { type: "deleting" };

export type CompanyEditableStatus = Exclude<CompanyStatus, { type: "deleting" }>;

export interface Company {
  id: string;
  store_id: string;
  name: string;
  contact_email: string;
  blocks: Block[];
  status: CompanyStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

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

export type CompanyLocationPayment =
  | { type: "at_checkout"; billing_address: PostalAddress | null }
  | { type: "on_account"; terms: PaymentTerms; billing_address: PostalAddress };

export type AllowedPaymentOptions =
  | { type: "all" }
  | { type: "only"; payment_option_ids: string[] };

export interface CompanyLocationCommercePolicy {
  payment: CompanyLocationPayment;
  allowed_payment_options: AllowedPaymentOptions;
  purchase_order_number_required: boolean;
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
  commerce: CompanyLocationCommercePolicy;
  fulfillment: CompanyLocationFulfillment;
  status: CompanyLocationStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

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

export interface CompanyRole {
  id: string;
  store_id: string;
  key: string;
  permissions: CompanyPermission[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type CompanyLocationReach =
  | { type: "everywhere" }
  | { type: "only"; company_location_ids: string[] };

export type CompanyMembershipStatus = { type: "active" } | { type: "disabled" };

export interface CompanyMembership {
  id: string;
  store_id: string;
  company_id: string;
  customer_id: string;
  role_ids: string[];
  locations: CompanyLocationReach;
  status: CompanyMembershipStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CompanyCustomerAccess {
  company: Company;
  locations: CompanyLocationReach;
  permissions: CompanyPermission[];
}

export type MinimumProgressUnavailableReason =
  | "no_requirement"
  | "incomplete_source_evidence"
  | "conversion_mismatch"
  | "incomplete_return_evidence"
  | "mixed_timezone_period"
  | "mixed_measurement_unit"
  | "mixed_agreements"
  | "arithmetic_overflow"
  | "history_limit";

export type MinimumProgressMonthState =
  | {
      type: "available";
      unit: PurchaseRequirementUnit;
      delivered_quantity: number;
      returned_quantity: number;
      current_quantity: number;
      minimum_quantity: number;
      remaining_quantity: number;
      attention: boolean;
      grace: boolean;
      paused: boolean;
      inactive: boolean;
    }
  | { type: "unavailable"; reason: MinimumProgressUnavailableReason };

export interface MinimumProgressMonth {
  year: number;
  month: number;
  timezone: string;
  starts_at: EpochMilliseconds;
  ends_at: EpochMilliseconds;
  subscription_id: string | null;
  progress: MinimumProgressMonthState;
}

export interface BranchMinimumProgress {
  company_id: string;
  company_location_id: string;
  state:
    | { type: "available"; current: MinimumProgressMonth; history: MinimumProgressMonth[] }
    | { type: "unavailable"; reason: MinimumProgressUnavailableReason };
}

export interface GetBranchMinimumProgressParams {
  store_id: string;
  company_id: string;
  company_location_id: string;
}

export interface GetStorefrontBranchMinimumProgressParams {
  company_id: string;
  company_location_id: string;
}

export interface CreateCompanyParams {
  store_id: string;
  id: string;
  name: string;
  contact_email: string;
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

export interface SubmitCompanyLocationTaxRegistrationParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  registration: CompanyTaxRegistrationInput;
}

export interface ReviewCompanyLocationTaxRegistrationParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  registration: CompanyTaxRegistrationInput;
  review: CompanyTaxRegistrationReview;
}

export interface SetCompanyLocationCommercePolicyParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  commerce: CompanyLocationCommercePolicy;
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
  role_ids: string[];
  locations: CompanyLocationReach;
}

export interface GetCompanyMembershipParams {
  store_id: string;
  id: string;
}

export interface UpdateCompanyMembershipParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  role_ids: string[];
  locations: CompanyLocationReach;
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
