import type { EpochMilliseconds } from "./time";
import type { AccountActor, EmailContact, PostalAddress, PostalAddressInput, SortDirection } from "./common";
import type { LoginAddress, LoginContact } from "./account";
import type { Block, BlockQuery } from "./block";
import type { ApiErrorResponse } from "./apiError";
import type { CategoryEntry, PrivateEntry, PrivateFileLink } from "./content";
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

export type SmsConsent = { type: "off"; at: EpochMilliseconds } | { type: "on"; at: EpochMilliseconds; by: ConsentGiver };

export type SmsConsentChoice = "off" | "on";

export type StorefrontSmsConsent = { type: "off" } | { type: "on"; at: EpochMilliseconds };

export interface CustomerCode {
  failed_attempts: number;
  outgoing_message_id: string;
  issued_at: EpochMilliseconds;
  expires_at: EpochMilliseconds;
}

export type CustomerContact =
  | { type: "unconfirmed_email"; email: string; language: string }
  | { type: "confirmed_email"; email: string; language: string }
  | { type: "unconfirmed_phone"; number: string; language: string; sms: SmsConsent }
  | { type: "confirmed_phone"; number: string; language: string; sms: SmsConsent };

export type StorefrontCustomerContact =
  | { type: "unconfirmed_email"; email: string; language: string }
  | { type: "confirmed_email"; email: string; language: string }
  | { type: "unconfirmed_phone"; number: string; language: string; sms: StorefrontSmsConsent }
  | { type: "confirmed_phone"; number: string; language: string; sms: StorefrontSmsConsent };

export type CustomerLink = { type: "own" };

export type CustomerInviteStatus =
  | { type: "active" }
  | { type: "superseded" };

