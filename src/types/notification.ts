import type { EpochMilliseconds } from "./time";
import type { IncomingWebhookResolution, IncomingWebhookStatusName } from "./payment";

export type OutgoingEmailType =
  | { type: "arky_sign_in" }
  | { type: "customer_sign_in"; sending_address_id: string }
  | { type: "store_admin_sign_in"; sending_address_id: string }
  | { type: "store_admin_invite"; sending_address_id: string }
  | {
      type: "event_email";
      sending_address_id: string;
      event_id: string;
      email_template_id: string;
    }
  | { type: "receipt_resend"; sending_address_id: string; order_id: string }
  | { type: "template_test"; sending_address_id: string }
  | { type: "broadcast_email"; sending_address_id: string; broadcast_id: string }
  | { type: "support_reply"; sending_address_id: string };

export interface OutgoingEmailRecovery {
  retry_until: EpochMilliseconds;
  acceptance_uncertain: boolean;
}

export type OutgoingEmailStatus =
  | { type: "waiting" }
  | { type: "sending"; attempt: number; until: EpochMilliseconds; recovery: OutgoingEmailRecovery }
  | { type: "retrying"; attempt: number; next_at: EpochMilliseconds; reason: string; recovery: OutgoingEmailRecovery }
  | { type: "sent"; provider_email_id: string; sent_at: EpochMilliseconds }
  | { type: "not_sent"; reason: string; at: EpochMilliseconds }
  | { type: "maybe_sent"; at: EpochMilliseconds };

export type OutgoingWebhookStatus =
  | { type: "waiting" }
  | { type: "sending"; attempt: number; until: EpochMilliseconds }
  | { type: "retrying"; attempt: number; next_at: EpochMilliseconds; reason: string }
  | { type: "acknowledged"; at: EpochMilliseconds }
  | { type: "unacknowledged"; reason: string; at: EpochMilliseconds };

export type EmailFailureType = "hard_bounce" | "soft_bounce" | "rejected" | "other";

export interface EmailFailure {
  type: EmailFailureType;
  reason: string;
}

export type EmailDeliveryReport =
  | { type: "delivered"; at: EpochMilliseconds }
  | { type: "delayed"; reason: string | null; at: EpochMilliseconds }
  | { type: "bounced"; failure: EmailFailure; at: EpochMilliseconds }
  | { type: "failed"; reason: string; at: EpochMilliseconds };

export interface EmailPreviewSummary {
  from_email: string;
  from_name: string;
  reply_to_email: string;
  rendered_language: string;
  subject: string;
}

export interface EmailPreview extends EmailPreviewSummary {
  html: string;
  text: string;
}

