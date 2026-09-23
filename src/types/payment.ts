import type { Currency, MonriEnvironment } from "./index";
import type { EpochMilliseconds } from "./time";

export type PaymentStatus = {
  type:
    | "pending"
    | "requires_action"
    | "processing"
    | "authorized"
    | "completed"
    | "cancelled"
    | "expired"
    | "failed"
    | "unknown";
};

export type StripeInvoicePaymentObject =
  | { type: "payment_intent"; payment_intent_id: string }
  | { type: "charge"; charge_id: string }
  | { type: "payment_record"; payment_record_id: string };

export type PaymentProviderBinding =
  | {
      type: "monri_checkout";
      payment_provider_id: string;
      environment: MonriEnvironment;
      transaction_type: "authorize" | "purchase";
      transaction_id: string | null;
    }
  | {
      type: "stripe_saved_method";
      payment_provider_id: string;
      customer_payment_method_id: string;
      payment_intent_id: string | null;
    }
  | {
      type: "cash_on_delivery";
      payment_provider_id: string;
      marked_paid_by_account_id: string | null;
    }
  | {
      type: "manual";
      payment_provider_id: string;
      reference: string | null;
      marked_paid_by_account_id: string | null;
    }
  | {
      type: "stripe_checkout";
      payment_provider_id: string;
      checkout_expires_at: EpochMilliseconds;
      checkout_session_id: string | null;
      payment_intent_id: string | null;
    }
  | {
      type: "stripe_invoice";
      payment_provider_id: string;
      stripe_invoice_id: string;
      stripe_invoice_payment_id: string;
      payment_object: StripeInvoicePaymentObject;
    };

export interface PaymentAmounts {
  currency: Currency;
  total: number;
  authorized: number;
  captured: number;
  capture_pending: number;
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
  order_id: string;
  payer_customer_id: string;
  provider: PaymentProviderBinding;
  status: PaymentStatus;
  checkout_expiration: PaymentCheckoutExpiration | null;
  amounts: PaymentAmounts;
  request_id: string;
  reconciliation: PaymentReconciliation;
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

export type PaymentReconciliation =
  | { type: "clear" }
  | { type: "hold"; opened_at: EpochMilliseconds };
