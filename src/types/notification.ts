import type { EpochMilliseconds } from "./time";
import type { FormFilter } from "./webhook";

export type EmailNotificationType =
  | { type: "arky_sign_in"; to: string }
  | { type: "team_invite"; to: string }
  | { type: "customer_sign_in"; sending_address_id: string; to: string }
  | {
      type: "event_email";
      sending_address_id: string;
      event_id: string;
      email_template_id: string;
      to: string;
    }
  | { type: "receipt_resend"; sending_address_id: string; order_id: string; to: string }
  | { type: "template_test"; sending_address_id: string; to: string }
  | { type: "broadcast_email"; sending_address_id: string; broadcast_id: string; to: string }
  | { type: "support_reply"; sending_address_id: string; to: string };

export interface EmailSendRecovery {
  retry_until: EpochMilliseconds;
  acceptance_uncertain: boolean;
}

export type EmailNotificationStatus =
  | { type: "waiting" }
  | { type: "sending"; attempt: number; until: EpochMilliseconds; recovery: EmailSendRecovery }
  | { type: "retrying"; attempt: number; next_at: EpochMilliseconds; reason: string; recovery: EmailSendRecovery }
  | { type: "sent"; provider_email_id: string; sent_at: EpochMilliseconds }
  | { type: "not_sent"; reason: string; at: EpochMilliseconds }
  | { type: "maybe_sent"; at: EpochMilliseconds };

export type WebhookNotificationStatus =
  | { type: "waiting" }
  | { type: "sending"; attempt: number; until: EpochMilliseconds }
  | { type: "retrying"; attempt: number; next_at: EpochMilliseconds; reason: string }
  | { type: "acknowledged"; at: EpochMilliseconds }
  | { type: "unacknowledged"; reason: string; at: EpochMilliseconds };

export type NotificationType =
  | {
      type: "email";
      email_type: EmailNotificationType;
      send_before: EpochMilliseconds | null;
      status: EmailNotificationStatus;
    }
  | {
      type: "webhook";
      store_id: string;
      webhook_id: string;
      event_id: string;
      event_type: string;
      status: WebhookNotificationStatus;
    };

export type NotificationKind = EmailNotificationType["type"] | "webhook";

