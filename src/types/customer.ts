import type { EpochMilliseconds } from "./time";
import type { AccountActor, EmailContact, PostalAddress, PostalAddressInput, SortDirection } from "./common";
import type { Block } from "./block";

export interface CustomerAddress extends PostalAddress { id: string }
export type CustomerAddressInput = PostalAddressInput & { id: string };

export type CustomerType =
  | { type: "anonymous" }
  | {
      type: "verified";
      contact: EmailContact;
      addresses: CustomerAddress[];
      default_shipping_address_id: string | null;
      default_billing_address_id: string | null;
    };

export interface StorefrontCustomer {
  id: string;
  store_id: string;
  type: CustomerType;
  profile: Block[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface Customer extends StorefrontCustomer { blocks: Block[] }

export interface CustomerSearchSnapshot {
  customer: Customer;
  has_cart: boolean;
  has_customer_action: boolean;
  has_order: boolean;
  latest_order_contact: CustomerOrderContact | null;
}

export interface CustomerOrderContact {
  email: EmailContact | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
}

export interface CustomerEmailVerification {
  contact: EmailContact;
  failed_attempts: number;
  outgoing_email_id: string;
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
      email_change: CustomerEmailVerification | null;
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
  customer: StorefrontCustomer;
  session: CustomerSessionIssued;
}

export interface CustomerCodeResult {
  customer: StorefrontCustomer;
  session: CustomerSession;
  email_verification: {
    issued_at: EpochMilliseconds;
    expires_at: EpochMilliseconds;
  };
}

export interface CustomerMe {
  customer: StorefrontCustomer;
  session: CustomerSession;
  email_unsubscribed: boolean;
}

export type EmailSuppressionType = "unsubscribe" | "block" | "hard_bounce" | "complaint";

export type EmailSuppressionCause =
  | { type: "storefront"; customer_session_id: string }
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
  profile: Block[];
  blocks: Block[];
}

export interface UpdateCustomerParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  profile?: Block[];
  blocks?: Block[];
  addresses?: CustomerAddressInput[];
  default_shipping_address_id?: string | null;
  default_billing_address_id?: string | null;
}

export interface GetCustomerParams {
  store_id: string;
  id: string;
}

export interface EraseCustomerParams { store_id: string; id: string; expected_updated_at: EpochMilliseconds }

export interface FindCustomersParams {
  store_id: string;
  ids?: string[];
  query?: string;
  type?: CustomerType["type"];
  has_customer_action?: boolean;
  has_cart?: boolean;
  sort_field?: "id" | "email" | "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface ImportCustomerRow { customer_id: string; profile: Block[]; blocks: Block[] }

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
  customer_id: string;
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
  customer_id: string;
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
  profile?: Block[];
  addresses?: CustomerAddressInput[];
  default_shipping_address_id?: string | null;
  default_billing_address_id?: string | null;
  language?: string;
}

export interface ChangeCustomerEmailParams {
  code: string;
}

export interface MergeCustomerParams { store_id: string; id: string; target_customer_id: string; expected_updated_at: EpochMilliseconds }
