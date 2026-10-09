import type { EpochMilliseconds } from "./time";
import type { AccountActor, PostalAddress, PostalAddressInput, SortDirection } from "./common";
import type { CategoryEntry, CategoryQuery } from "./content";

export interface CustomerAddress {
  id: string;
  address: PostalAddress;
}

export interface CustomerAddressInput {
  id: string;
  address: PostalAddressInput;
}

export type CustomerEmail =
  | { type: "no_email" }
  | { type: "contact"; email: string }
  | { type: "reserved"; email: string; reserved_at: EpochMilliseconds }
  | { type: "verified"; email: string; verified_at: EpochMilliseconds };

export type CustomerEmailType = CustomerEmail["type"];

export type CustomerEmailInput =
  | { type: "no_email" }
  | { type: "contact"; email: string }
  | { type: "reserved"; email: string };

export type CustomerStatus = { type: "active" } | { type: "archived" };

export interface Customer {
  id: string;
  store_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  language: string | null;
  email: CustomerEmail;
  addresses: CustomerAddress[];
  default_shipping_address_id: string | null;
  default_billing_address_id: string | null;
  status: CustomerStatus;
  categories: CategoryEntry[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CustomerSearchSnapshot {
  customer: Customer;
  has_cart: boolean;
  has_customer_action: boolean;
}

export interface CustomerEmailVerification {
  email: string;
  failed_attempts: number;
  notification_id: string;
  issued_at: EpochMilliseconds;
  expires_at: EpochMilliseconds;
}

export type CustomerSessionType =
  | {
      type: "visitor";
      expires_at: EpochMilliseconds;
      email_verification: CustomerEmailVerification | null;
    }
  | {
      type: "email_authenticated";
      access_expires_at: EpochMilliseconds;
      refresh_expires_at: EpochMilliseconds;
      authenticated_at: EpochMilliseconds;
    };

export type CustomerSessionStatus =
  | { type: "active" }
  | { type: "superseded" }
  | { type: "revoked" };

export interface CustomerSession {
  id: string;
  store_id: string;
  customer_id: string;
  type: CustomerSessionType;
  status: CustomerSessionStatus;
  last_seen_at: EpochMilliseconds;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type CustomerSessionIssued =
  | {
      type: "visitor";
      id: string;
      customer_id: string;
      status: CustomerSessionStatus;
      token: string;
      expires_at: EpochMilliseconds;
    }
  | {
      type: "email_authenticated";
      id: string;
      customer_id: string;
      status: CustomerSessionStatus;
      access_token: string;
      refresh_token: string;
      access_expires_at: EpochMilliseconds;
      refresh_expires_at: EpochMilliseconds;
      authenticated_at: EpochMilliseconds;
    };

export interface CustomerSessionResult {
  customer: Customer;
  session: CustomerSessionIssued;
}

export interface CustomerCodeResult {
  customer: Customer;
  session: CustomerSession;
  email_verification: {
    issued_at: EpochMilliseconds;
    expires_at: EpochMilliseconds;
  };
}

export interface CustomerMe {
  customer: Customer;
  session: CustomerSession;
  email_unsubscribed: boolean;
}

export type EmailSuppressionType = "unsubscribe" | "block" | "hard_bounce" | "complaint";

export type EmailSuppressionCause =
  | { type: "unsubscribe_link"; broadcast_id: string }
  | { type: "account"; actor: AccountActor; note: string }
  | { type: "report" };

export type EmailSuppressionRelease =
  | { type: "account"; actor: AccountActor; note: string }
  | { type: "storefront"; customer_session_id: string };

export type EmailSuppressionStatus =
  | { type: "active"; cause: EmailSuppressionCause }
  | { type: "released"; by: EmailSuppressionRelease };

export interface EmailSuppression {
  id: string;
  store_id: string;
  email: string;
  type: EmailSuppressionType;
  status: EmailSuppressionStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CreateCustomerParams {
  store_id: string;
  id: string;
  email?: CustomerEmailInput;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  language?: string | null;
  addresses?: CustomerAddressInput[];
  default_shipping_address_id?: string | null;
  default_billing_address_id?: string | null;
  categories?: CategoryEntry[];
}

export interface UpdateCustomerParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  email?: CustomerEmailInput;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  language?: string | null;
  addresses?: CustomerAddressInput[];
  default_shipping_address_id?: string | null;
  default_billing_address_id?: string | null;
  categories?: CategoryEntry[];
  status?: CustomerStatus;
}

export interface GetCustomerParams {
  store_id: string;
  id: string;
}

export interface ArchiveCustomerParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface EraseCustomerParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface MergeCustomerParams {
  store_id: string;
  id: string;
  target_customer_id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindCustomersParams {
  store_id: string;
  ids?: string[];
  query?: string;
  category_query?: CategoryQuery[];
  status?: CustomerStatus["type"];
  email_type?: CustomerEmailType;
  has_customer_action?: boolean;
  has_cart?: boolean;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface ResolveOrReserveCustomerEmailParams {
  store_id: string;
  email: string;
  customer_id: string;
}

export interface ImportCustomerRow {
  email: string;
  customer_id: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  language: string | null;
  categories: CategoryEntry[] | null;
}

export interface ImportCustomersParams {
  store_id: string;
  rows: ImportCustomerRow[];
}

export interface ImportCustomerFieldError {
  field: string;
  message: string;
}

export interface ImportCustomerPreviewRow {
  row: number;
  email: string;
  customer_id: string | null;
  valid: boolean;
  errors: ImportCustomerFieldError[];
}

export interface ImportCustomersPreviewResult {
  rows_total: number;
  rows_valid: number;
  rows_invalid: number;
  rows: ImportCustomerPreviewRow[];
}

export interface ImportCustomerRowResult {
  row: number;
  email: string;
  customer_id: string | null;
  created: boolean;
  updated: boolean;
  error: string | null;
}

export interface ImportCustomersResult {
  rows_total: number;
  customers_created: number;
  customers_updated: number;
  rows_failed: number;
  rows: ImportCustomerRowResult[];
}

export interface FindCustomerSessionsParams {
  store_id: string;
  customer_id: string;
  limit?: number;
  cursor?: string | null;
}

export interface RevokeCustomerSessionParams {
  store_id: string;
  customer_id: string;
  session_id: string;
}

export interface RevokeAllCustomerSessionsParams {
  store_id: string;
  customer_id: string;
}

export interface FindEmailSuppressionsParams {
  store_id: string;
  query?: string;
  type?: EmailSuppressionType;
  status?: EmailSuppressionStatus["type"];
  limit?: number;
  cursor?: string | null;
}

export interface GetEmailSuppressionParams {
  store_id: string;
  id: string;
}

export interface ActivateEmailSuppressionParams {
  store_id: string;
  id: string;
  email: string;
  note: string;
  expected_updated_at?: EpochMilliseconds;
}

export interface ReleaseEmailSuppressionParams {
  store_id: string;
  id: string;
  note: string;
  expected_updated_at: EpochMilliseconds;
}

export interface UpdateCustomerMeParams {
  expected_updated_at: EpochMilliseconds;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  language?: string | null;
  email?: string | null;
  addresses?: CustomerAddressInput[];
  default_shipping_address_id?: string | null;
  default_billing_address_id?: string | null;
}
