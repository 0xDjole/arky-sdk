import type { EpochMilliseconds } from "./time";
import type { FormFilter } from "./webhook";

export type NotificationType =
  | { type: "arky_sign_in"; to: string }
  | { type: "team_invite"; to: string }
  | { type: "customer_sign_in"; sender_id: string; to: string }
  | {
      type: "event_email";
      sender_id: string;
      event_id: string;
      email_template_id: string;
      to: string;
    }
  | { type: "receipt_resend"; sender_id: string; order_id: string; to: string }
  | { type: "template_test"; sender_id: string; to: string }
  | { type: "broadcast_email"; sender_id: string; broadcast_id: string; to: string }
  | { type: "support_reply"; sender_id: string; to: string }
  | {
      type: "support_auto_reply";
      sender_id: string;
      conversation_id: string;
      to: string;
    }
  | {
      type: "webhook";
      store_id: string;
      webhook_id: string;
      event_id: string;
      event_type: string;
    };

export type NotificationKind = NotificationType["type"];

export type NotificationStatus =
  | { type: "waiting" }
  | { type: "sending"; until: EpochMilliseconds; attempt: number }
  | { type: "retrying"; attempt: number; next_at: EpochMilliseconds; reason: string }
  | { type: "sent"; provider_message_id: string; sent_at: EpochMilliseconds }
  | { type: "not_sent"; reason: string; at: EpochMilliseconds }
  | { type: "maybe_sent"; at: EpochMilliseconds };

export interface Notification {
  id: string;
  type: NotificationType;
  status: NotificationStatus;
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
  | { type: "subscription_payment_failed" }
  | { type: "new_order_alert"; to: AlertRecipient[] }
  | { type: "new_return_alert"; to: AlertRecipient[] }
  | { type: "new_form_submission_alert"; forms: FormFilter; to: AlertRecipient[] };

export type EmailTypeName = EmailType["type"];

export interface EmailTemplate {
  id: string;
  store_id: string;
  type: EmailType;
  sender_id: string;
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
  | { type: "failed"; reason: string };

export interface EmailDomain {
  id: string;
  store_id: string;
  domain: string;
  provider_domain_id: string;
  records: DnsRecord[];
  status: EmailDomainStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface EmailSender {
  id: string;
  store_id: string;
  email_domain_id: string;
  local_part: string;
  from_name: string;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

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

export interface StopNotificationParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindEmailTemplatesParams {
  store_id: string;
  type?: EmailTypeName;
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
  type: EmailType;
  sender_id: string;
  content: Record<string, EmailContent>;
}

export interface UpdateEmailTemplateParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  type?: EmailType;
  sender_id?: string;
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

export interface FindEmailSendersParams {
  store_id: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetEmailSenderParams {
  store_id: string;
  id: string;
}

export interface CreateEmailSenderParams {
  store_id: string;
  id: string;
  email_domain_id: string;
  local_part: string;
  from_name: string;
}

export interface UpdateEmailSenderParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  local_part?: string;
  from_name?: string;
}

export interface DeleteEmailSenderParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}
