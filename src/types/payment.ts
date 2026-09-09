import type { Currency, Money } from "./index";
import type { EpochMilliseconds } from "./time";

export type PaymentStatus = {
  type:
    | "pending"
    | "requires_action"
    | "processing"
    | "paid"
    | "partially_refunded"
    | "refunded"
    | "cancelled"
    | "expired"
    | "failed"
    | "unknown";
};

export interface BillingPeriod {
  start: EpochMilliseconds;
  end: EpochMilliseconds;
}

export type PaymentSource =
  | { type: "order"; order_id: string }
  | {
      type: "subscription_invoice";
      subscription_id: string;
      stripe_invoice_id: string;
      stripe_invoice_payment_id: string;
      period: BillingPeriod;
    };

export type PaymentProviderBinding =
  | {
      type: "cash_on_delivery";
      payment_provider_id: string;
      marked_paid_by_account_id: string | null;
    }
  | {
      type: "stripe_checkout";
      payment_provider_id: string;
      checkout_expires_at: EpochMilliseconds;
      checkout_session_id: string | null;
      payment_intent_id: string | null;
    }
  | { type: "stripe_invoice"; payment_provider_id: string };

export interface PaymentAmounts {
  currency: Currency;
  total: number;
  paid: number;
  refund_pending: number;
  refunded: number;
}

export interface PaymentCheckoutExpiration {
  id: string;
  status: {
    type: "requested" | "processing" | "succeeded" | "rejected" | "failed" | "unknown";
  };
  requested_at: EpochMilliseconds | null;
  processing_started_at: EpochMilliseconds | null;
  processing_deadline_at: EpochMilliseconds | null;
  completed_at: EpochMilliseconds | null;
  safe_error: string | null;
}

export interface Payment {
  id: string;
  store_id: string;
  source: PaymentSource;
  payer_customer_id: string | null;
  provider: PaymentProviderBinding;
  status: PaymentStatus;
  checkout_expiration: PaymentCheckoutExpiration | null;
  amounts: PaymentAmounts;
  settlement: PaymentSettlement | null;
  requested_at: EpochMilliseconds;
  completed_at: EpochMilliseconds | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
  safe_error: string | null;
}

export type CommerceProviderObservation =
  | { type: "stripe_event"; event_id: string; event_created_at: EpochMilliseconds }
  | {
      type: "exact_read";
      observed_at: EpochMilliseconds;
      provider_updated_at: EpochMilliseconds | null;
    };

export type PaymentSettlementEvidence =
  | { type: "cash_on_delivery"; marked_paid_by_account_id: string }
  | {
      type: "stripe";
      charge_id: string;
      payment_intent_id: string | null;
      last_observation: CommerceProviderObservation;
    };

export interface PaymentSettlement {
  money: Money;
  paid_at: EpochMilliseconds;
  evidence: PaymentSettlementEvidence;
}
