import type { EpochMilliseconds } from "./time";
import type { AccountActor, EmailContact, PostalAddress, PostalAddressInput, SortDirection } from "./common";
import type { LoginAddress, LoginContact } from "./account";
import type { Block, BlockQuery } from "./block";
import type { ApiErrorResponse } from "./apiError";
import type { CategoryEntry, PrivateEntry, PrivateFileLink } from "./content";
import type { FormSubmission, FormSubmissionFileLink } from "./forms";
import type { OrderBookingItem } from "./order";
import type { CallRecordingLink, Conversation, ConversationAttachmentLink, ConversationMessage } from "./support";

export interface UserAddress extends PostalAddress { id: string }
export type UserAddressInput = PostalAddressInput & { id: string };

export interface UserName {
  first_name: string;
  last_name: string;
}

export type ConsentGiver =
  | { type: "user"; user_session_id: string }
  | { type: "account"; actor: AccountActor }
  | { type: "assistant"; conversation_message_id: string };

export type SmsConsent = { type: "off"; at: EpochMilliseconds } | { type: "on"; at: EpochMilliseconds; by: ConsentGiver };

export type SmsConsentChoice = "off" | "on";

export type StorefrontSmsConsent = { type: "off" } | { type: "on"; at: EpochMilliseconds };

export interface UserCode {
  failed_attempts: number;
  outgoing_message_id: string;
  issued_at: EpochMilliseconds;
  expires_at: EpochMilliseconds;
}

export type UserContact =
  | { type: "unconfirmed_email"; email: string; language: string }
  | { type: "confirmed_email"; email: string; language: string }
  | { type: "unconfirmed_phone"; number: string; language: string; sms: SmsConsent }
  | { type: "confirmed_phone"; number: string; language: string; sms: SmsConsent };

export type StorefrontUserContact =
  | { type: "unconfirmed_email"; email: string; language: string }
  | { type: "confirmed_email"; email: string; language: string }
  | { type: "unconfirmed_phone"; number: string; language: string; sms: StorefrontSmsConsent }
  | { type: "confirmed_phone"; number: string; language: string; sms: StorefrontSmsConsent };

export type UserLink = { type: "own" };

export type UserInviteStatus =
  | { type: "active" }
  | { type: "superseded" };

