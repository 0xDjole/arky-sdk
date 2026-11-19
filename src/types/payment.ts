import type { CalendarDate, EpochMilliseconds } from "./time";
import type { Block } from "./block";
import type {
  AccountActor,
  Actor,
  CommerceParty,
  CommercePartyQuery,
  LocalizedMarkdown,
  Money,
  ProviderEffectError,
  ProviderLogin,
  ProviderOperationClaim,
  SortDirection,
} from "./common";
import type { PackageMemberCard, PackageMemberSelfCard } from "./packageMember";
import type { EmailFailure } from "./notification";
import type { StoreProviderStatus } from "./storeProvider";
import type { FiscalReceipt } from "./fiscalReceipt";

export type MonriEnvironment = "test" | "live";

export type PaymentRunsOn =
  | { type: "provider" }
  | { type: "simulator"; api_url: string };

export interface StripeSigningSecretOverlap {
  expires_at: EpochMilliseconds;
}

export interface StripeWebhookEndpoint {
  endpoint_id: string;
  enabled_events: string[];
  previous_signing_secret: StripeSigningSecretOverlap | null;
}

export type StripeWebhook =
  | { type: "not_configured" }
  | ({ type: "awaiting_first_event" } & StripeWebhookEndpoint)
  | ({ type: "verified" } & StripeWebhookEndpoint);

export type StripeSetupProblem =
  | { type: "charges_disabled" }
  | { type: "webhook_secret_missing" }
  | { type: "webhook_unreadable" }
  | { type: "webhook_missing" }
  | { type: "webhook_duplicated"; webhook_ids: string[] }
  | { type: "webhook_disabled" }
  | { type: "webhook_events_missing"; events: string[] }
  | { type: "webhook_replaced"; saved_webhook_id: string };

export interface StripeSetup {
  webhook_address: string;
  events: string[];
  webhook_id: string | null;
  problems: StripeSetupProblem[];
}

export interface StripeConnection {
  provider_id: string;
  provider_status: StoreProviderStatus;
  provider_updated_at: EpochMilliseconds;
  account_id: string;
  livemode: boolean;
  publishable_key: string;
  charges_enabled: boolean;
  account_checked_at: EpochMilliseconds;
  webhook: StripeWebhook;
  saved_card_terms: LocalizedMarkdown;
}

export interface MonriConnection {
  provider_id: string;
  provider_status: StoreProviderStatus;
  provider_updated_at: EpochMilliseconds;
  environment: MonriEnvironment;
  saved_card_terms: LocalizedMarkdown;
}

export type PaymentOptionType =
  | { type: "cash_on_delivery" }
  | { type: "manual" }
  | ({ type: "stripe" } & StripeConnection)
  | ({ type: "monri" } & MonriConnection)
  | ({ type: "arky_stripe" } & StripeConnection)
  | ({ type: "arky_monri" } & MonriConnection);

export type PaymentOptionTypeName = PaymentOptionType["type"];

export type StorefrontPaymentOptionType = "cash_on_delivery" | "manual" | "stripe" | "monri";

export type PaymentOptionStatus = "active" | "disabled";

