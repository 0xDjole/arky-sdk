import type { EpochMilliseconds } from "./time";

export type NotificationPurpose =
  | { type: "customer_login" }
  | { type: "partner_access" }
  | { type: "order_accepted" }
  | { type: "order_dispatched" }
  | { type: "order_delivered" };

export type NotificationRecipient =
  | { type: "challenge_email" }
  | { type: "prepared_customer" }
  | { type: "order_buyer" };

export type NotificationEmailSender =
  | { type: "platform" }
  | { type: "mailbox"; mailbox_id: string };

export interface NotificationChannel {
  type: "email";
  sender: NotificationEmailSender;
  template_id: string;
}

export type NotificationStatus =
  | { type: "disabled" }
  | { type: "active"; activated_at: EpochMilliseconds };

export interface Notification {
  id: string;
  store_id: string;
  key: string;
  name: string | null;
  purpose: NotificationPurpose;
  recipient: NotificationRecipient;
  channel: NotificationChannel;
  status: NotificationStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface SaveNotificationParams {
  store_id: string;
  id: string;
  key: string;
  name?: string | null;
  purpose: NotificationPurpose;
  recipient: NotificationRecipient;
  channel: NotificationChannel;
  active: boolean;
  expected_updated_at: EpochMilliseconds | null;
}

export interface GetNotificationParams {
  store_id: string;
  id: string;
}

export interface FindNotificationsParams {
  store_id: string;
  limit?: number;
  cursor?: string;
}

export type GetNotificationDeliveryParams = GetNotificationParams;
export type FindNotificationDeliveriesParams = FindNotificationsParams;

export interface PreviewNotificationParams extends GetNotificationParams {
  data?: Record<string, unknown> | null;
}

export type NotificationPreviewSender =
  | { type: "platform"; from_name: string; from_email: string }
  | { type: "mailbox"; mailbox_id: string; from_name: string; from_email: string };

export interface NotificationPreview {
  sender: NotificationPreviewSender;
  reply_to: string | null;
  subject: string;
  body_text: string;
  body_html: string;
}

export interface StopNotificationDeliveryParams extends GetNotificationDeliveryParams {
  expected_updated_at: EpochMilliseconds;
}

export type NotificationDeliveryScope =
  | { type: "platform" }
  | { type: "store"; store_id: string };

export type NotificationOccurrence =
  | { type: "partner_access"; customer_id: string; membership_id: string }
  | { type: "order_accepted"; order_id: string }
  | { type: "order_dispatched"; order_id: string; fulfillment_id: string }
  | { type: "order_delivered"; order_id: string; fulfillment_id: string };

export type NotificationDeliverySource =
  | { type: "account_login"; account_id: string; session_id: string }
  | {
      type: "customer_login";
      notification_id: string;
      session_id: string;
      request_id: string;
    }
  | {
      type: "group_email_consent";
      customer_group_id: string;
      email_consent_id: string;
      confirmation_id: string;
    }
  | { type: "campaign_message"; campaign_id: string; message_id: string }
  | { type: "support_reply"; conversation_id: string; message_id: string }
  | {
      type: "workflow_step";
      workflow_id: string;
      execution_id: string;
      node_id: string;
      iteration_key: string;
    }
  | {
      type: "definition";
      notification_id: string;
      occurrence: NotificationOccurrence;
    };

export interface NotificationDeliveryClaim {
  claimed_at: EpochMilliseconds;
  deadline_at: EpochMilliseconds;
}

export type NotificationDeliveryOutcome =
  | { type: "pending" }
  | {
      type: "sent";
      provider_message_id: string;
      provider_status: number | null;
      sent_at: EpochMilliseconds;
    }
  | {
      type: "rejected";
      provider_status: number | null;
      rejected_at: EpochMilliseconds;
    }
  | { type: "not_started"; reason: string; decided_at: EpochMilliseconds }
  | { type: "unknown"; unknown_at: EpochMilliseconds };

export interface NotificationDelivery {
  id: string;
  scope: NotificationDeliveryScope;
  source: NotificationDeliverySource;
  request_retention: "prepared" | "erased" | "not_prepared";
  claim: NotificationDeliveryClaim | null;
  outcome: NotificationDeliveryOutcome;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}
