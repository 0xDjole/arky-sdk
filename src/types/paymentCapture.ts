import type { Money, MonriEnvironment, ProviderEffectError, ProviderOperationClaim } from "./index";
import type { OrderFinancialSummary } from "./order";
import type { CommerceProviderObservation, Payment } from "./payment";
import type { EpochMilliseconds } from "./time";

export type PaymentCaptureEvidence =
  | { type: "monri"; payment_provider_id: string; environment: MonriEnvironment; transaction_id: string; receipt_id: string }
  | { type: "cash_on_delivery"; marked_paid_by_account_id: string }
  | { type: "manual"; marked_paid_by_account_id: string; reference: string | null }
  | { type: "stripe"; connected_account_id: string; livemode: boolean; charge_id: string; payment_intent_id: string | null; last_observation: CommerceProviderObservation };

export interface CaptureFinancialEffect {
  effect_id: string;
  money: Money;
  evidence: PaymentCaptureEvidence;
  observed_at: EpochMilliseconds;
}

export type PaymentCaptureStatus =
  | { type: "requested" }
  | { type: "processing"; claim: ProviderOperationClaim }
  | { type: "pending"; observed_at: EpochMilliseconds; retry_at: EpochMilliseconds }
  | { type: "succeeded"; completed_at: EpochMilliseconds }
  | { type: "rejected" | "failed"; error: ProviderEffectError; completed_at: EpochMilliseconds }
  | { type: "unknown"; claim: ProviderOperationClaim | null; error: ProviderEffectError; retry_at: EpochMilliseconds };

export interface OrderPaymentCapture {
  id: string;
  store_id: string;
  order_payment_id: string;
  money: Money;
  status: PaymentCaptureStatus;
  operation_id: string;
  idempotency_key: string;
  financial_effects: CaptureFinancialEffect[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface RecordedCollection {
  capture: OrderPaymentCapture;
  payment: Payment;
  financial_summary: OrderFinancialSummary;
}

export interface RecordCashOnDeliveryCollectionParams {
  store_id?: string;
  id: string;
  payment_capture_id: string;
  money: Money;
}

export interface RecordManualCollectionParams extends RecordCashOnDeliveryCollectionParams {
  reference: string | null;
}

export interface CreateManualPaymentParams {
  store_id?: string;
  id: string;
  order_id: string;
  payment_provider_id: string;
  money: Money;
  reference: string | null;
}
