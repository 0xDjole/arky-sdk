import type { AccountActor } from "./accountActor";
import type { Currency, Money, MonriEnvironment, ProviderOperationClaim } from "./index";
import type { EpochMilliseconds } from "./time";
import type { CommerceProviderObservation, Payment } from "./payment";
import type { OrderFinancialSummary } from "./order";

export type RefundStatus =
  | { type: "requested" }
  | { type: "processing" }
  | { type: "requires_action" }
  | { type: "pending" }
  | { type: "succeeded" }
  | { type: "rejected" }
  | { type: "failed" }
  | { type: "cancelled" }
  | { type: "unknown" };

export type RefundReason =
  | "customer_request"
  | "duplicate"
  | "fraudulent"
  | "other"
  | "store_closure";
export type RefundRequestReason = Exclude<RefundReason, "store_closure">;
export type SystemRefundReason = "store_closure" | "late_charge";

export interface RefundAllocation {
  order_credit_id: string;
  order_credit_allocation_id: string;
  amount: number;
}

export type RefundApplication =
  | { type: "commercial_credit"; allocations: RefundAllocation[] }
  | { type: "excess_collection"; reason: string }
  | { type: "provider_observed"; reason: string };

export type RefundRequester =
  | {
      type: "account";
      actor: AccountActor;
      reason: RefundReason;
      private_note: string | null;
    }
  | { type: "system"; reason: SystemRefundReason }
  | { type: "stripe" };

export type RefundProvider =
  | { type: "monri"; payment_provider_id: string; environment: MonriEnvironment; result: MonriRefundResult | null }
  | { type: "cash_on_delivery"; payment_provider_id: string }
  | { type: "manual"; payment_provider_id: string; reference: string | null }
  | { type: "stripe"; payment_provider_id: string; refund_id: string | null };

export interface MonriRefundResult {
  claim: ProviderOperationClaim;
  transaction_id: string;
  amount: number;
  currency: Currency | null;
  status: "approved" | "declined";
  response_code: string;
  transaction_created_at: EpochMilliseconds;
  observed_at: EpochMilliseconds;
}

export interface Refund {
  id: string;
  store_id: string;
  order_id: string;
  order_payment_id: string;
  order_payment_capture_id: string | null;
  provider: RefundProvider;
  money: Money;
  application: RefundApplication;
  requester: RefundRequester;
  status: RefundStatus;
  financial_effects: RefundFinancialEffect[];
  safe_error: string | null;
  requested_at: EpochMilliseconds;
  processing_started_at: EpochMilliseconds | null;
  processing_deadline_at: EpochMilliseconds | null;
  completed_at: EpochMilliseconds | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type CustomerMoneyEvidence =
  | { type: "monri"; transaction_id: string }
  | { type: "provider"; provider_effect_reference: string; observation: CommerceProviderObservation }
  | { type: "manual"; actor: AccountActor; reference: string };

export type RefundFinancialEffect = {
  effect_id: string;
  money: Money;
  allocations: RefundAllocation[];
  evidence: CustomerMoneyEvidence;
  observed_at: EpochMilliseconds;
} & ({ type: "sent" } | { type: "returned"; sent_effect_id: string });

export interface RefundAllocationBalance {
  order_credit_id: string;
  order_credit_allocation_id: string;
  effective_sent: number;
  pending: number;
}

export interface RefundMoneySummary {
  sent: Money;
  returned: Money;
  refunded: Money;
  refund_pending: Money;
  allocations: RefundAllocationBalance[];
}

export interface RecordedRefundMoney {
  refund: Refund;
  money: RefundMoneySummary;
  payment: Payment;
  financial_summary: OrderFinancialSummary;
}

export type LocalRefundMovement = { type: "sent" } | { type: "returned"; sent_effect_id: string };

export interface RecordRefundMoneyParams {
  store_id?: string;
  id: string;
  effect_id: string;
  movement: LocalRefundMovement;
  money: Money;
  allocations: RefundAllocation[];
  reference: string;
}

export interface CancelLocalRefundParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}