export interface CustomerInvite {
  id: string;
  customer_id: string;
  sent_to: LoginAddress;
  language: string;
  code: CustomerCode;
  status: CustomerInviteStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type CustomerContactStatus = "unconfirmed" | "confirmed";

export type CustomerContactSummaryAddress =
  | { type: "email"; email: string }
  | { type: "phone"; number: string; sms: SmsConsentChoice };

export interface CustomerContactSummary {
  status: CustomerContactStatus;
  address: CustomerContactSummaryAddress;
}

export interface StorefrontCustomer {
  id: string;
  store_id: string;
  links: CustomerLink[];
  name: CustomerName | null;
  contacts: StorefrontCustomerContact[];
  addresses: CustomerAddress[];
  default_shipping_address_id: string | null;
  default_billing_address_id: string | null;
  profile: Block[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type CustomerStatus = { type: "active" } | { type: "erased"; at: EpochMilliseconds };

export interface Customer {
  id: string;
  store_id: string;
  status: CustomerStatus;
  links: CustomerLink[];
  name: CustomerName | null;
  contacts: CustomerContact[];
  addresses: CustomerAddress[];
  default_shipping_address_id: string | null;
  default_billing_address_id: string | null;
  profile: Block[];
  blocks: Block[];
  categories: CategoryEntry[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CustomerSearchSnapshot {
  customer: Customer;
  contacts: CustomerContactSummary[];
  linked: boolean;
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
      type: "store_customer_signed_in_by_email";
      email: string;
      access_expires_at: EpochMilliseconds;
      refresh_expires_at: EpochMilliseconds;
      authenticated_at: EpochMilliseconds;
      new_login_codes: CustomerSessionCode[];
    }
  | {
      type: "store_customer_signed_in_by_phone";
      number: string;
      access_expires_at: EpochMilliseconds;
      refresh_expires_at: EpochMilliseconds;
      authenticated_at: EpochMilliseconds;
      new_login_codes: CustomerSessionCode[];
    }
  | { type: "network_customer_store_key" };

export type VisitorStatus =
  | { type: "active" }
  | { type: "superseded" }
  | { type: "revoked"; revoked_at: EpochMilliseconds };

export type StoreCustomerSignedInByEmailStatus =
  | { type: "active" }
  | { type: "revoked"; revoked_at: EpochMilliseconds };

export type StoreCustomerSignedInByPhoneStatus =
  | { type: "active" }
  | { type: "revoked"; revoked_at: EpochMilliseconds };

export type NetworkCustomerStoreKeyStatus =
  | { type: "active" }
  | { type: "revoked"; revoked_at: EpochMilliseconds };

export type CustomerSessionStatus =
  | { type: "active" }
  | { type: "superseded" }
  | { type: "revoked"; revoked_at: EpochMilliseconds };

export type CustomerSession = {
  id: string;
  store_id: string;
  customer_id: string;
  last_seen_at: EpochMilliseconds;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
} & (
  | { type: Extract<CustomerSessionType, { type: "visitor" }>; status: VisitorStatus }
  | {
      type: Extract<CustomerSessionType, { type: "store_customer_signed_in_by_email" }>;
      status: StoreCustomerSignedInByEmailStatus;
    }
  | {
      type: Extract<CustomerSessionType, { type: "store_customer_signed_in_by_phone" }>;
      status: StoreCustomerSignedInByPhoneStatus;
    }
  | { type: Extract<CustomerSessionType, { type: "network_customer_store_key" }>; status: NetworkCustomerStoreKeyStatus }
);

export type CustomerSessionIssued =
  | {
      type: "visitor";
      id: string;
      customer_id: string;
      status: VisitorStatus;
      token: string;
      expires_at: EpochMilliseconds;
    }
  | {
      type: "store_customer_signed_in_by_email";
      id: string;
      customer_id: string;
      status: StoreCustomerSignedInByEmailStatus;
      email: string;
      access_token: string;
      refresh_token: string;
      access_expires_at: EpochMilliseconds;
      refresh_expires_at: EpochMilliseconds;
      authenticated_at: EpochMilliseconds;
    }
  | {
      type: "store_customer_signed_in_by_phone";
      id: string;
      customer_id: string;
      status: StoreCustomerSignedInByPhoneStatus;
      number: string;
      access_token: string;
      refresh_token: string;
      access_expires_at: EpochMilliseconds;
      refresh_expires_at: EpochMilliseconds;
      authenticated_at: EpochMilliseconds;
    }
  | {
      type: "network_customer_store_key";
      id: string;
      customer_id: string;
      status: NetworkCustomerStoreKeyStatus;
      access_token: string;
    };

export interface CustomerSessionResult {
  customer: StorefrontCustomer;
  session: CustomerSessionIssued;
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
  categories?: CategoryEntry[];
}

export interface UpdateCustomerParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  name?: CustomerName | null;
  profile?: Block[];
  blocks?: Block[];
  categories?: CategoryEntry[];
  addresses?: CustomerAddressInput[];
  default_shipping_address_id?: string | null;
  default_billing_address_id?: string | null;
}

export interface GetCustomerParams {
  store_id: string;
  id: string;
}

export interface EraseCustomerParams { store_id: string; id: string; expected_updated_at: EpochMilliseconds }

export type CustomerBlockAbsence = { type: "absent"; key: string };

export type CustomerBlockFilter = CustomerBlockAbsence | BlockQuery;

export interface FindCustomersBySearchParams {
  store_id: string;
  ids?: string[];
  query?: string;
  filters?: CustomerBlockFilter[];
  profile_filters?: (CustomerBlockAbsence | Extract<BlockQuery, { type: "date" }>)[];
  verified?: boolean;
  has_customer_action?: boolean;
  has_cart?: boolean;
  category_ids?: string[];
  sort_field?: "id" | "email" | "name" | "created_at" | "updated_at";
  sort_direction?: SortDirection;
  contact_email?: never;
  contact_number?: never;
  limit?: number;
  cursor?: string | null;
}

export interface FindCustomersByContactEmailParams {
  store_id: string;
  contact_email: string;
  contact_number?: never;
  ids?: never;
  query?: never;
  filters?: never;
  profile_filters?: never;
  verified?: never;
  has_customer_action?: never;
  has_cart?: never;
  category_ids?: never;
  sort_field?: never;
  sort_direction?: never;
  limit?: number;
  cursor?: string | null;
}

export interface FindCustomersByContactNumberParams {
  store_id: string;
  contact_number: string;
  contact_email?: never;
  ids?: never;
  query?: never;
  filters?: never;
  profile_filters?: never;
  verified?: never;
  has_customer_action?: never;
  has_cart?: never;
  category_ids?: never;
  sort_field?: never;
  sort_direction?: never;
  limit?: number;
  cursor?: string | null;
}

export type FindCustomersParams =
  | FindCustomersBySearchParams
  | FindCustomersByContactEmailParams
  | FindCustomersByContactNumberParams;

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

export interface AddOwnContactParams {
  expected_updated_at: EpochMilliseconds;
  contact: LoginContact;
  sms?: SmsConsentChoice | null;
}

export interface UpdateOwnContactParams {
  expected_updated_at: EpochMilliseconds;
  address: LoginAddress;
  language?: string;
  sms?: SmsConsentChoice;
}

export interface RemoveOwnContactParams {
  expected_updated_at: EpochMilliseconds;
  address: LoginAddress;
}

export interface VerifyOwnContactParams {
  address: LoginAddress;
  code: string;
}

export interface OwnContactParams {
  address: LoginAddress;
}

export interface OwnLinkRemoved {
  removed: true;
}

export interface MergeCustomerParams { store_id: string; id: string; target_customer_id: string; expected_updated_at: EpochMilliseconds }

export interface AddCustomerContactParams {
  store_id: string;
  customer_id: string;
  expected_updated_at: EpochMilliseconds;
  contact: LoginContact;
  sms?: SmsConsentChoice | null;
}

export interface UpdateCustomerContactParams {
  store_id: string;
  customer_id: string;
  expected_updated_at: EpochMilliseconds;
  address: LoginAddress;
  language?: string;
  sms?: SmsConsentChoice;
}

export interface RemoveCustomerContactParams {
  store_id: string;
  customer_id: string;
  expected_updated_at: EpochMilliseconds;
  address: LoginAddress;
}

export interface RemoveCustomerLinkParams {
  store_id: string;
  customer_id: string;
  position: number;
  expected_updated_at: EpochMilliseconds;
}

export interface FindCustomerInvitesParams {
  store_id: string;
  customer_id: string;
}

export interface InviteCustomerContactParams {
  store_id: string;
  customer_id: string;
  id: string;
  address: LoginAddress;
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
  booking_lines: OrderBookingItem[];
  entries: CustomerExportEntry[];
  form_submissions: CustomerExportFormSubmission[];
  conversations: CustomerExportConversation[];
  cut: CustomerExportCut[];
  exported_at: EpochMilliseconds;
}