export interface PaymentOption {
  id: string;
  store_id: string;
  key: string;
  blocks: Block[];
  type: PaymentOptionType;
  status: PaymentOptionStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface StorefrontPaymentOption {
  id: string;
  key: string;
  blocks: Block[];
  type: StorefrontPaymentOptionType;
  saved_card_terms: LocalizedMarkdown | null;
}

export interface PaymentMethodConsent {
  given_by: Actor;
  accepted_at: EpochMilliseconds;
  language: string;
  terms: string;
}

export interface CardDetails {
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

export type CardRemoval =
  { type: "revoked"; by: Actor } | { type: "detached_at_stripe" };

export type StripeCardSetup =
  { type: "from_payment"; payment_id: string } | { type: "dedicated" };

export type StripeCardStatus =
  | { type: "requested" }
  | { type: "creating_customer"; claim: ProviderOperationClaim }
  | {
      type: "creating_setup";
      customer_id: string;
      claim: ProviderOperationClaim;
    }
  | {
      type: "unknown";
      customer_id: string | null;
      error: ProviderEffectError;
      retry_at: EpochMilliseconds;
    }
  | {
      type: "requires_action";
      customer_id: string;
      setup_intent_id: string;
      action_reference: string;
    }
  | {
      type: "ready";
      customer_id: string;
      payment_method_id: string;
      details: CardDetails;
    }
  | { type: "failed"; error: ProviderEffectError }
  | { type: "cancelled"; by: Actor }
  | { type: "removed"; details: CardDetails; reason: CardRemoval };

export interface StripeCard {
  setup: StripeCardSetup;
  status: StripeCardStatus;
}

export interface MonriCardToken {
  merchant_fingerprint: string;
  card_fingerprint: string;
}

export type MonriCardFailure =
  | { type: "already_saved" }
  | { type: "details_invalid" }
  | { type: "not_returned" }
  | { type: "invalid" }
  | { type: "provider_error"; error: ProviderEffectError };

export type MonriCardStatus =
  | { type: "requested" }
  | { type: "ready"; token: MonriCardToken; details: CardDetails }
  | { type: "failed"; reason: MonriCardFailure }
  | { type: "cancelled"; by: Actor }
  | { type: "removed"; details: CardDetails; reason: CardRemoval };

export interface MonriCard {
  payment_id: string;
  status: MonriCardStatus;
}

export type PaymentMethodType =
  ({ type: "stripe" } & StripeCard) | ({ type: "monri" } & MonriCard);

export interface PaymentMethod {
  id: string;
  store_id: string;
  owner: CommerceParty;
  payment_option_id: string;
  consent: PaymentMethodConsent;
  type: PaymentMethodType;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface PaymentMethodSetupStart {
  method: PaymentMethod;
  client_secret: string | null;
  publishable_key: string | null;
  runs_on: PaymentRunsOn;
}

export interface StorefrontPaymentMethod {
  id: string;
  store_id: string;
  owner: CommerceParty;
  payment_option_id: string;
  consent: StorefrontPaymentMethodConsent;
  type: StorefrontPaymentMethodType;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface StorefrontPaymentMethodConsent {
  accepted_at: EpochMilliseconds;
  language: string;
  terms: string;
}

export type StorefrontPaymentMethodType =
  | ({ type: "stripe" } & StorefrontStripeCard)
  | ({ type: "monri" } & StorefrontMonriCard);

export type StorefrontCardRemoval = { type: "revoked" } | { type: "detached_at_stripe" };

export interface StorefrontStripeCard {
  setup: StripeCardSetup;
  status: StorefrontStripeCardStatus;
}

export type StorefrontStripeCardStatus =
  | { type: "requested" }
  | { type: "creating_customer" }
  | { type: "creating_setup"; customer_id: string }
  | { type: "unknown"; customer_id: string | null }
  | {
      type: "requires_action";
      customer_id: string;
      setup_intent_id: string;
      action_reference: string;
    }
  | {
      type: "ready";
      customer_id: string;
      payment_method_id: string;
      details: CardDetails;
    }
  | { type: "failed" }
  | { type: "cancelled" }
  | { type: "removed"; details: CardDetails; reason: StorefrontCardRemoval };

export interface StorefrontMonriCard {
  payment_id: string;
  status: StorefrontMonriCardStatus;
}

export type StorefrontMonriCardStatus =
  | { type: "requested" }
  | { type: "ready"; details: CardDetails }
  | { type: "failed" }
  | { type: "cancelled" }
  | { type: "removed"; details: CardDetails; reason: StorefrontCardRemoval };

export interface StorefrontPaymentMethodSetupStart {
  method: StorefrontPaymentMethod;
  client_secret: string | null;
  publishable_key: string | null;
  runs_on: PaymentRunsOn;
}

export type ProviderCallStatus =
  | { type: "requested" }
  | { type: "sending"; claim: ProviderOperationClaim }
  | { type: "unknown"; error: ProviderEffectError; retry_at: EpochMilliseconds }
  | { type: "refused"; error: ProviderEffectError }
  | { type: "not_sent"; error: ProviderEffectError };

export type CardReceiptDevice =
  | { type: "no_receipt" }
  | { type: "device"; fiscal_device_id: string };

export type RefundReason =
  "customer_request" | "duplicate" | "fraudulent" | "store_closure" | "other";

export interface RefundAllocation {
  order_credit_id: string;
  order_credit_allocation_id: string;
  amount: number;
}

export type RefundApplication =
  | { type: "commercial_credit"; allocations: RefundAllocation[] }
  | { type: "excess_collection"; reason: string };

export interface RefundRequest {
  actor: AccountActor;
  reason: RefundReason;
  application: RefundApplication;
  notify_customer: boolean;
}

export type StripeRefundSource =
  | ({ type: "account" } & RefundRequest)
  | { type: "stripe"; reason: string | null }
  | { type: "stripe_allocated"; reason: string | null; by: AccountActor; application: RefundApplication };

export type StripeRefundStatus =
  | { type: "requested" }
  | { type: "creating"; claim: ProviderOperationClaim }
  | {
      type: "unknown";
      stripe_refund_id: string | null;
      error: ProviderEffectError;
      retry_at: EpochMilliseconds;
    }
  | { type: "pending"; stripe_refund_id: string }
  | {
      type: "succeeded";
      stripe_refund_id: string;
      balance_transaction_id: string;
    }
  | {
      type: "returned";
      stripe_refund_id: string;
      balance_transaction_id: string;
      failure_balance_transaction_id: string;
    }
  | { type: "failed"; stripe_refund_id: string }
  | { type: "cancelled"; stripe_refund_id: string }
  | { type: "refused"; error: ProviderEffectError }
  | { type: "not_sent"; error: ProviderEffectError };

export interface StripeRefund {
  id: string;
  money: Money;
  source: StripeRefundSource;
  status: StripeRefundStatus;
  created_at: EpochMilliseconds;
}

export interface MonriTransaction {
  transaction_id: string;
  amount: number;
  response_code: string;
  created_at: EpochMilliseconds;
}

export type MonriRefundStatus =
  | { type: "requested" }
  | { type: "sending"; claim: ProviderOperationClaim }
  | { type: "unknown"; error: ProviderEffectError; retry_at: EpochMilliseconds }
  | { type: "succeeded"; transaction: MonriTransaction }
  | { type: "declined"; transaction: MonriTransaction }
  | { type: "not_sent"; error: ProviderEffectError }
  | { type: "confirmed_made"; transaction_id: string; by: AccountActor }
  | { type: "confirmed_not_made"; by: AccountActor };

export interface MonriRefund {
  id: string;
  money: Money;
  request: RefundRequest;
  status: MonriRefundStatus;
  created_at: EpochMilliseconds;
}

export type RecordedMethod =
  | { type: "cash" }
  | { type: "card" }
  | { type: "bank_transfer"; received_on: CalendarDate }
  | { type: "other" };

export type RecordedPaymentStatus =
  | { type: "active" }
  | { type: "voided"; by: AccountActor; reason: string; at: EpochMilliseconds };

export type RecordedRefundMethod =
  | { type: "cash" }
  | { type: "cash_with_identity_document"; number: string }
  | { type: "card" }
  | { type: "bank_transfer" }
  | { type: "other" };

export type StorefrontRecordedRefundMethod =
  | { type: "cash" }
  | { type: "card" }
  | { type: "bank_transfer" }
  | { type: "other" };

export interface RecordedRefundSent {
  recorded_by: AccountActor;
  reference: string;
  recorded_at: EpochMilliseconds;
  method: RecordedRefundMethod;
}

export interface RecordedRefundReturned {
  recorded_by: AccountActor;
  reference: string;
  recorded_at: EpochMilliseconds;
}

export type RecordedRefundStatus =
  | { type: "requested" }
  | ({ type: "sent" } & RecordedRefundSent)
  | {
      type: "returned";
      sent: RecordedRefundSent;
      returned: RecordedRefundReturned;
    }
  | { type: "cancelled"; by: AccountActor };

export interface RecordedRefund {
  id: string;
  money: Money;
  request: RefundRequest;
  status: RecordedRefundStatus;
  created_at: EpochMilliseconds;
}

export type DisputeResponse =
  { type: "due_at"; due_at: EpochMilliseconds } | { type: "not_allowed" };

export type DisputeStatus =
  | { type: "warning_needs_response"; response: DisputeResponse }
  | { type: "warning_under_review" }
  | { type: "warning_closed" }
  | { type: "needs_response"; response: DisputeResponse }
  | { type: "under_review" }
  | { type: "won" }
  | { type: "lost" }
  | { type: "prevented" };

export type DisputeBalanceChange =
  | { type: "withdrawn"; balance_transaction_id: string; money: Money }
  | { type: "reinstated"; balance_transaction_id: string; money: Money }
  | { type: "fee"; balance_transaction_id: string; money: Money };

export interface StripeDispute {
  id: string;
  stripe_dispute_id: string;
  money: Money;
  reason: string;
  status: DisputeStatus;
  balance_changes: DisputeBalanceChange[];
  created_at: EpochMilliseconds;
}

export type StripeCheckoutStatus =
  | { type: "pending" }
  | { type: "creating"; claim: ProviderOperationClaim }
  | { type: "unknown"; error: ProviderEffectError; retry_at: EpochMilliseconds }
  | { type: "open"; checkout_session_id: string }
  | { type: "closing"; checkout_session_id: string; call: ProviderCallStatus }
  | {
      type: "paid";
      payment_intent_id: string;
      charge_id: string;
      amount: number;
    }
  | { type: "expired" }
  | { type: "failed"; error: ProviderEffectError };

export interface StripeCheckoutPayment {
  return_url: string;
  expires_at: EpochMilliseconds;
  status: StripeCheckoutStatus;
  refunds: StripeRefund[];
  disputes: StripeDispute[];
  receipt_device: CardReceiptDevice;
}

export type CardPaymentPurpose = "renewal" | "card_update";

export type StripeCardPaymentStatus =
  | { type: "pending" }
  | { type: "charging"; claim: ProviderOperationClaim }
  | { type: "unknown"; error: ProviderEffectError; retry_at: EpochMilliseconds }
  | { type: "requires_action"; payment_intent_id: string }
  | { type: "closing"; payment_intent_id: string; call: ProviderCallStatus }
  | {
      type: "paid";
      payment_intent_id: string;
      charge_id: string;
      amount: number;
    }
  | { type: "cancelled"; payment_intent_id: string }
  | { type: "failed"; error: ProviderEffectError }
  | { type: "confirmed_not_made"; by: AccountActor };

export interface StripeCardPayment {
  payment_method: PackageMemberCard;
  purpose: CardPaymentPurpose;
  status: StripeCardPaymentStatus;
  refunds: StripeRefund[];
  disputes: StripeDispute[];
  receipt_device: CardReceiptDevice;
}

export type MonriCheckoutStatus =
  | { type: "pending" }
  | { type: "creating"; claim: ProviderOperationClaim }
  | { type: "unknown"; error: ProviderEffectError; retry_at: EpochMilliseconds }
  | { type: "open" }
  | { type: "paid"; transaction: MonriTransaction }
  | { type: "failed"; error: ProviderEffectError }
  | { type: "cancelled" };

export interface MonriCheckoutPayment {
  status: MonriCheckoutStatus;
  refunds: MonriRefund[];
  receipt_device: CardReceiptDevice;
}

export type MonriCardPaymentStatus =
  | { type: "pending" }
  | { type: "charging"; claim: ProviderOperationClaim }
  | { type: "unknown"; error: ProviderEffectError; retry_at: EpochMilliseconds }
  | { type: "paid"; transaction: MonriTransaction }
  | { type: "declined"; transaction: MonriTransaction }
  | { type: "failed"; error: ProviderEffectError }
  | { type: "confirmed_made"; transaction_id: string; by: AccountActor }
  | { type: "confirmed_not_made"; by: AccountActor };

export interface MonriCardPayment {
  payment_method: PackageMemberCard;
  purpose: CardPaymentPurpose;
  status: MonriCardPaymentStatus;
  refunds: MonriRefund[];
  receipt_device: CardReceiptDevice;
}

export interface RecordedPayment {
  method: RecordedMethod;
  reference: string | null;
  recorded_by: AccountActor;
  status: RecordedPaymentStatus;
  refunds: RecordedRefund[];
}

export type PaymentType =
  | ({ type: "stripe_checkout" } & StripeCheckoutPayment)
  | ({ type: "stripe_card" } & StripeCardPayment)
  | ({ type: "monri_checkout" } & MonriCheckoutPayment)
  | ({ type: "monri_card" } & MonriCardPayment)
  | ({ type: "recorded" } & RecordedPayment);

export type PaymentTypeName = PaymentType["type"];

export type PaymentHoldReason =
  | { type: "money_after_end" }
  | { type: "amount_mismatch"; collected: Money; expected: Money }
  | { type: "second_charge" }
  | { type: "unknown_provider_state"; object_id: string; state: string }
  | { type: "dispute_currency" }
  | { type: "staff_outcome_disagrees"; operation: "charge" | "refund" | "void" | "refund_not_made" }
  | { type: "refund_amount_mismatch"; refund_id: string; recorded: Money; reported: Money }
  | { type: "binding_mismatch"; intent_id: string }
  | { type: "refusal_disagrees"; http_status: number; intent_id: string; state: string }
  | { type: "unproven_card_attempt" };

export interface PaymentHold {
  id: string;
  reason: PaymentHoldReason;
  opened_at: EpochMilliseconds;
  status: PaymentHoldStatus;
}

export type PaymentHoldStatus =
  | { type: "open" }
  | { type: "resolved"; by: AccountActor; note: string; at: EpochMilliseconds };

export type PaymentVoid =
  | { type: "available" }
  | { type: "not_recorded" }
  | { type: "voided" }
  | { type: "refunded" }
  | { type: "receipted" };

export interface Payment {
  id: string;
  store_id: string;
  order_id: string;
  payment_option_id: string;
  payment_option_key: string;
  money: Money;
  type: PaymentType;
  holds: PaymentHold[];
  status: PaymentStatusName;
  void: PaymentVoid;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface StorefrontPayment {
  id: string;
  store_id: string;
  order_id: string;
  payment_option_id: string;
  payment_option_key: string;
  money: Money;
  type: StorefrontPaymentType;
  holds: StorefrontPaymentHold[];
  status: PaymentStatusName;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type StorefrontPaymentType =
  | ({ type: "stripe_checkout" } & StorefrontStripeCheckoutPayment)
  | ({ type: "stripe_card" } & StorefrontStripeCardPayment)
  | ({ type: "monri_checkout" } & StorefrontMonriCheckoutPayment)
  | ({ type: "monri_card" } & StorefrontMonriCardPayment)
  | ({ type: "recorded" } & StorefrontRecordedPayment);

export interface StorefrontStripeCheckoutPayment {
  return_url: string;
  expires_at: EpochMilliseconds;
  status: StorefrontStripeCheckoutStatus;
  refunds: StorefrontStripeRefund[];
  disputes: StripeDispute[];
}

export type StorefrontStripeCheckoutStatus =
  | { type: "pending" }
  | { type: "creating" }
  | { type: "unknown" }
  | { type: "open"; checkout_session_id: string }
  | { type: "closing"; checkout_session_id: string }
  | {
      type: "paid";
      payment_intent_id: string;
      charge_id: string;
      amount: number;
    }
  | { type: "expired" }
  | { type: "failed" };

export interface StorefrontStripeCardPayment {
  payment_method: PackageMemberSelfCard;
  purpose: CardPaymentPurpose;
  status: StorefrontStripeCardPaymentStatus;
  refunds: StorefrontStripeRefund[];
  disputes: StripeDispute[];
}

export type StorefrontStripeCardPaymentStatus =
  | { type: "pending" }
  | { type: "charging" }
  | { type: "unknown" }
  | { type: "requires_action"; payment_intent_id: string }
  | { type: "closing"; payment_intent_id: string }
  | {
      type: "paid";
      payment_intent_id: string;
      charge_id: string;
      amount: number;
    }
  | { type: "cancelled"; payment_intent_id: string }
  | { type: "failed" }
  | { type: "confirmed_not_made" };

export interface StorefrontMonriCheckoutPayment {
  status: StorefrontMonriCheckoutStatus;
  refunds: StorefrontMonriRefund[];
}

export type StorefrontMonriCheckoutStatus =
  | { type: "pending" }
  | { type: "creating" }
  | { type: "unknown" }
  | { type: "open" }
  | { type: "paid"; transaction: StorefrontMonriTransaction }
  | { type: "failed" }
  | { type: "cancelled" };

export interface StorefrontMonriTransaction {
  transaction_id: string;
  amount: number;
  created_at: EpochMilliseconds;
}

export interface StorefrontMonriCardPayment {
  payment_method: PackageMemberSelfCard;
  purpose: CardPaymentPurpose;
  status: StorefrontMonriCardPaymentStatus;
  refunds: StorefrontMonriRefund[];
}

export type StorefrontMonriCardPaymentStatus =
  | { type: "pending" }
  | { type: "charging" }
  | { type: "unknown" }
  | { type: "paid"; transaction: StorefrontMonriTransaction }
  | { type: "declined"; transaction: StorefrontMonriTransaction }
  | { type: "failed" }
  | { type: "confirmed_made"; transaction_id: string }
  | { type: "confirmed_not_made" };

export interface StorefrontRecordedPayment {
  method: RecordedMethod;
  status: StorefrontRecordedPaymentStatus;
  refunds: StorefrontRecordedRefund[];
}

export type StorefrontRecordedPaymentStatus =
  | { type: "active" }
  | { type: "voided"; at: EpochMilliseconds };

export interface StorefrontStripeRefund {
  id: string;
  money: Money;
  status: StorefrontStripeRefundStatus;
  created_at: EpochMilliseconds;
}

export type StorefrontStripeRefundStatus =
  | { type: "requested" }
  | { type: "creating" }
  | { type: "unknown"; stripe_refund_id: string | null }
  | { type: "pending"; stripe_refund_id: string }
  | {
      type: "succeeded";
      stripe_refund_id: string;
      balance_transaction_id: string;
    }
  | {
      type: "returned";
      stripe_refund_id: string;
      balance_transaction_id: string;
      failure_balance_transaction_id: string;
    }
  | { type: "failed"; stripe_refund_id: string }
  | { type: "cancelled"; stripe_refund_id: string }
  | { type: "refused" }
  | { type: "not_sent" };

export interface StorefrontMonriRefund {
  id: string;
  money: Money;
  status: StorefrontMonriRefundStatus;
  created_at: EpochMilliseconds;
}

export type StorefrontMonriRefundStatus =
  | { type: "requested" }
  | { type: "sending" }
  | { type: "unknown" }
  | { type: "succeeded"; transaction: StorefrontMonriTransaction }
  | { type: "declined"; transaction: StorefrontMonriTransaction }
  | { type: "not_sent" }
  | { type: "confirmed_made"; transaction_id: string }
  | { type: "confirmed_not_made" };

export interface StorefrontRecordedRefund {
  id: string;
  money: Money;
  status: StorefrontRecordedRefundStatus;
  created_at: EpochMilliseconds;
}

export interface StorefrontRecordedRefundSent {
  recorded_at: EpochMilliseconds;
  method: StorefrontRecordedRefundMethod;
}

export interface StorefrontRecordedRefundReturned {
  recorded_at: EpochMilliseconds;
}

export type StorefrontRecordedRefundStatus =
  | { type: "requested" }
  | ({ type: "sent" } & StorefrontRecordedRefundSent)
  | {
      type: "returned";
      sent: StorefrontRecordedRefundSent;
      returned: StorefrontRecordedRefundReturned;
    }
  | { type: "cancelled" };

export interface StorefrontPaymentHold {
  id: string;
  opened_at: EpochMilliseconds;
  status: StorefrontPaymentHoldStatus;
}

export type StorefrontPaymentHoldStatus =
  | { type: "open" }
  | { type: "resolved"; at: EpochMilliseconds };

export type PaymentStatusName =
  | "pending"
  | "open"
  | "requires_action"
  | "paid"
  | "expired"
  | "cancelled"
  | "declined"
  | "failed"
  | "unknown"
  | "closing"
  | "voided";

export interface MonriComponentsAction {
  type: "monri_components";
  environment: MonriEnvironment;
  authenticity_token: string;
  client_secret: string;
  save_card: boolean;
  runs_on: PaymentRunsOn;
}

export interface StripeEmbeddedCheckoutPaymentAction {
  type: "stripe_embedded_checkout";
  publishable_key: string;
  client_secret: string;
  expires_at: EpochMilliseconds;
  runs_on: PaymentRunsOn;
}

export type CheckoutPaymentAction =
  | { type: "none" }
  | StripeEmbeddedCheckoutPaymentAction
  | MonriComponentsAction;

export interface StripeEvent {
  event_type: string;
  object_id: string;
}

export interface ResendEvent {
  event_type: string;
  email_id: string;
  occurred_at: EpochMilliseconds;
  outgoing_message_id: string | null;
  message_id: string | null;
  recipients: string[];
  failure: EmailFailure | null;
}

export type MonriTransactionType =
  "authorize" | "purchase" | "capture" | "refund" | "void";

export type MonriTransactionStatus = "approved" | "declined";

export interface MonriTransactionFact {
  transaction_id: string;
  order_number: string;
  amount: number;
  currency: string;
  transaction_type: MonriTransactionType;
  status: MonriTransactionStatus;
  response_code: string;
  created_at: EpochMilliseconds;
}

export type TwilioCallStatus = "ringing" | "in_progress" | "completed" | "busy" | "no_answer" | "failed" | "canceled";

export type TwilioCallEvent =
  | { type: "incoming"; call_sid: string; from: string | null }
  | { type: "status"; call_sid: string; status: TwilioCallStatus }
  | { type: "menu_answered"; call_sid: string; step_key: string; digit: number | null }
  | { type: "ring_ended"; call_sid: string; step_key: string; answered: boolean }
  | { type: "recording_completed"; call_sid: string; recording_sid: string };

export type ElevenLabsCallEvent = { type: "transcription"; conversation_id: string };

export type PaymentIncomingWebhookType =
  | {
      type: "stripe_payments";
      store_id: string;
      payment_option_id: string;
      event: StripeEvent;
    }
  | {
      type: "monri_payments";
      store_id: string;
      payment_option_id: string;
      transaction: MonriTransactionFact;
    };

export type StoreResendIncomingWebhookType = { type: "store_resend"; store_id: string; login: ProviderLogin; event: ResendEvent };

export type NetworkResendIncomingWebhookType = {
  type: "network_resend";
  network_id: string;
  network_provider_id: string;
  event: ResendEvent;
};

export type StripeBillingIncomingWebhookType = {
  type: "stripe_billing";
  network_id: string;
  network_provider_id: string;
  event: StripeEvent;
};

export type TwilioCallIncomingWebhookType = {
  type: "twilio_call";
  store_id: string;
  login: ProviderLogin;
  phone_number_id: string;
  event: TwilioCallEvent;
};

export type ElevenLabsCallIncomingWebhookType = {
  type: "eleven_labs_call";
  store_id: string;
  login: ProviderLogin;
  conversation_message_id: string;
  event: ElevenLabsCallEvent;
};

export type IncomingWebhookType =
  | NetworkResendIncomingWebhookType
  | StoreResendIncomingWebhookType
  | PaymentIncomingWebhookType
  | StripeBillingIncomingWebhookType
  | TwilioCallIncomingWebhookType
  | ElevenLabsCallIncomingWebhookType;

export type IncomingWebhookTarget =
  | { type: "conversation_message"; conversation_message_id: string }
  | { type: "outgoing_message"; outgoing_message_id: string }
  | { type: "suppression"; suppression_id: string }
  | { type: "payment"; payment_id: string }
  | { type: "payment_method"; payment_method_id: string }
  | { type: "store_subscription"; store_subscription_id: string };

export type IncomingWebhookWaitReason =
  | { type: "received" }
  | { type: "unmatched"; reason: string }
  | { type: "retry"; reason: string };

export type IncomingWebhookStatus =
  | {
      type: "waiting";
      attempt: number;
      next_at: EpochMilliseconds;
      reason: IncomingWebhookWaitReason;
    }
  | { type: "processing"; attempt: number; until: EpochMilliseconds }
  | { type: "applied"; to: IncomingWebhookTarget; at: EpochMilliseconds }
  | { type: "ignored"; reason: string; at: EpochMilliseconds }
  | { type: "review"; reason: string; to: IncomingWebhookTarget | null };

export type IncomingWebhookStatusName =
  "waiting" | "unmatched" | "processing" | "applied" | "ignored" | "review";

export interface IncomingWebhookOf<Type extends IncomingWebhookType> {
  id: string;
  provider_event_id: string;
  type: Type;
  status: IncomingWebhookStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type IncomingWebhook = IncomingWebhookOf<IncomingWebhookType>;

export type PaymentIncomingWebhook = IncomingWebhookOf<PaymentIncomingWebhookType>;

export type StoreResendIncomingWebhook = IncomingWebhookOf<StoreResendIncomingWebhookType>;

export type NetworkResendIncomingWebhook = IncomingWebhookOf<NetworkResendIncomingWebhookType>;

export type StripeBillingIncomingWebhook = IncomingWebhookOf<StripeBillingIncomingWebhookType>;

export type TwilioCallIncomingWebhook = IncomingWebhookOf<TwilioCallIncomingWebhookType>;

export type ElevenLabsCallIncomingWebhook = IncomingWebhookOf<ElevenLabsCallIncomingWebhookType>;

export type IncomingWebhookResolution = "apply" | "ignore";

export interface FindPaymentOptionsParams {
  store_id: string;
  key?: string;
  type_name?: PaymentOptionTypeName;
  status?: PaymentOptionStatus;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface GetPaymentOptionParams {
  store_id: string;
  id: string;
}

export interface GetPaymentOptionByKeyParams {
  store_id: string;
  key: string;
}

export interface CreatePaymentOptionParams {
  store_id: string;
  id: string;
  key: string;
  blocks: Block[];
  type: "manual" | "cash_on_delivery";
  status: PaymentOptionStatus;
}

export interface CreateCardPaymentOptionParams {
  store_id: string;
  provider_id: string;
  id: string;
  key: string;
  blocks: Block[];
  status: PaymentOptionStatus;
  saved_card_terms: LocalizedMarkdown;
}

export interface UpdatePaymentOptionParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  blocks: Block[];
  status: PaymentOptionStatus;
  saved_card_terms: LocalizedMarkdown | null;
}

export type FindPaymentMethodsParams = (
  | (CommercePartyQuery & { payment_option_id?: never })
  | {
      customer_id?: never;
      company_id?: never;
      company_location_id?: never;
      payment_option_id?: string;
    }
) & {
  store_id: string;
  limit?: number;
  cursor?: string | null;
};

export interface GetPaymentMethodParams {
  store_id: string;
  id: string;
}

export interface RequestPaymentMethodSetupParams {
  store_id: string;
  id: string;
  owner: CommerceParty;
  payment_option_id: string;
  language: string;
  terms: string;
  accept_storage_and_off_session_use: true;
}

export interface CancelPaymentMethodSetupParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface RevokePaymentMethodParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export type StorefrontFindPaymentMethodsParams = CommercePartyQuery & {
  limit?: number;
  cursor?: string | null;
};

export interface StorefrontGetPaymentMethodParams {
  id: string;
}

export interface StorefrontRequestPaymentMethodSetupParams {
  id: string;
  owner: CommerceParty;
  payment_option_id: string;
  language: string;
  terms: string;
  accept_storage_and_off_session_use: true;
}

export interface StorefrontCancelPaymentMethodSetupParams {
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface StorefrontRevokePaymentMethodParams {
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindPaymentsParams {
  store_id: string;
  status?: PaymentStatusName;
  type?: PaymentTypeName;
  on_hold?: boolean;
  updated_at_from?: EpochMilliseconds;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface GetPaymentParams {
  store_id: string;
  id: string;
}

export interface RecordPaymentPart {
  id: string;
  payment_option_id: string;
  money: Money;
  method: RecordedMethod;
  reference: string | null;
}

export interface RecordPaymentsParams {
  store_id: string;
  order_id: string;
  fiscal_device_id: string | null;
  payments: RecordPaymentPart[];
}

export interface RecordedPayments {
  payments: Payment[];
  fiscal_receipts: FiscalReceipt[];
}

export interface VoidPaymentParams {
  store_id: string;
  payment_id: string;
  expected_updated_at: EpochMilliseconds;
  reason: string;
}

export interface AllocatePaymentRefundParams {
  store_id: string;
  payment_id: string;
  refund_id: string;
  expected_updated_at: EpochMilliseconds;
  application: RefundApplication;
}

export interface CreatePaymentRefundParams {
  store_id: string;
  payment_id: string;
  id: string;
  money: Money;
  reason: RefundReason;
  application: RefundApplication;
  notify_customer: boolean;
}

export interface RecordMadeRefundParams {
  store_id: string;
  payment_id: string;
  id: string;
  money: Money;
  reason: RefundReason;
  application: RefundApplication;
  notify_customer: boolean;
  transaction_id: string;
}

export type RefundReceiptInput =
  | { type: "sent"; reference: string; method: RecordedRefundMethod }
  | { type: "returned"; reference: string };

export interface RecordRefundReceiptParams {
  store_id: string;
  payment_id: string;
  refund_id: string;
  expected_updated_at: EpochMilliseconds;
  receipt: RefundReceiptInput;
}

export interface CancelPaymentRefundParams {
  store_id: string;
  payment_id: string;
  refund_id: string;
  expected_updated_at: EpochMilliseconds;
}

export type MonriConfirmation =
  { type: "made"; transaction_id: string } | { type: "not_made" };

export interface ResolvePaymentRefundParams {
  store_id: string;
  payment_id: string;
  refund_id: string;
  expected_updated_at: EpochMilliseconds;
  outcome: MonriConfirmation;
}

export type ChargeResolution =
  | { type: "made"; transaction_id: string }
  | { type: "payment_intent"; payment_intent_id: string }
  | { type: "not_made" };

export interface ResolvePaymentChargeParams {
  store_id: string;
  payment_id: string;
  expected_updated_at: EpochMilliseconds;
  outcome: ChargeResolution;
}

export interface ResolvePaymentHoldParams {
  store_id: string;
  payment_id: string;
  expected_updated_at: EpochMilliseconds;
  hold_id: string;
  note: string;
}

export interface FindIncomingWebhooksParams {
  store_id: string;
  payment_option_id: string;
  status: IncomingWebhookStatusName;
  limit?: number;
  cursor?: string | null;
}

export interface GetIncomingWebhookParams {
  store_id: string;
  id: string;
}

export interface ResolveIncomingWebhookParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  resolution: IncomingWebhookResolution;
}

export interface FindStripeBillingEventsParams {
  network_id: string;
  network_provider_id: string;
  status: IncomingWebhookStatusName;
  limit?: number;
  cursor?: string | null;
}

export interface ResolveStripeBillingEventParams {
  network_id: string;
  network_provider_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  resolution: IncomingWebhookResolution;
}

export interface FindResendEventsParams {
  network_id: string;
  network_provider_id: string;
  status: IncomingWebhookStatusName;
  limit?: number;
  cursor?: string | null;
}

export interface ResolveResendEventParams {
  network_id: string;
  network_provider_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  resolution: IncomingWebhookResolution;
  reason?: string | null;
}