export interface OutgoingEmailSummary {
  id: string;
  type: OutgoingEmailType;
  to: string | null;
  email_provider_id: string | null;
  delivery_report: EmailDeliveryReport | null;
  complained_at: EpochMilliseconds | null;
  preview: EmailPreviewSummary | null;
  send_before: EpochMilliseconds | null;
  status: OutgoingEmailStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface OutgoingEmail {
  id: string;
  type: OutgoingEmailType;
  to: string | null;
  email_provider_id: string | null;
  delivery_report: EmailDeliveryReport | null;
  complained_at: EpochMilliseconds | null;
  preview: EmailPreview | null;
  send_before: EpochMilliseconds | null;
  status: OutgoingEmailStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface OutgoingWebhook {
  id: string;
  store_id: string;
  webhook_id: string;
  event_id: string;
  event_type: string;
  status: OutgoingWebhookStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface EmailContent {
  subject: string;
  preheader: string | null;
  html: string;
  text: string;
}

export interface EmailLayoutContent {
  html: string;
  text: string;
}

export type EmailReplyTo =
  | { type: "address"; email_address_id: string }
  | { type: "external"; email: string };

export interface Email {
  email_template_id: string;
  sending_address_id: string;
  from_name: string;
  reply_to: EmailReplyTo;
}

export type AlertRecipient =
  | { type: "store_role"; store_role_id: string; language: string }
  | { type: "email"; email: string; language: string };

export type EmailTemplateTypeName =
  | "customer_sign_in"
  | "store_admin_sign_in"
  | "customer_email_verification"
  | "email_changed"
  | "order_received"
  | "first_order_placed"
  | "order_dispatched"
  | "order_delivered"
  | "order_ready_for_pickup"
  | "order_cancelled"
  | "order_refunded"
  | "booking_confirmed"
  | "booking_reminder"
  | "booking_cancelled"
  | "offer_sent"
  | "offer_revised"
  | "offer_reminder"
  | "company_invite"
  | "company_access_notice"
  | "store_admin_invite"
  | "return_requested"
  | "return_approved"
  | "return_declined"
  | "renewal_upcoming"
  | "renewal_payment_failed"
  | "membership_cancelled"
  | "form_received"
  | "form_stage_changed"
  | "new_form_submission_alert"
  | "new_order_alert"
  | "new_return_alert"
  | "new_conversation_message_alert"
  | "support_message"
  | "broadcast";

export type EmailTemplateType = { type: EmailTemplateTypeName };

export interface EmailCreationTemplates {
  form_received: string;
  form_stage_changed: string;
  new_form_submission_alert: string;
  support_message: string;
  broadcast: string;
}

export interface StoreEmailSettings {
  customer_sign_in: Email | null;
  store_admin_sign_in: Email | null;
  customer_email_verification: Email | null;
  email_changed: Email | null;
  order_received: Email | null;
  first_order_placed: Email | null;
  order_dispatched: Email | null;
  order_delivered: Email | null;
  order_ready_for_pickup: Email | null;
  order_cancelled: Email | null;
  order_refunded: Email | null;
  booking_confirmed: Email | null;
  booking_reminder: Email | null;
  booking_cancelled: Email | null;
  offer_sent: Email | null;
  offer_revised: Email | null;
  offer_reminder: Email | null;
  company_invite: Email | null;
  company_access_notice: Email | null;
  store_admin_invite: Email | null;
  return_requested: Email | null;
  return_approved: Email | null;
  return_declined: Email | null;
  renewal_upcoming: Email | null;
  renewal_payment_failed: Email | null;
  membership_cancelled: Email | null;
  new_order_alert: Email | null;
  new_return_alert: Email | null;
  new_conversation_message_alert: Email | null;
  offer_reminder_after_days: number;
  new_order_alert_recipients: AlertRecipient[];
  new_return_alert_recipients: AlertRecipient[];
  new_conversation_message_alert_recipients: AlertRecipient[];
  creation_templates: EmailCreationTemplates;
}

export interface StoreEmails extends StoreEmailSettings {
  id: string;
  store_id: string;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface GetStoreEmailsParams {
  store_id: string;
}

export interface UpdateStoreEmailsParams extends StoreEmailSettings {
  store_id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface EmailTemplate {
  id: string;
  store_id: string;
  key: string;
  name: string;
  default_language: string;
  layout_id: string;
  type: EmailTemplateType;
  content: Record<string, EmailContent>;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface EmailTemplateDefault {
  key: string;
  name: string;
  type: EmailTemplateType;
  content: EmailContent;
  allowed_fields: string[];
}

export interface EmailTemplatePreview {
  language: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailLayout {
  id: string;
  store_id: string;
  key: string;
  name: string;
  logo_media_id: string | null;
  content: Record<string, EmailLayoutContent>;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface EmailProvider {
  id: string;
  store_id: string;
  name: string;
  type: { type: "resend"; webhook_id: string };
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type EmailProviderSetupProblem =
  | { type: "webhook_missing" }
  | { type: "webhook_duplicated"; webhook_ids: string[] }
  | { type: "webhook_secret_mismatch" }
  | { type: "webhook_disabled" }
  | { type: "webhook_events_missing"; events: string[] };

export interface EmailProviderSetup {
  webhook_address: string;
  events: string[];
  webhook_id: string | null;
  problems: EmailProviderSetupProblem[];
}

export type EmailProviderDomainStatus =
  | "not_started"
  | "pending"
  | "verified"
  | "partially_verified"
  | "partially_failed"
  | "failed"
  | "temporary_failure";

export interface EmailProviderDnsRecord {
  record: string;
  status: string;
  type: string;
  name: string;
  value: string;
  priority: number | null;
}

export interface EmailProviderDomain {
  id: string;
  name: string;
  status: EmailProviderDomainStatus;
  records: EmailProviderDnsRecord[];
  sending_enabled: boolean;
  receiving_enabled: boolean;
}

export interface EmailAddress {
  id: string;
  store_id: string;
  email_provider_id: string;
  email: string;
}

export type EmailCapabilityReadiness =
  | { type: "ready" }
  | { type: "unavailable"; reason: string }
  | { type: "check_failed"; reason: string };

export interface EmailAddressReadiness {
  sending: EmailCapabilityReadiness;
  receiving: EmailCapabilityReadiness;
}

interface FindOutgoingEmailsFilters {
  store_id: string;
  to?: string;
  broadcast_id?: string;
  limit?: number;
  cursor?: string | null;
}

export type FindOutgoingEmailsParams =
  | (FindOutgoingEmailsFilters & { type?: OutgoingEmailType["type"]; order_id?: never })
  | (FindOutgoingEmailsFilters & { type: "receipt_resend"; order_id: string });

export interface FindOutgoingWebhooksParams {
  store_id: string;
  webhook_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetOutgoingEmailParams {
  store_id: string;
  id: string;
}

export interface GetOutgoingWebhookParams {
  store_id: string;
  id: string;
}

export interface FindEmailTemplatesParams {
  store_id: string;
  type?: EmailTemplateTypeName;
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
  key: string;
  name: string;
  default_language: string;
  layout_id: string;
  type: EmailTemplateType;
  content: Record<string, EmailContent>;
}

export interface UpdateEmailTemplateParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key?: string;
  name?: string;
  default_language?: string;
  layout_id?: string;
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
  outgoing_email_id: string;
  language: string;
  sending_address_id: string;
  from_name: string;
  reply_to: EmailReplyTo;
}

export interface FindEmailLayoutsParams {
  store_id: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetEmailLayoutParams {
  store_id: string;
  id: string;
}

export interface CreateEmailLayoutParams {
  store_id: string;
  id: string;
  key: string;
  name: string;
  logo_media_id?: string | null;
  content: Record<string, EmailLayoutContent>;
}

export interface UpdateEmailLayoutParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key: string;
  name: string;
  logo_media_id: string | null;
  content: Record<string, EmailLayoutContent>;
}

export interface DeleteEmailLayoutParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindEmailProvidersParams {
  store_id: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetEmailProviderParams {
  store_id: string;
  id: string;
}

export interface ConnectEmailProviderParams {
  store_id: string;
  id: string;
  name: string;
  api_key: string;
  webhook_secret: string;
}

export interface ReplaceEmailProviderKeyParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  api_key: string;
  webhook_secret: string;
}

export interface DeleteEmailProviderParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindEmailProviderDomainsParams {
  store_id: string;
  id: string;
}

export interface CheckEmailProviderSetupParams {
  store_id: string;
  id: string;
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
  email_provider_id: string;
}

export interface DeleteEmailAddressParams {
  store_id: string;
  id: string;
}

export interface GetEmailAddressReadinessParams {
  store_id: string;
  id: string;
}

export interface FindStoreResendEventsParams {
  store_id: string;
  email_provider_id: string;
  status: IncomingWebhookStatusName;
  limit?: number;
  cursor?: string | null;
}

export interface ResolveStoreResendEventParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  resolution: IncomingWebhookResolution;
  reason?: string | null;
}
