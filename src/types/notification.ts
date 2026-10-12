import type { EpochMilliseconds } from "./time";

export type OutgoingEmailType =
  | { type: "arky_sign_in" }
  | { type: "team_invite" }
  | { type: "customer_sign_in"; sending_address_id: string }
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

export interface OutgoingEmail {
  id: string;
  type: OutgoingEmailType;
  to: string;
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
  body: string;
}

export type AlertRecipient =
  | { type: "store_role"; store_role_id: string; language: string }
  | { type: "email"; email: string; language: string };

export type EmailTemplateTypeName = "sign_in_code" | "email_change" | "order" | "fulfillment" | "booking" | "offer" | "form" | "company_invite" | "return" | "renewal" | "membership_cancellation" | "support_reply";
export type EmailTemplateType = { type: EmailTemplateTypeName };

export interface Email { email_template_id: string }
export interface TimedEmail { email_template_id: string; days: number }
export interface AlertEmail { email_template_id: string; to: AlertRecipient[] }

export interface StoreEmailSettings {
  sending_address_id: string | null;
  sign_in_code: Email | null;
  email_changed: Email | null;
  order_received: Email | null;
  order_dispatched: Email | null;
  order_delivered: Email | null;
  order_ready_for_pickup: Email | null;
  order_cancelled: Email | null;
  order_refunded: Email | null;
  first_order_placed: Email | null;
  booking_confirmed: Email | null;
  booking_reminder: Email | null;
  booking_cancelled: Email | null;
  offer_sent: Email | null;
  offer_reminder: TimedEmail | null;
  company_invite: Email | null;
  return_requested: Email | null;
  return_approved: Email | null;
  return_declined: Email | null;
  renewal_upcoming: Email | null;
  renewal_payment_failed: Email | null;
  membership_cancelled: Email | null;
  new_order_alert: AlertEmail | null;
  new_return_alert: AlertEmail | null;
}

export interface StoreEmails extends StoreEmailSettings {
  id: string;
  store_id: string;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface GetStoreEmailsParams { store_id: string }
export interface UpdateStoreEmailsParams extends StoreEmailSettings { store_id: string; expected_updated_at: EpochMilliseconds }

export interface EmailTemplate {
  id: string;
  store_id: string;
  key: string;
  type: EmailTemplateType;
  content: Record<string, EmailContent>;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface EmailTemplateDefault {
  key: string;
  type: EmailTemplateType;
  content: EmailContent;
}

export interface EmailTemplatePreview {
  language: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailProvider {
  id: string;
  store_id: string;
  type: { type: "resend"; webhook_id: string };
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface EmailProviderDomain {
  id: string;
  name: string;
  status: "not_started" | "pending" | "verified" | "failed" | "temporary_failure";
  records: { type: string; name: string; value: string; priority: number | null }[];
}

export interface ConnectEmailProviderParams { store_id: string; id: string; api_key: string }
export interface GetEmailProviderParams { store_id: string }
export interface FindEmailProviderDomainsParams { store_id: string }

export interface EmailAddressSending {
  from_name: string;
  reply_to: string;
}

export interface EmailAddressReceiving {
  forwarding_email: string;
  language: string;
  initial_sending_address_id: string | null;
  initial_flow_id: string | null;
}

export type EmailAddressStatus = "active" | "archived";

export type EmailAddressType =
  | { type: "sending"; sending: EmailAddressSending }
  | { type: "receiving"; receiving: EmailAddressReceiving }
  | { type: "sending_and_receiving"; sending: EmailAddressSending; receiving: EmailAddressReceiving };

export type EmailAddressInputType =
  | { type: "sending"; sending: EmailAddressSending }
  | { type: "receiving"; receiving: EmailAddressReceivingInput }
  | { type: "sending_and_receiving"; sending: EmailAddressSending; receiving: EmailAddressReceivingInput };

export interface EmailAddress {
  id: string;
  store_id: string;
  email: string;
  type: EmailAddressType;
  status: EmailAddressStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface EmailAddressReceivingInput {
  language: string;
  initial_sending_address_id: string | null;
  initial_flow_id: string | null;
}

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

export interface FindOutgoingEmailsParams {
  store_id: string;
  to?: string;
  type?: OutgoingEmailType["type"];
  order_id?: string;
  broadcast_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface FindOutgoingWebhooksParams {
  store_id: string;
  webhook_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetOutgoingEmailParams { store_id: string; id: string }
export interface GetOutgoingWebhookParams { store_id: string; id: string }

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
  type: EmailTemplateType;
  content: Record<string, EmailContent>;
}

export interface UpdateEmailTemplateParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key?: string;
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
  sending_address_id?: string;
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
  type: EmailAddressInputType;
}

export interface UpdateEmailAddressParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  type: EmailAddressInputType;
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
