import type { EpochMilliseconds } from "./time";
import type { AccountActor, EmailContact, PostalAddress, PostalAddressInput, SortDirection } from "./common";
import type { Block } from "./block";
import type { ApiErrorResponse } from "./apiError";
import type { PrivateEntry, PrivateFileLink } from "./content";
import type { FormSubmission, FormSubmissionFileLink } from "./forms";
import type { OrderBookingItem } from "./order";
import type { CallRecordingLink, Conversation, ConversationAttachmentLink, ConversationMessage } from "./support";

export interface CustomerAddress extends PostalAddress { id: string }
export type CustomerAddressInput = PostalAddressInput & { id: string };

export interface CustomerName {
  first_name: string;
  last_name: string;
}

export type ConsentGiver =
  | { type: "customer"; customer_session_id: string }
  | { type: "account"; actor: AccountActor }
  | { type: "assistant"; conversation_message_id: string };

export type SmsConsent = { type: "off" } | { type: "on"; at: EpochMilliseconds; by: ConsentGiver };

export type SmsConsentChoice = "off" | "on";

export type StorefrontSmsConsent = { type: "off" } | { type: "on"; at: EpochMilliseconds };

export type CustomerLoginStatus = "unverified" | "invited" | "verified";

export type CustomerLoginContact =
  | { type: "email"; email: string; language: string }
  | { type: "phone"; number: string; language: string };

export type CustomerLoginAddress =
  | { type: "email"; email: string }
  | { type: "phone"; number: string };

export interface CustomerCode {
  failed_attempts: number;
  outgoing_message_id: string;
  issued_at: EpochMilliseconds;
  expires_at: EpochMilliseconds;
}

export type CustomerLoginType =
  | { type: "unverified_email"; email: string; language: string }
  | { type: "invited_email"; email: string; language: string; invited_by: AccountActor; code: CustomerCode }
  | { type: "verified_email"; email: string; language: string }
  | { type: "unverified_phone"; number: string; language: string; sms: SmsConsent }
  | {
      type: "invited_phone";
      number: string;
      language: string;
      sms: SmsConsent;
      invited_by: AccountActor;
      code: CustomerCode;
    }
  | { type: "verified_phone"; number: string; language: string; sms: SmsConsent };

