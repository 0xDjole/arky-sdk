import type { PurchaseOriginSnapshot } from "./orderContract";
import type { EpochMilliseconds } from "./time";

export type CustomerPaymentMethodState =
  | { type: "setup_requested" }
  | {
      type: "setup_processing";
      started_at: EpochMilliseconds;
      deadline_at: EpochMilliseconds;
    }
  | { type: "setup_unknown"; retry_at: EpochMilliseconds }
  | { type: "requires_action" }
  | { type: "ready"; verified_at: EpochMilliseconds }
  | { type: "unavailable"; reason: string; ended_at: EpochMilliseconds };

export interface CustomerPaymentMethod {
  id: string;
  store_id: string;
  customer_id: string;
  payment_provider_id: string;
  consent_accepted_at: EpochMilliseconds;
  consent_terms_version: string;
  state: CustomerPaymentMethodState;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CustomerPaymentMethodRevocationRequest {
  customer_payment_method_id: string;
  expected_updated_at: EpochMilliseconds;
  reason: string;
}

export interface CustomerPaymentMethodRevocationRecord {
  request: CustomerPaymentMethodRevocationRequest;
  customer_id: string;
  actor: PurchaseOriginSnapshot;
  ended_at: EpochMilliseconds;
  reason: string;
  updated_at: EpochMilliseconds;
}

export interface CustomerPaymentMethodRevocation {
  command_id: string;
  accepted_at: EpochMilliseconds;
  method: CustomerPaymentMethod;
}

export type NativeSetupOutcome = "created" | "not_started" | "unknown";

export type CustomerPaymentMethodCommandType =
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
      customer_id: string;
      payment_provider_id: string;
      terms_version: string;
      actor: PurchaseOriginSnapshot;
    }
  | { type: "revoked"; revocation: CustomerPaymentMethodRevocationRecord }
  | {
      type: "native_customer_setup_started";
      method_id: string;
      deadline_at: EpochMilliseconds;
    }
  | {
      type: "native_customer_setup_observed";
      method_id: string;
      outcome: NativeSetupOutcome;
    };

export interface CustomerPaymentMethodCommand {
  id: string;
  store_id: string;
  accepted_at: EpochMilliseconds;
  command: CustomerPaymentMethodCommandType;
}

export interface GetCustomerPaymentMethodParams {
  store_id?: string;
  id: string;
}

export interface FindCustomerPaymentMethodsParams {
  store_id?: string;
  customer_id?: string;
  payment_provider_id?: string;
  limit?: number;
  cursor?: string;
}

export interface FindCustomerPaymentMethodCommandsParams {
  store_id?: string;
  id: string;
  limit?: number;
  cursor?: string;
}

export interface RevokeCustomerPaymentMethodParams {
  store_id?: string;
  id: string;
  command_id: string;
  expected_updated_at: EpochMilliseconds;
  reason: string;
}