export interface Notification {
  id: string;
  type: NotificationType;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface EmailContent {
  subject: string;
  preheader: string | null;
  body: string;
}

export type AlertRecipient =
  | { type: "store_role"; store_role_id: string; language: string }
  | { type: "email"; email: string; language: string };

export type EmailType =
  | { type: "sign_in_code" }
  | { type: "order_received" }
  | { type: "order_dispatched" }
  | { type: "order_delivered" }
  | { type: "order_ready_for_pickup" }
  | { type: "order_cancelled" }
  | { type: "order_refunded" }
  | { type: "first_order_placed" }
  | { type: "booking_confirmed" }
  | { type: "booking_reminder" }
  | { type: "cart_sent" }
  | { type: "cart_revised" }
  | { type: "cart_reminder"; after_days: number }
  | { type: "form_received"; forms: FormFilter }
  | { type: "form_stage_changed"; form_id: string; stage_id: string }
  | { type: "company_access" }
  | { type: "return_requested" }
  | { type: "return_approved" }
  | { type: "return_declined" }
  | { type: "renewal_upcoming"; days_before: number }
  | { type: "renewal_payment_failed" }
  | { type: "email_changed" }
  | { type: "new_order_alert"; to: AlertRecipient[] }
  | { type: "new_return_alert"; to: AlertRecipient[] }
  | { type: "new_form_submission_alert"; forms: FormFilter; to: AlertRecipient[] };

export type EmailTypeName = EmailType["type"];

export type EmailTemplateType =
  | { type: "transactional"; sending_address_id: string; email_type: EmailType }
  | { type: "support_reply" };

export type EmailTemplateTypeName = EmailTemplateType["type"];

export interface EmailTemplate {
  id: string;
  store_id: string;
  type: EmailTemplateType;
  content: Record<string, EmailContent>;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface EmailTemplateDefault {
  type: EmailType;
  content: EmailContent;
}

export interface EmailTemplatePreview {
  language: string;
  subject: string;
  html: string;
  text: string;
}

export type DnsRecordType =
  | { type: "txt" }
  | { type: "mx"; priority: number }
  | { type: "cname" };

export interface DnsRecord {
  type: DnsRecordType;
  name: string;
  value: string;
}

export type EmailDomainStatus =
  | { type: "pending" }
  | { type: "verified"; verified_at: EpochMilliseconds }
  | { type: "failed"; reason: string }
  | { type: "deleting" };

export interface EmailDomain {
  id: string;
  store_id: string;
  domain: string;
  provider_domain_id: string | null;
  records: DnsRecord[];
  status: EmailDomainStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface EmailAddressSending {
  email_domain_id: string;
  from_name: string;
  reply_to: string;
}

export interface EmailAddressReceiving {
  forwarding_email: string;
  initial_sending_address_id: string | null;
  initial_flow_id: string | null;
}

export type EmailAddressStatus = "active" | "archived";

export interface EmailAddress {
  id: string;
  store_id: string;
  email: string;
  sending: EmailAddressSending | null;
  receiving: EmailAddressReceiving | null;
  status: EmailAddressStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface EmailAddressReceivingInput {
  initial_sending_address_id: string | null;
  initial_flow_id: string | null;
}

export type EmailFailureKind = "hard_bounce" | "soft_bounce" | "rejected" | "other";

export interface EmailFailure {
  kind: EmailFailureKind;
  reason: string;
}

export type EmailDeliveryReport =
  | { type: "delivered"; at: EpochMilliseconds }
  | { type: "delayed"; reason: string | null; at: EpochMilliseconds }
  | { type: "bounced"; failure: EmailFailure; at: EpochMilliseconds }
  | { type: "failed"; reason: string; at: EpochMilliseconds };

export interface FindNotificationsParams {
  store_id: string;
  to?: string;
  type?: NotificationKind;
  webhook_id?: string;
  order_id?: string;
  broadcast_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetNotificationParams {
  store_id: string;
  id: string;
}

export interface FindEmailTemplatesParams {
  store_id: string;
  type?: EmailTemplateTypeName;
  email_type?: EmailTypeName;
  limit?: number;
  cursor?: string | null;
}

export interface GetEmailTemplateParams {
  store_id: string;
  id: string;
}

export interface FindEmailTemplateDefaultsParams {
  store_id: string;
}

export interface CreateEmailTemplateParams {
  store_id: string;
  id: string;
  type: EmailTemplateType;
  content: Record<string, EmailContent>;
}

export interface UpdateEmailTemplateParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  type?: EmailTemplateType;
  content?: Record<string, EmailContent>;
}

export interface DeleteEmailTemplateParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface PreviewEmailTemplateParams {
  store_id: string;
  id: string;
  language: string;
  content?: EmailContent;
}

export interface SendEmailTemplateTestParams {
  store_id: string;
  id: string;
  notification_id: string;
  language: string;
  sending_address_id?: string;
}

export interface FindEmailDomainsParams {
  store_id: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetEmailDomainParams {
  store_id: string;
  id: string;
}

export interface CreateEmailDomainParams {
  store_id: string;
  id: string;
  domain: string;
}

export interface VerifyEmailDomainParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface DeleteEmailDomainParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindEmailAddressesParams {
  store_id: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetEmailAddressParams {
  store_id: string;
  id: string;
}

export interface CreateEmailAddressParams {
  store_id: string;
  id: string;
  email: string;
  sending?: EmailAddressSending;
  receiving?: EmailAddressReceivingInput;
}

export interface UpdateEmailAddressParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  sending?: EmailAddressSending;
  receiving?: EmailAddressReceivingInput;
}

export interface ChangeEmailAddressStatusParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface DeleteEmailAddressParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}