export interface CustomerLogin {
  id: string;
  store_id: string;
  customer_id: string;
  type: CustomerLoginType;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type StorefrontCustomerLoginType =
  | { type: "unverified_email"; email: string; language: string }
  | { type: "invited_email"; email: string; language: string; expires_at: EpochMilliseconds }
  | { type: "verified_email"; email: string; language: string; unsubscribed: boolean }
  | { type: "unverified_phone"; number: string; language: string; sms: StorefrontSmsConsent }
  | {
      type: "invited_phone";
      number: string;
      language: string;
      sms: StorefrontSmsConsent;
      expires_at: EpochMilliseconds;
    }
  | { type: "verified_phone"; number: string; language: string; sms: StorefrontSmsConsent };

export interface StorefrontCustomerLogin {
  id: string;
  type: StorefrontCustomerLoginType;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type CustomerLoginSummaryAddress =
  | { type: "email"; email: string }
  | { type: "phone"; number: string; sms: SmsConsentChoice };

export interface CustomerLoginSummary {
  id: string;
  status: CustomerLoginStatus;
  address: CustomerLoginSummaryAddress;
}

export interface StorefrontCustomer {
  id: string;
  store_id: string;
  name: CustomerName | null;
  addresses: CustomerAddress[];
  default_shipping_address_id: string | null;
  default_billing_address_id: string | null;
  profile: Block[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface Customer {
  id: string;
  store_id: string;
  name: CustomerName | null;
  addresses: CustomerAddress[];
  default_shipping_address_id: string | null;
  default_billing_address_id: string | null;
  profile: Block[];
  blocks: Block[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CustomerSearchSnapshot {
  customer: Customer;
  logins: CustomerLoginSummary[];
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

export type CustomerSessionCode =
  | { type: "email"; email: string; language: string; code: CustomerCode }
  | { type: "phone"; number: string; language: string; code: CustomerCode };

export type CustomerSessionType =
  | {
      type: "visitor";
      expires_at: EpochMilliseconds;
      sign_in_codes: CustomerSessionCode[];
    }
  | {
      type: "logged_in";
      login_id: string;
      access_expires_at: EpochMilliseconds;
      refresh_expires_at: EpochMilliseconds;
      authenticated_at: EpochMilliseconds;
      new_login_codes: CustomerSessionCode[];
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
      type: "logged_in";
      id: string;
      customer_id: string;
      login_id: string;
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
  login: StorefrontCustomerLogin | null;
}

export interface CustomerCodeResult {
  customer: StorefrontCustomer;
  session: CustomerSession;
  code: {
    issued_at: EpochMilliseconds;
    expires_at: EpochMilliseconds;
  };
}

export interface CustomerMe {
  customer: StorefrontCustomer;
  session: CustomerSession;
  logins: StorefrontCustomerLogin[];
}

export type SuppressionTypeName =
  | "email_unsubscribe"
  | "email_block"
  | "email_hard_bounce"
  | "email_complaint"
  | "sms_block"
  | "sms_opt_out";

export type UnsubscribeCause =
  | { type: "storefront"; customer_session_id: string }
  | { type: "unsubscribe_link"; broadcast_id: string }
  | { type: "account"; actor: AccountActor; note: string };

export type UnsubscribeRelease =
  | { type: "storefront"; customer_session_id: string }
  | { type: "account"; actor: AccountActor; note: string };

export type UnsubscribeStatus =
  | { type: "active"; cause: UnsubscribeCause }
  | { type: "released"; by: UnsubscribeRelease };

export type StaffSuppressionStatus =
  | { type: "active"; actor: AccountActor; note: string }
  | { type: "released"; actor: AccountActor; note: string };

export type ReportedSuppressionStatus =
  | { type: "active" }
  | { type: "released"; actor: AccountActor; note: string };

export type SuppressionType =
  | { type: "email_unsubscribe"; email: string; status: UnsubscribeStatus }
  | { type: "email_block"; email: string; status: StaffSuppressionStatus }
  | { type: "email_hard_bounce"; email: string; status: ReportedSuppressionStatus }
  | { type: "email_complaint"; email: string; status: ReportedSuppressionStatus }
  | { type: "sms_block"; number: string; status: StaffSuppressionStatus }
  | { type: "sms_opt_out"; number: string; status: ReportedSuppressionStatus };

export type SuppressionStatusName = "active" | "released";

export interface Suppression {
  id: string;
  store_id: string;
  type: SuppressionType;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CreateCustomerParams {
  store_id: string;
  id: string;
  name?: CustomerName | null;
  profile: Block[];
  blocks: Block[];
}

export interface UpdateCustomerParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  name?: CustomerName | null;
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
  verified?: boolean;
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

export type ImportCustomerPreviewOutcome =
  | { type: "create" }
  | { type: "existing" }
  | { type: "failed"; error: ApiErrorResponse };

export interface ImportCustomerPreviewRow {
  row: number;
  customer_id: string;
  outcome: ImportCustomerPreviewOutcome;
}

export interface ImportCustomersPreviewResult {
  rows_total: number;
  rows_to_create: number;
  rows_existing: number;
  rows_failed: number;
  rows: ImportCustomerPreviewRow[];
}

export type ImportCustomerRowOutcome =
  | { type: "created" }
  | { type: "existing" }
  | { type: "failed"; error: ApiErrorResponse };

export interface ImportCustomerRowResult {
  row: number;
  customer_id: string;
  outcome: ImportCustomerRowOutcome;
}

export interface ImportCustomersResult {
  rows_total: number;
  customers_created: number;
  rows_existing: number;
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

export interface FindSuppressionsParams {
  store_id: string;
  query?: string;
  type?: SuppressionTypeName;
  status?: SuppressionStatusName;
  limit?: number;
  cursor?: string | null;
}

export interface GetSuppressionParams {
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

export interface ActivateSmsSuppressionParams {
  store_id: string;
  id: string;
  number: string;
  note: string;
  expected_updated_at?: EpochMilliseconds;
}

export interface ReleaseSuppressionParams {
  store_id: string;
  id: string;
  note: string;
  expected_updated_at: EpochMilliseconds;
}

export interface UpdateCustomerMeParams {
  expected_updated_at: EpochMilliseconds;
  name?: CustomerName | null;
  profile?: Block[];
  addresses?: CustomerAddressInput[];
  default_shipping_address_id?: string | null;
  default_billing_address_id?: string | null;
}

export interface CreateOwnLoginParams {
  id: string;
  contact: CustomerLoginContact;
  sms?: SmsConsentChoice | null;
}

export interface UpdateOwnLoginParams {
  login_id: string;
  expected_updated_at: EpochMilliseconds;
  language?: string;
  sms?: SmsConsentChoice;
}

export interface DeleteOwnLoginParams {
  login_id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface VerifyNewLoginParams {
  code: string;
}

export interface OwnLoginParams {
  login_id: string;
}

export interface MergeCustomerParams { store_id: string; id: string; target_customer_id: string; expected_updated_at: EpochMilliseconds }

export interface FindCustomerLoginsParams {
  store_id: string;
  customer_id: string;
}

export interface CreateCustomerLoginParams {
  store_id: string;
  customer_id: string;
  id: string;
  contact: CustomerLoginContact;
  sms?: SmsConsentChoice | null;
}

export interface UpdateCustomerLoginParams {
  store_id: string;
  customer_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  language?: string;
  sms?: SmsConsentChoice;
}

export interface DeleteCustomerLoginParams {
  store_id: string;
  customer_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface InviteCustomerLoginParams {
  store_id: string;
  customer_id: string;
  login_id: string;
  id: string;
}

export interface CustomerLoginInviteSent {
  login: CustomerLogin;
  issued_at: EpochMilliseconds;
  expires_at: EpochMilliseconds;
}

export interface ExportCustomerParams {
  store_id: string;
  id: string;
}

export type CustomerExportPart = "booking_lines" | "entries" | "form_submissions" | "conversations" | "calls";

export type CustomerExportCutReason = "grant" | "size";

export interface CustomerExportCut {
  part: CustomerExportPart;
  reason: CustomerExportCutReason;
}

export interface CustomerExportEntryFile {
  media_id: string;
  link: PrivateFileLink;
}

export interface CustomerExportEntry {
  entry: Omit<PrivateEntry, "validation_errors">;
  files: CustomerExportEntryFile[];
}

export interface CustomerExportFormFile {
  sha256: string;
  link: FormSubmissionFileLink;
}

export interface CustomerExportFormSubmission {
  submission: FormSubmission;
  files: CustomerExportFormFile[];
}

export interface CustomerExportAttachment {
  conversation_message_id: string;
  sha256: string;
  link: ConversationAttachmentLink;
}

export interface CustomerExportRecording {
  conversation_message_id: string;
  link: CallRecordingLink;
}

export interface CustomerExportConversation {
  conversation: Conversation;
  messages: ConversationMessage[];
  attachments: CustomerExportAttachment[];
  recordings: CustomerExportRecording[];
}

export interface CustomerExport {
  customer: Customer;
  logins: CustomerLogin[];
  booking_lines: OrderBookingItem[];
  entries: CustomerExportEntry[];
  form_submissions: CustomerExportFormSubmission[];
  conversations: CustomerExportConversation[];
  cut: CustomerExportCut[];
  exported_at: EpochMilliseconds;
}