export interface UserInvite {
  id: string;
  user_id: string;
  sent_to: LoginAddress;
  language: string;
  code: UserCode;
  status: UserInviteStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type UserContactStatus = "unconfirmed" | "confirmed";

export type UserContactSummaryAddress =
  | { type: "email"; email: string }
  | { type: "phone"; number: string; sms: SmsConsentChoice };

export interface UserContactSummary {
  status: UserContactStatus;
  address: UserContactSummaryAddress;
}

export interface StorefrontUser {
  id: string;
  tenant_id: string;
  links: UserLink[];
  name: UserName | null;
  contacts: StorefrontUserContact[];
  addresses: UserAddress[];
  default_shipping_address_id: string | null;
  default_billing_address_id: string | null;
  profile: Block[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type UserStatus = { type: "active" } | { type: "erased"; at: EpochMilliseconds };

export interface User {
  id: string;
  tenant_id: string;
  status: UserStatus;
  links: UserLink[];
  name: UserName | null;
  contacts: UserContact[];
  addresses: UserAddress[];
  default_shipping_address_id: string | null;
  default_billing_address_id: string | null;
  profile: Block[];
  blocks: Block[];
  categories: CategoryEntry[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface UserSearchSnapshot {
  user: User;
  contacts: UserContactSummary[];
  linked: boolean;
  has_cart: boolean;
  has_user_action: boolean;
  has_order: boolean;
  latest_order_contact: UserOrderContact | null;
}

export interface UserOrderContact {
  email: EmailContact | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
}

export type UserSessionCode =
  | { type: "email"; email: string; language: string; code: UserCode }
  | { type: "phone"; number: string; language: string; code: UserCode };

export type UserSessionType =
  | {
      type: "visitor";
      expires_at: EpochMilliseconds;
      sign_in_codes: UserSessionCode[];
    }
  | {
      type: "tenant_user_signed_in_by_email";
      email: string;
      access_expires_at: EpochMilliseconds;
      refresh_expires_at: EpochMilliseconds;
      authenticated_at: EpochMilliseconds;
      new_login_codes: UserSessionCode[];
    }
  | {
      type: "tenant_user_signed_in_by_phone";
      number: string;
      access_expires_at: EpochMilliseconds;
      refresh_expires_at: EpochMilliseconds;
      authenticated_at: EpochMilliseconds;
      new_login_codes: UserSessionCode[];
    }
  | { type: "network_user_tenant_key" };

export type VisitorStatus =
  | { type: "active" }
  | { type: "superseded" }
  | { type: "revoked"; revoked_at: EpochMilliseconds };

export type TenantUserSignedInByEmailStatus =
  | { type: "active" }
  | { type: "revoked"; revoked_at: EpochMilliseconds };

export type TenantUserSignedInByPhoneStatus =
  | { type: "active" }
  | { type: "revoked"; revoked_at: EpochMilliseconds };

export type NetworkUserTenantKeyStatus =
  | { type: "active" }
  | { type: "revoked"; revoked_at: EpochMilliseconds };

export type UserSessionStatus =
  | { type: "active" }
  | { type: "superseded" }
  | { type: "revoked"; revoked_at: EpochMilliseconds };

export type UserSession = {
  id: string;
  tenant_id: string;
  user_id: string;
  last_seen_at: EpochMilliseconds;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
} & (
  | { type: Extract<UserSessionType, { type: "visitor" }>; status: VisitorStatus }
  | {
      type: Extract<UserSessionType, { type: "tenant_user_signed_in_by_email" }>;
      status: TenantUserSignedInByEmailStatus;
    }
  | {
      type: Extract<UserSessionType, { type: "tenant_user_signed_in_by_phone" }>;
      status: TenantUserSignedInByPhoneStatus;
    }
  | { type: Extract<UserSessionType, { type: "network_user_tenant_key" }>; status: NetworkUserTenantKeyStatus }
);

export type UserSessionIssued =
  | {
      type: "visitor";
      id: string;
      user_id: string;
      status: VisitorStatus;
      token: string;
      expires_at: EpochMilliseconds;
    }
  | {
      type: "tenant_user_signed_in_by_email";
      id: string;
      user_id: string;
      status: TenantUserSignedInByEmailStatus;
      email: string;
      access_token: string;
      refresh_token: string;
      access_expires_at: EpochMilliseconds;
      refresh_expires_at: EpochMilliseconds;
      authenticated_at: EpochMilliseconds;
    }
  | {
      type: "tenant_user_signed_in_by_phone";
      id: string;
      user_id: string;
      status: TenantUserSignedInByPhoneStatus;
      number: string;
      access_token: string;
      refresh_token: string;
      access_expires_at: EpochMilliseconds;
      refresh_expires_at: EpochMilliseconds;
      authenticated_at: EpochMilliseconds;
    }
  | {
      type: "network_user_tenant_key";
      id: string;
      user_id: string;
      status: NetworkUserTenantKeyStatus;
      access_token: string;
    };

export interface UserSessionResult {
  user: StorefrontUser;
  session: UserSessionIssued;
}

export interface UserCodeResult {
  user: StorefrontUser;
  session: UserSession;
  code: {
    issued_at: EpochMilliseconds;
    expires_at: EpochMilliseconds;
  };
}

export interface UserMe {
  user: StorefrontUser;
  session: UserSession;
}

export type SuppressionTypeName =
  | "email_unsubscribe"
  | "email_block"
  | "email_hard_bounce"
  | "email_complaint"
  | "sms_block"
  | "sms_opt_out";

export type UnsubscribeCause =
  | { type: "storefront"; user_session_id: string }
  | { type: "unsubscribe_link"; broadcast_id: string }
  | { type: "account"; actor: AccountActor; note: string };

export type UnsubscribeRelease =
  | { type: "storefront"; user_session_id: string }
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
  tenant_id: string;
  type: SuppressionType;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CreateUserParams {
  tenant_id: string;
  id: string;
  name?: UserName | null;
  profile: Block[];
  blocks: Block[];
  categories?: CategoryEntry[];
}

export interface UpdateUserParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  name?: UserName | null;
  profile?: Block[];
  blocks?: Block[];
  categories?: CategoryEntry[];
  addresses?: UserAddressInput[];
  default_shipping_address_id?: string | null;
  default_billing_address_id?: string | null;
}

export interface GetUserParams {
  tenant_id: string;
  id: string;
}

export interface EraseUserParams { tenant_id: string; id: string; expected_updated_at: EpochMilliseconds }

export type UserBlockAbsence = { type: "absent"; key: string };

export type UserBlockFilter = UserBlockAbsence | BlockQuery;

export interface FindUsersBySearchParams {
  tenant_id: string;
  ids?: string[];
  query?: string;
  filters?: UserBlockFilter[];
  profile_filters?: (UserBlockAbsence | Extract<BlockQuery, { type: "date" }>)[];
  verified?: boolean;
  has_user_action?: boolean;
  has_cart?: boolean;
  category_ids?: string[];
  sort_field?: "id" | "email" | "name" | "created_at" | "updated_at";
  sort_direction?: SortDirection;
  contact_email?: never;
  contact_number?: never;
  limit?: number;
  cursor?: string | null;
}

export interface FindUsersByContactEmailParams {
  tenant_id: string;
  contact_email: string;
  contact_number?: never;
  ids?: never;
  query?: never;
  filters?: never;
  profile_filters?: never;
  verified?: never;
  has_user_action?: never;
  has_cart?: never;
  category_ids?: never;
  sort_field?: never;
  sort_direction?: never;
  limit?: number;
  cursor?: string | null;
}

export interface FindUsersByContactNumberParams {
  tenant_id: string;
  contact_number: string;
  contact_email?: never;
  ids?: never;
  query?: never;
  filters?: never;
  profile_filters?: never;
  verified?: never;
  has_user_action?: never;
  has_cart?: never;
  category_ids?: never;
  sort_field?: never;
  sort_direction?: never;
  limit?: number;
  cursor?: string | null;
}

export type FindUsersParams =
  | FindUsersBySearchParams
  | FindUsersByContactEmailParams
  | FindUsersByContactNumberParams;

export interface ImportUserRow { user_id: string; profile: Block[]; blocks: Block[] }

export interface ImportUsersParams {
  tenant_id: string;
  rows: ImportUserRow[];
}

export type ImportUserPreviewOutcome =
  | { type: "create" }
  | { type: "existing" }
  | { type: "failed"; error: ApiErrorResponse };

export interface ImportUserPreviewRow {
  row: number;
  user_id: string;
  outcome: ImportUserPreviewOutcome;
}

export interface ImportUsersPreviewResult {
  rows_total: number;
  rows_to_create: number;
  rows_existing: number;
  rows_failed: number;
  rows: ImportUserPreviewRow[];
}

export type ImportUserRowOutcome =
  | { type: "created" }
  | { type: "existing" }
  | { type: "failed"; error: ApiErrorResponse };

export interface ImportUserRowResult {
  row: number;
  user_id: string;
  outcome: ImportUserRowOutcome;
}

export interface ImportUsersResult {
  rows_total: number;
  users_created: number;
  rows_existing: number;
  rows_failed: number;
  rows: ImportUserRowResult[];
}

export interface FindUserSessionsParams {
  tenant_id: string;
  user_id: string;
  limit?: number;
  cursor?: string | null;
}

export interface RevokeUserSessionParams {
  tenant_id: string;
  user_id: string;
  session_id: string;
}

export interface RevokeAllUserSessionsParams {
  tenant_id: string;
  user_id: string;
}

export interface FindSuppressionsParams {
  tenant_id: string;
  query?: string;
  type?: SuppressionTypeName;
  status?: SuppressionStatusName;
  limit?: number;
  cursor?: string | null;
}

export interface GetSuppressionParams {
  tenant_id: string;
  id: string;
}

export interface ActivateEmailSuppressionParams {
  tenant_id: string;
  id: string;
  email: string;
  note: string;
  expected_updated_at?: EpochMilliseconds;
}

export interface ActivateSmsSuppressionParams {
  tenant_id: string;
  id: string;
  number: string;
  note: string;
  expected_updated_at?: EpochMilliseconds;
}

export interface ReleaseSuppressionParams {
  tenant_id: string;
  id: string;
  note: string;
  expected_updated_at: EpochMilliseconds;
}

export interface UpdateUserMeParams {
  expected_updated_at: EpochMilliseconds;
  name?: UserName | null;
  profile?: Block[];
  addresses?: UserAddressInput[];
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

export interface MergeUserParams { tenant_id: string; id: string; target_user_id: string; expected_updated_at: EpochMilliseconds }

export interface AddUserContactParams {
  tenant_id: string;
  user_id: string;
  expected_updated_at: EpochMilliseconds;
  contact: LoginContact;
  sms?: SmsConsentChoice | null;
}

export interface UpdateUserContactParams {
  tenant_id: string;
  user_id: string;
  expected_updated_at: EpochMilliseconds;
  address: LoginAddress;
  language?: string;
  sms?: SmsConsentChoice;
}

export interface RemoveUserContactParams {
  tenant_id: string;
  user_id: string;
  expected_updated_at: EpochMilliseconds;
  address: LoginAddress;
}

export interface RemoveUserLinkParams {
  tenant_id: string;
  user_id: string;
  position: number;
  expected_updated_at: EpochMilliseconds;
}

export interface FindUserInvitesParams {
  tenant_id: string;
  user_id: string;
}

export interface InviteUserContactParams {
  tenant_id: string;
  user_id: string;
  id: string;
  address: LoginAddress;
}

export interface ExportUserParams {
  tenant_id: string;
  id: string;
}

export type UserExportPart = "booking_lines" | "entries" | "form_submissions" | "conversations" | "calls";

export type UserExportCutReason = "grant" | "size";

export interface UserExportCut {
  part: UserExportPart;
  reason: UserExportCutReason;
}

export interface UserExportEntryFile {
  media_id: string;
  link: PrivateFileLink;
}

export interface UserExportEntry {
  entry: Omit<PrivateEntry, "validation_errors">;
  files: UserExportEntryFile[];
}

export interface UserExportFormFile {
  sha256: string;
  link: FormSubmissionFileLink;
}

export interface UserExportFormSubmission {
  submission: FormSubmission;
  files: UserExportFormFile[];
}

export interface UserExportAttachment {
  conversation_message_id: string;
  sha256: string;
  link: ConversationAttachmentLink;
}

export interface UserExportRecording {
  conversation_message_id: string;
  link: CallRecordingLink;
}

export interface UserExportConversation {
  conversation: Conversation;
  messages: ConversationMessage[];
  attachments: UserExportAttachment[];
  recordings: UserExportRecording[];
}

export interface UserExport {
  user: User;
  booking_lines: OrderBookingItem[];
  entries: UserExportEntry[];
  form_submissions: UserExportFormSubmission[];
  conversations: UserExportConversation[];
  cut: UserExportCut[];
  exported_at: EpochMilliseconds;
}
