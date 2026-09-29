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
  | { type: "monri"; payment_option_id: string; environment: MonriEnvironment; result: MonriRefundResult | null }
  | { type: "cash_on_delivery"; payment_option_id: string }
  | { type: "manual"; payment_option_id: string; reference: string | null }
  | { type: "stripe"; payment_option_id: string; refund_id: string | null };

export interface MonriRefundResult {
  claim: ProviderOperationClaim;
  evidence: MonriRefundEvidence;
  transaction_id: string;
  amount: number;
  currency: Currency | null;
  status: "approved" | "declined";
  response_code: string;
  transaction_created_at: EpochMilliseconds;
  observed_at: EpochMilliseconds;
}

export interface PaymentRefund {
  id: string;
  store_id: string;
  order_id: string;
  payment_id: string;
  payment_capture_id: string | null;
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
  refund: PaymentRefund;
  money: RefundMoneySummary;
  payment: Payment;
  financial_summary: OrderFinancialSummary;
}

export type LocalRefundMovement = { type: "sent" } | { type: "returned"; sent_effect_id: string };

export interface RecordRefundMoneyParams {
  store_id: string;
  id: string;
  effect_id: string;
  movement: LocalRefundMovement;
  money: Money;
  allocations: RefundAllocation[];
  reference: string;
}

export interface CancelLocalRefundParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export type MonriRefundAssociation = {
  type: "provider_confirmed";
  reference: string;
  explanation: string;
};

export interface ReviewMonriRefundParams {
  store_id: string;
  refund_id: string;
  request_id: string;
  notification_id: string;
  expected_updated_at: EpochMilliseconds;
  association: MonriRefundAssociation;
}

export type MonriRefundEvidence =
  | { type: "original_response" }
  | {
      type: "reviewed_notification";
      review: {
        request_id: string;
        notification_id: string;
        evidence_key: string;
        expected_updated_at: EpochMilliseconds;
        actor: AccountActor;
        association: MonriRefundAssociation;
      };
    };

export type ProviderNotificationOwner =
  | { type: "payment"; payment_id: string }
  | { type: "capture"; payment_id: string; capture_id: string }
  | { type: "refund"; payment_id: string; refund_id: string }
  | { type: "dispute"; dispute_id: string }
  | { type: "method"; payment_method_id: string }
  | { type: "payment_option"; payment_option_id: string }
  | { type: "store_subscription"; store_subscription_id: string };

export type ProviderNotificationReviewReason =
  | "monri_payment_scope_mismatch"
  | "monri_financial_evidence_unresolved"
  | "stripe_financial_facts_mismatch"
  | "stripe_provider_refusal"
  | "stripe_source_scope_mismatch"
  | "stripe_subscription_facts_mismatch";

export type ProviderNotificationState =
  | { type: "pending" }
  | { type: "associated"; owner: ProviderNotificationOwner; associated_at: EpochMilliseconds }
  | { type: "processed"; processed_at: EpochMilliseconds }
  | { type: "unassociated"; checked_at: EpochMilliseconds }
  | { type: "applied"; owner: ProviderNotificationOwner; applied_at: EpochMilliseconds }
  | { type: "review"; owner: ProviderNotificationOwner | null; reason: ProviderNotificationReviewReason; checked_at: EpochMilliseconds };

export interface MonriRefundReviewEvidence {
  notification_id: string;
  store_id: string;
  payment_id: string;
  payment_option_id: string;
  environment: MonriEnvironment;
  transaction_id: string;
  money: Money;
  status: "approved" | "declined";
  response_code: string;
  transaction_created_at: EpochMilliseconds;
  received_at: EpochMilliseconds;
  matches_dispatch_scope: boolean;
  state: ProviderNotificationState;
}

export interface MonriRefundReviewEvidencePage {
  refund_id: string;
  store_id: string;
  payment_id: string;
  payment_option_id: string;
  refund_updated_at: EpochMilliseconds;
  items: MonriRefundReviewEvidence[];
  cursor: string | null;
}

export interface FindMonriRefundReviewEvidenceParams {
  store_id: string;
  refund_id: string;
  limit?: number;
  cursor?: string;
}
