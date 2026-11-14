import type { EpochMilliseconds } from "./time";
import type { ProviderLogin } from "./common";
import type { IncomingWebhookResolution, IncomingWebhookStatusName } from "./payment";

export type OutgoingMessageTypeName =
  | "network_sign_in_email"
  | "customer_sign_in_email"
  | "customer_invite_email"
  | "store_admin_sign_in_email"
  | "store_admin_invite_email"
  | "event_email"
  | "event_sms"
  | "form_received_email"
  | "form_stage_changed_email"
  | "form_submission_alert_email"
  | "booking_reminder_email"
  | "booking_reminder_sms"
  | "booking_recall_email"
  | "booking_recall_sms"
  | "after_visit_email"
  | "after_visit_sms"
  | "receipt_resend_email"
  | "broadcast_email"
  | "broadcast_sms"
  | "template_test_email"
  | "support_reply_email"
  | "support_reply_sms"
  | "customer_sign_in_sms"
  | "customer_invite_sms";

export type OutgoingMessageType =
  | { type: "network_sign_in_email"; network_id: string; network_provider_id: string }
  | { type: "customer_sign_in_email"; notification_id: string; email_address_id: string }
  | { type: "customer_invite_email"; notification_id: string; email_address_id: string }
  | { type: "store_admin_sign_in_email"; notification_id: string; email_address_id: string }
  | { type: "store_admin_invite_email"; notification_id: string; email_address_id: string }
  | { type: "event_email"; notification_id: string; email_address_id: string; event_id: string }
  | {
      type: "event_sms";
      notification_id: string;
      event_id: string;
      store_id: string;
      customer_id: string;
      language: string;
    }
  | { type: "form_received_email"; form_id: string; email_address_id: string; event_id: string }
  | { type: "form_stage_changed_email"; form_id: string; email_address_id: string; event_id: string }
  | { type: "form_submission_alert_email"; form_id: string; email_address_id: string; event_id: string }
  | {
      type: "booking_reminder_email";
      notification_id: string;
      email_address_id: string;
      order_id: string;
      order_booking_line_item_id: string;
      starts_at: EpochMilliseconds;
    }
  | {
      type: "booking_reminder_sms";
      notification_id: string;
      order_id: string;
      order_booking_line_item_id: string;
      starts_at: EpochMilliseconds;
      store_id: string;
      customer_id: string;
      language: string;
    }
  | {
      type: "booking_recall_email";
      notification_id: string;
      email_address_id: string;
      order_id: string;
      order_booking_line_item_id: string;
    }
  | {
      type: "booking_recall_sms";
      notification_id: string;
      order_id: string;
      order_booking_line_item_id: string;
      store_id: string;
      customer_id: string;
      language: string;
    }
  | {
      type: "after_visit_email";
      notification_id: string;
      email_address_id: string;
      order_id: string;
      order_booking_line_item_id: string;
    }
  | {
      type: "after_visit_sms";
      notification_id: string;
      order_id: string;
      order_booking_line_item_id: string;
      store_id: string;
      customer_id: string;
      language: string;
    }
  | { type: "receipt_resend_email"; notification_id: string; email_address_id: string; order_id: string }
  | { type: "broadcast_email"; broadcast_id: string; email_address_id: string }
  | { type: "broadcast_sms"; broadcast_id: string; store_id: string; customer_id: string; language: string }
  | { type: "template_test_email"; email_address_id: string }
  | { type: "support_reply_email"; email_address_id: string }
  | { type: "support_reply_sms"; store_id: string; customer_id: string; language: string }
  | { type: "customer_sign_in_sms"; notification_id: string; store_id: string; customer_id: string; language: string }
  | { type: "customer_invite_sms"; notification_id: string; store_id: string; customer_id: string; language: string };

export interface OutgoingEmailRecovery {
  retry_until: EpochMilliseconds;
  acceptance_uncertain: boolean;
}

export type SmsDelivery =
  | { type: "pending" }
  | { type: "delivered"; at: EpochMilliseconds }
  | { type: "failed"; code: string; at: EpochMilliseconds };

export type SmsNotSentReason =
  | { type: "no_consent" }
  | { type: "suppressed" }
  | { type: "no_text" }
  | { type: "template_failed" }
  | { type: "sender_unavailable" }
  | { type: "store_unavailable" }
  | { type: "expired" }
  | { type: "provider_rejected"; code: string };

