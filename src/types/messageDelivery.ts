import type { EmailSender } from "./index";
import type { EpochMilliseconds } from "./time";

export type MessageDeliveryScope =
  | { type: "platform" }
  | { type: "store"; store_id: string };

export type MessageDeliverySource =
  | { type: "account_sign_in"; account_id: string; session_id: string }
  | { type: "customer_sign_in"; session_id: string; request_id: string }
  | { type: "store_invite"; store_membership_id: string; session_id: string }
  | {
      type: "group_email_consent";
      customer_group_id: string;
      email_consent_id: string;
      confirmation_id: string;
    }
  | {
      type: "automation_step";
      automation_id: string;
      run_id: string;
      step_id: string;
      recipient_key: string;
      sender: EmailSender;
    }
  | {
      type: "receipt_resend";
      automation_id: string;
      order_id: string;
      request_id: string;
    }
  | { type: "template_test"; template_id: string; request_id: string }
  | { type: "campaign_message"; campaign_id: string; message_id: string }
  | { type: "support_reply"; conversation_id: string; message_id: string };

export type MessageDeliverySourceType = MessageDeliverySource["type"];

export interface MessageDeliveryClaim {
  claimed_at: EpochMilliseconds;
  deadline_at: EpochMilliseconds;
}

export type MessageDeliveryOutcome =
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

export type MessageDeliveryRequestRetention =
  | "prepared"
  | "erased"
  | "not_prepared";

export interface MessageDelivery {
  id: string;
  scope: MessageDeliveryScope;
  source: MessageDeliverySource;
  recipient_key: string;
  request_retention: MessageDeliveryRequestRetention;
  claim: MessageDeliveryClaim | null;
  outcome: MessageDeliveryOutcome;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface GetMessageDeliveryParams {
  store_id: string;
  id: string;
}

export interface FindMessageDeliveriesParams {
  store_id: string;
  recipient?: string;
  order_id?: string;
  automation_id?: string;
  run_id?: string;
  limit?: number;
  cursor?: string;
}

export interface StopMessageDeliveryParams extends GetMessageDeliveryParams {
  expected_updated_at: EpochMilliseconds;
}
