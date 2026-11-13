import type { EpochMilliseconds } from "./time";

export interface SimulatedEmail {
  id: string;
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  reply_to: string[];
  subject: string;
  html: string | null;
  text: string | null;
  headers: Record<string, string>;
  tags: { name: string; value: string }[];
  message_id: string;
  last_event: string;
  idempotency_key: string | null;
  created_at: EpochMilliseconds;
}

export type SimulatorStripeOperation =
  | "create_checkout_session"
  | "read_checkout_session"
  | "expire_checkout_session"
  | "create_customer"
  | "create_setup_intent"
  | "read_setup_intent"
  | "create_card_charge"
  | "read_payment_intent"
  | "cancel_payment_intent"
  | "create_refund"
  | "read_refund"
  | "list_refunds"
  | "read_account"
  | "deliver_webhook";

export type SimulatorMonriOperation =
  | "create_payment_session"
  | "charge_saved_card"
  | "refund"
  | "deliver_webhook";

export type SimulatorResendOperation =
  | "send_email"
  | "list_received_emails"
  | "get_received_email"
  | "list_received_attachments"
  | "download_attachment"
  | "list_domains"
  | "get_domain"
  | "get_suppression"
  | "delete_suppression"
  | "deliver_webhook";

export type SimulatorPlannedOperation =
  | { provider: "stripe"; operation: SimulatorStripeOperation }
  | { provider: "monri"; operation: SimulatorMonriOperation }
  | { provider: "resend"; operation: SimulatorResendOperation };

export type SimulatorProvider = SimulatorPlannedOperation["provider"];

export type SimulatorPlannedMatching =
  | { type: "any" }
  | { type: "to"; address: string }
  | { type: "payment"; payment_id: string };

export type SimulatorPlannedResult =
  | { type: "refused"; message: string }
  | { type: "rate_limited"; retry_after_seconds: number }
  | { type: "unavailable" }
  | { type: "lost_response" }
  | { type: "delayed"; delay_ms: number }
  | { type: "declined" }
  | { type: "missing_link" }
  | { type: "expired_link" }
  | { type: "daily_quota_exceeded" }
  | { type: "monthly_quota_exceeded" };

export type SimulatorPlannedOutcome = SimulatorPlannedOperation & {
  id: string;
  matching: SimulatorPlannedMatching;
  outcome: SimulatorPlannedResult;
  created_at: EpochMilliseconds;
};

export interface SimulatorPaymentControlParams {
  store_id: string;
  payment_id: string;
}

export interface FindSimulatedEmailsParams {
  store_id: string;
  to?: string;
  limit?: number;
  cursor?: string | null;
}

export interface SimulatedSms {
  id: string;
  from: string;
  to: string;
  body: string;
  status: string;
  error_code: string | null;
  created_at: EpochMilliseconds;
}

export interface FindSimulatedSmsParams {
  store_id: string;
  to?: string;
  limit?: number;
  cursor?: string | null;
}

export interface SimulatedCall {
  id: string;
  from: string | null;
  to: string;
  status: string;
  created_at: EpochMilliseconds;
}

export interface StartSimulatedCallParams {
  store_id: string;
  to: string;
  from: string | null;
}

export type CreateSimulatorPlannedOutcomeParams = SimulatorPlannedOperation & {
  store_id: string;
  id: string;
  matching: SimulatorPlannedMatching;
  outcome: SimulatorPlannedResult;
};

export interface FindSimulatorPlannedOutcomesParams {
  store_id: string;
  limit?: number;
  cursor?: string | null;
}

export interface RemoveSimulatorPlannedOutcomeParams {
  store_id: string;
  id: string;
}

export interface SimulatorPlannedOutcomeRemoval {
  deleted: boolean;
}