export type OutgoingMessageStatus =
  | { type: "waiting" }
  | { type: "sending"; attempt: number; until: EpochMilliseconds; recovery: OutgoingEmailRecovery }
  | { type: "retrying"; attempt: number; next_at: EpochMilliseconds; reason: string; recovery: OutgoingEmailRecovery }
  | { type: "sent"; provider_email_id: string; sent_at: EpochMilliseconds }
  | { type: "not_sent"; reason: string; at: EpochMilliseconds }
  | { type: "maybe_sent"; at: EpochMilliseconds }
  | { type: "sms_waiting"; login: ProviderLogin }
  | { type: "sms_sending"; login: ProviderLogin; deadline_at: EpochMilliseconds }
  | { type: "sms_accepted"; login: ProviderLogin; message_sid: string; at: EpochMilliseconds; delivery: SmsDelivery }
  | { type: "sms_not_sent"; reason: SmsNotSentReason; at: EpochMilliseconds }
  | { type: "sms_unknown"; login: ProviderLogin; at: EpochMilliseconds };

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
  | { type: "failed"; reason: string; at: EpochMilliseconds }
  | { type: "suppressed"; reason: string; at: EpochMilliseconds };

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

export interface OutgoingMessageSummary {
  id: string;
  type: OutgoingMessageType;
  to: string | null;
  delivery_report: EmailDeliveryReport | null;
  complained_at: EpochMilliseconds | null;
  preview: EmailPreviewSummary | null;
  send_before: EpochMilliseconds | null;
  status: OutgoingMessageStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface OutgoingMessage {
  id: string;
  type: OutgoingMessageType;
  to: string | null;
  delivery_report: EmailDeliveryReport | null;
  complained_at: EpochMilliseconds | null;
  preview: EmailPreview | null;
  send_before: EpochMilliseconds | null;
  status: OutgoingMessageStatus;
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

export interface Email {
  email_template_id: string;
  email_address_id: string;
  from_name: string;
  reply_to_address_id: string;
}

export type AlertRecipient =
  | { type: "store_role"; store_role_id: string; language: string }
  | { type: "email"; email: string; language: string };

export type EmailTemplateTypeName =
  | "customer_sign_in"
  | "customer_invite"
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
  | "booking_recall"
  | "after_visit"
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
  | "form_submission_alert"
  | "order_alert"
  | "return_alert"
  | "conversation_message_alert"
  | "conversation_message_notice"
  | "result_shared"
  | "booking_cancelled_alert"
  | "booking_moved_alert"
  | "entry_added_alert"
  | "daily_overview_alert"
  | "support_message"
  | "broadcast";

export type EmailTemplateType = { type: EmailTemplateTypeName };

export type SmsTemplateTypeName =
  | "customer_sign_in"
  | "customer_invite"
  | "booking_confirmed"
  | "booking_reminder"
  | "booking_cancelled"
  | "booking_recall"
  | "after_visit"
  | "conversation_message_notice"
  | "result_shared"
  | "broadcast";

export type SmsTemplateType = { type: SmsTemplateTypeName };

export type TemplateKind = "email" | "sms";

export type TemplateType =
  | {
      type: "email";
      purpose: EmailTemplateType;
      default_language: string;
      content: Record<string, EmailContent>;
      layout_id: string;
    }
  | { type: "sms"; purpose: SmsTemplateType; content: Record<string, string> };

export interface Template {
  id: string;
  store_id: string;
  key: string;
  name: string;
  type: TemplateType;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type TemplateStarter =
  | { type: "email"; purpose: EmailTemplateType; content: EmailContent }
  | { type: "sms"; purpose: SmsTemplateType; text: string };

export interface TemplateDefault {
  key: string;
  name: string;
  type: TemplateStarter;
  allowed_fields: string[];
  list_fields: string[];
}

export type TemplatePreview =
  | { type: "email"; language: string; subject: string; html: string; text: string }
  | { type: "sms"; language: string; text: string };

export type TemplatePreviewContent =
  | { type: "email"; content: EmailContent }
  | { type: "sms"; text: string };

export type TemplateContentChange =
  | {
      type: "email";
      default_language?: string;
      layout_id?: string;
      content?: Record<string, EmailContent>;
    }
  | { type: "sms"; content: Record<string, string> };

export type NotificationTypeName =
  | "customer_sign_in"
  | "customer_sign_in_sms"
  | "customer_invite_email"
  | "customer_invite_sms"
  | "store_admin_sign_in"
  | "customer_email_verification"
  | "email_changed"
  | "store_admin_invite"
  | "company_invite"
  | "company_access_notice"
  | "order_received"
  | "first_order_placed"
  | "order_dispatched"
  | "order_delivered"
  | "order_ready_for_pickup"
  | "order_cancelled"
  | "order_refunded"
  | "offer_sent"
  | "offer_revised"
  | "offer_reminder"
  | "return_requested"
  | "return_approved"
  | "return_declined"
  | "renewal_upcoming"
  | "renewal_payment_failed"
  | "membership_cancelled"
  | "booking_confirmed_email"
  | "booking_confirmed_sms"
  | "booking_cancelled_email"
  | "booking_cancelled_sms"
  | "conversation_message_notice_email"
  | "conversation_message_notice_sms"
  | "result_shared_email"
  | "result_shared_sms"
  | "booking_reminder_email"
  | "booking_reminder_sms"
  | "booking_recall_email"
  | "booking_recall_sms"
  | "after_visit_email"
  | "after_visit_sms"
  | "order_alert"
  | "return_alert"
  | "conversation_message_alert"
  | "booking_cancelled_alert"
  | "booking_moved_alert"
  | "entry_added_alert"
  | "daily_overview_alert";

export type NotificationServices =
  | { type: "all" }
  | { type: "only"; booking_service_ids: string[] };

export type NotificationType =
  | { type: "customer_sign_in"; email: Email }
  | { type: "customer_sign_in_sms"; sms_template_id: string }
  | { type: "customer_invite_email"; email: Email }
  | { type: "customer_invite_sms"; sms_template_id: string }
  | { type: "store_admin_sign_in"; email: Email }
  | { type: "customer_email_verification"; email: Email }
  | { type: "email_changed"; email: Email }
  | { type: "store_admin_invite"; email: Email }
  | { type: "company_invite"; email: Email }
  | { type: "company_access_notice"; email: Email }
  | { type: "order_received"; email: Email }
  | { type: "first_order_placed"; email: Email }
  | { type: "order_dispatched"; email: Email }
  | { type: "order_delivered"; email: Email }
  | { type: "order_ready_for_pickup"; email: Email }
  | { type: "order_cancelled"; email: Email }
  | { type: "order_refunded"; email: Email }
  | { type: "offer_sent"; email: Email }
  | { type: "offer_revised"; email: Email }
  | { type: "offer_reminder"; email: Email; after_days: number }
  | { type: "return_requested"; email: Email }
  | { type: "return_approved"; email: Email }
  | { type: "return_declined"; email: Email }
  | { type: "renewal_upcoming"; email: Email }
  | { type: "renewal_payment_failed"; email: Email }
  | { type: "membership_cancelled"; email: Email }
  | { type: "booking_confirmed_email"; email: Email }
  | { type: "booking_confirmed_sms"; sms_template_id: string }
  | { type: "booking_cancelled_email"; email: Email }
  | { type: "booking_cancelled_sms"; sms_template_id: string }
  | { type: "conversation_message_notice_email"; email: Email }
  | { type: "conversation_message_notice_sms"; sms_template_id: string }
  | { type: "result_shared_email"; email: Email }
  | { type: "result_shared_sms"; sms_template_id: string }
  | { type: "booking_reminder_email"; email: Email; minutes_before: number; services: NotificationServices }
  | { type: "booking_reminder_sms"; sms_template_id: string; minutes_before: number; services: NotificationServices }
  | { type: "booking_recall_email"; email: Email; days_after_visit: number; services: NotificationServices }
  | { type: "booking_recall_sms"; sms_template_id: string; days_after_visit: number; services: NotificationServices }
  | { type: "after_visit_email"; email: Email; minutes_after: number; services: NotificationServices }
  | { type: "after_visit_sms"; sms_template_id: string; minutes_after: number; services: NotificationServices }
  | { type: "order_alert"; email: Email; recipients: AlertRecipient[] }
  | { type: "return_alert"; email: Email; recipients: AlertRecipient[] }
  | { type: "conversation_message_alert"; email: Email; recipients: AlertRecipient[] }
  | { type: "booking_cancelled_alert"; email: Email; recipients: AlertRecipient[] }
  | { type: "booking_moved_alert"; email: Email; recipients: AlertRecipient[] }
  | { type: "entry_added_alert"; collections: AlertCollections; email: Email; recipients: AlertRecipient[] }
  | { type: "daily_overview_alert"; at_minute: number; email: Email; recipients: AlertRecipient[] };

export type AlertCollections = { type: "all" } | { type: "only"; collection_ids: string[] };

export type NotificationStatus = { type: "active"; since: EpochMilliseconds } | { type: "paused" };

export type ReminderSkipReason = "no_contact" | "no_consent" | "suppressed" | "not_set_up" | "expired";

export type ReminderResult =
  | { type: "sent"; outgoing_message_ids: string[] }
  | { type: "skipped"; reason: ReminderSkipReason };

export type NotificationSwitch = "active" | "paused";

export interface SendBookingReminderParams {
  store_id: string;
  order_id: string;
  order_booking_item_id: string;
  notification_id: string;
}

export interface Notification {
  id: string;
  store_id: string;
  type: NotificationType;
  status: NotificationStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
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

export interface EmailAddress {
  id: string;
  store_id: string;
  login: ProviderLogin;
  email: string;
}

export type ProviderLoginInput = { type: "store"; store_provider_id: string } | { type: "network" };

export type NetworkStoreAddresses = { type: "off" } | { type: "domain"; domain: string };

export type EmailReadinessReason =
  | "domain_absent"
  | "sending_disabled"
  | "sending_unverified"
  | "receiving_disabled"
  | "receiving_unverified"
  | "webhook_missing"
  | "webhook_duplicated"
  | "webhook_disabled"
  | "webhook_events_missing"
  | "webhook_secret_mismatch"
  | "webhook_changed"
  | "provider_refused"
  | "daily_quota_used_up"
  | "monthly_quota_used_up"
  | "rate_limited"
  | "no_answer"
  | "request_not_built";

export type EmailCapabilityReadiness =
  | { type: "ready" }
  | { type: "unavailable"; reason: EmailReadinessReason }
  | { type: "check_failed"; reason: EmailReadinessReason };

export interface EmailAddressReadiness {
  sending: EmailCapabilityReadiness;
  receiving: EmailCapabilityReadiness;
}

interface FindOutgoingMessagesFilters {
  store_id: string;
  to?: string;
  broadcast_id?: string;
  limit?: number;
  cursor?: string | null;
}

export type FindOutgoingMessagesParams =
  | (FindOutgoingMessagesFilters & { type?: OutgoingMessageTypeName; order_id?: never })
  | (FindOutgoingMessagesFilters & { type: "receipt_resend_email"; order_id: string });

export interface GetOutgoingMessageParams {
  store_id: string;
  id: string;
}

export interface FindOutgoingWebhooksParams {
  store_id: string;
  webhook_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetOutgoingWebhookParams {
  store_id: string;
  id: string;
}

interface FindTemplatesPage {
  store_id: string;
  limit?: number;
  cursor?: string | null;
}

export type FindTemplatesParams =
  | (FindTemplatesPage & { kind?: never; purpose?: never })
  | (FindTemplatesPage & { kind: "email"; purpose?: EmailTemplateTypeName })
  | (FindTemplatesPage & { kind: "sms"; purpose?: SmsTemplateTypeName });

export interface GetTemplateParams {
  store_id: string;
  id: string;
}

export interface FindTemplateDefaultsParams {
  store_id: string;
}

export interface CreateTemplateParams {
  store_id: string;
  id: string;
  key: string;
  name: string;
  type: TemplateType;
}

export interface UpdateTemplateParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key?: string;
  name?: string;
  content?: TemplateContentChange;
}

export interface DeleteTemplateParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface PreviewTemplateParams {
  store_id: string;
  id: string;
  language: string;
  layout_id?: string;
  content?: TemplatePreviewContent;
}

export interface SendEmailTemplateTestParams {
  store_id: string;
  id: string;
  outgoing_message_id: string;
  language: string;
  email_address_id: string;
  from_name: string;
  reply_to_address_id: string;
}

export interface FindNotificationsParams {
  store_id: string;
  type?: NotificationTypeName;
  limit?: number;
  cursor?: string | null;
}

export interface GetNotificationParams {
  store_id: string;
  id: string;
}

export interface CreateNotificationParams {
  store_id: string;
  id: string;
  type: NotificationType;
  status: NotificationSwitch;
}

export interface UpdateNotificationParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  type: NotificationType;
  status: NotificationSwitch;
}

export interface DeleteNotificationParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
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
  login: ProviderLoginInput;
}

export interface DeleteEmailAddressParams {
  store_id: string;
  id: string;
}

export interface GetEmailAddressReadinessParams {
  store_id: string;
  id: string;
}

export interface GetEmailAddressNetworkDomainParams {
  store_id: string;
}

interface FindStoreResendEventsFilters {
  store_id: string;
  status: IncomingWebhookStatusName;
  limit?: number;
  cursor?: string | null;
}

export type FindStoreResendEventsParams =
  | (FindStoreResendEventsFilters & { store_provider_id: string; network_provider_id?: never })
  | (FindStoreResendEventsFilters & { network_provider_id: string; store_provider_id?: never });

export interface ResolveStoreResendEventParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  resolution: IncomingWebhookResolution;
  reason?: string | null;
}
