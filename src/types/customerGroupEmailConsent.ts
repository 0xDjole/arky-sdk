import type { AccountActor } from "./accountActor";
import type { EpochMilliseconds } from "./time";

export type CustomerGroupUnsubscribeReason =
  | { type: "customer_email_opt_out" }
  | { type: "admin_ended" }
  | { type: "store_closure" };

export type CustomerGroupConfirmationEmailStatus =
  | { type: "requested"; requested_at: EpochMilliseconds }
  | {
      type: "processing";
      started_at: EpochMilliseconds;
      deadline_at: EpochMilliseconds;
    }
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
  | { type: "failed"; failed_at: EpochMilliseconds }
  | { type: "unknown"; unknown_at: EpochMilliseconds }
  | { type: "cancelled"; cancelled_at: EpochMilliseconds };

export interface CustomerGroupEmailConfirmation {
  confirmation_id: string;
  email_status: CustomerGroupConfirmationEmailStatus;
  issued_at: EpochMilliseconds;
  expires_at: EpochMilliseconds;
}

export type CustomerGroupEmailConsentStatus =
  | { type: "pending" }
  | { type: "subscribed"; subscribed_at: EpochMilliseconds }
  | {
      type: "unsubscribed";
      unsubscribed_at: EpochMilliseconds;
      reason: CustomerGroupUnsubscribeReason;
    };

export interface CustomerGroupEmailConsent {
  id: string;
  store_id: string;
  customer_group_id: string;
  customer_id: string;
  email_identity_id: string;
  normalized_email: string;
  status: CustomerGroupEmailConsentStatus;
  confirmation: CustomerGroupEmailConfirmation | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CustomerGroupConfirmationHistoryEntry {
  confirmation: CustomerGroupEmailConfirmation;
  recorded_at: EpochMilliseconds;
}

export type CustomerGroupConsentSource =
  | { type: "customer_session"; customer_session_id: string }
  | { type: "unsubscribe_token" }
  | { type: "confirmation"; confirmation_id: string }
  | { type: "admin"; actor: AccountActor }
  | { type: "system" };

export type CustomerGroupConsentEventType =
  | { type: "subscribed"; source: CustomerGroupConsentSource }
  | {
      type: "unsubscribed";
      source: CustomerGroupConsentSource;
      reason: CustomerGroupUnsubscribeReason;
    };

export interface CustomerGroupConsentEvent {
  id: string;
  store_id: string;
  email_consent_id: string;
  type: CustomerGroupConsentEventType;
  occurred_at: EpochMilliseconds;
}

export type RecordCustomerGroupEmailDecision =
  | { type: "subscribed" }
  | { type: "unsubscribed" };

export interface SubscribeCustomerGroupEmailsParams {
  store_id?: string;
  customer_group_id: string;
  email_identity_id: string;
  expected_updated_at: EpochMilliseconds | null;
}

export interface RecordCustomerGroupEmailConsentParams {
  store_id?: string;
  customer_group_id: string;
  customer_id: string;
  email_identity_id: string;
  decision: RecordCustomerGroupEmailDecision;
  expected_updated_at: EpochMilliseconds | null;
}

export interface ImportCustomerGroupEmailConsentEntry {
  customer_id: string;
  email_identity_id: string;
  decision: RecordCustomerGroupEmailDecision;
  expected_updated_at: EpochMilliseconds | null;
}

export interface ImportCustomerGroupEmailConsentsParams {
  store_id?: string;
  customer_group_id: string;
  recipients: ImportCustomerGroupEmailConsentEntry[];
}

export interface ImportCustomerGroupEmailConsentsResult {
  consents: CustomerGroupEmailConsent[];
}

export interface ConfirmCustomerGroupEmailsParams {
  store_id?: string;
  token: string;
}

export interface UnsubscribeCustomerGroupEmailsParams {
  store_id?: string;
  token: string;
}

export interface ResendCustomerGroupConfirmationParams {
  store_id?: string;
  id: string;
  confirmation_id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface GetCustomerGroupEmailConsentParams {
  store_id?: string;
  id: string;
}

export interface FindCustomerGroupEmailConsentsParams {
  store_id?: string;
  customer_group_id?: string;
  customer_id?: string;
  email_identity_id?: string;
  status?: CustomerGroupEmailConsentStatus["type"];
  limit?: number;
  cursor?: string;
}

export interface FindCustomerGroupEmailConsentHistoryParams {
  store_id?: string;
  id: string;
  limit?: number;
  cursor?: string;
}
