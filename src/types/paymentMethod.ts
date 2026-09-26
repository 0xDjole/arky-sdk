import type { PurchaseOriginSnapshot } from "./orderContract";
import type { EpochMilliseconds } from "./time";

export type PaymentMethodOwner =
  | { type: "customer"; customer_id: string }
  | { type: "company"; company_id: string; company_location_id: string | null };

export type PaymentMethodDetails =
  | { type: "card"; brand: string; last4: string; exp_month: number; exp_year: number }
  | { type: "sepa_debit"; last4: string; mandate_reference: string };

export type PaymentMethodProviderName = "stripe" | "monri";

export type PaymentMethodState =
  | { type: "setup_requested" }
  | {
      type: "setup_processing";
      started_at: EpochMilliseconds;
      deadline_at: EpochMilliseconds;
    }
  | { type: "setup_unknown"; retry_at: EpochMilliseconds }
  | { type: "requires_action" }
  | { type: "ready" }
  | { type: "unavailable"; reason: string; ended_at: EpochMilliseconds };

export interface PaymentMethod {
  id: string;
  store_id: string;
  owner: PaymentMethodOwner;
  payment_option_id: string;
  provider: PaymentMethodProviderName | null;
  details: PaymentMethodDetails | null;
  consent_accepted_at: EpochMilliseconds;
  consent_terms_version: string;
  state: PaymentMethodState;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface PaymentMethodRevocationRequest {
  payment_method_id: string;
  expected_updated_at: EpochMilliseconds;
  reason: string;
}

export interface PaymentMethodRevocationRecord {
  request: PaymentMethodRevocationRequest;
  owner: PaymentMethodOwner;
  actor: PurchaseOriginSnapshot;
  ended_at: EpochMilliseconds;
  reason: string;
  updated_at: EpochMilliseconds;
}

export interface PaymentMethodRevocation {
  command_id: string;
  accepted_at: EpochMilliseconds;
  method: PaymentMethod;
}

export type NativeSetupOutcome = "created" | "not_started" | "unknown";

export type NativeCustomerSetupOutcome = "created" | "existing" | "not_started" | "unknown";

export type PaymentMethodCommandType =
  | {
      type: "native_setup_intent_started";
      method_id: string;
      deadline_at: EpochMilliseconds;
    }
  | {
      type: "native_setup_intent_observed";
      method_id: string;
      outcome: NativeSetupOutcome;
    }
  | {
      type: "setup_requested";
      method_id: string;
      owner: PaymentMethodOwner;
      payment_option_id: string;
      terms_version: string;
      actor: PurchaseOriginSnapshot;
    }
  | { type: "revoked"; revocation: PaymentMethodRevocationRecord }
  | {
      type: "native_customer_setup_started";
      method_id: string;
      deadline_at: EpochMilliseconds;
    }
  | {
      type: "native_customer_setup_observed";
      method_id: string;
      outcome: NativeCustomerSetupOutcome;
    };

export interface PaymentMethodCommand {
  id: string;
  store_id: string;
  accepted_at: EpochMilliseconds;
  command: PaymentMethodCommandType;
}

export interface GetPaymentMethodParams {
  store_id?: string;
  id: string;
}

export interface FindPaymentMethodsParams {
  store_id?: string;
  customer_id?: string;
  company_id?: string;
  payment_option_id?: string;
  limit?: number;
  cursor?: string;
}

export interface FindPaymentMethodCommandsParams {
  store_id?: string;
  id: string;
  limit?: number;
  cursor?: string;
}

export interface RevokePaymentMethodParams {
  store_id?: string;
  id: string;
  command_id: string;
  expected_updated_at: EpochMilliseconds;
  reason: string;
}

export interface PaymentMethodSetupRequest {
  method_id: string;
  owner: PaymentMethodOwner;
  payment_option_id: string;
  return_url: string;
  terms_version: string;
}

export interface RequestPaymentMethodSetupParams {
  store_id?: string;
  request_id: string;
  request: PaymentMethodSetupRequest;
  accept_storage_and_off_session_use: true;
}

export interface PaymentMethodSetupStart {
  method: PaymentMethod;
  setup_intent_id: string | null;
  client_secret: string | null;
  connected_account_id: string | null;
  publishable_key: string | null;
}
