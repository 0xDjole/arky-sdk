import type { EpochMilliseconds } from "./time";
import type { Block } from "./block";
import type {
  AccountActor,
  Actor,
  CommerceParty,
  CommercePartyQuery,
  Money,
  ProviderEffectError,
  ProviderOperationClaim,
  SortDirection,
} from "./common";
import type { CustomerGroupMemberPaymentMethod } from "./customerGroup";
import type { EmailFailure } from "./notification";

export type MonriEnvironment = "test" | "live";

export interface StripeSigningSecretOverlap {
  expires_at: EpochMilliseconds;
}

export interface StripeWebhookEndpoint {
  endpoint_id: string;
  endpoint_url: string;
  api_version: string;
  enabled_events: string[];
  previous_signing_secret: StripeSigningSecretOverlap | null;
}

export type StripeWebhook =
  | { type: "not_created" }
  | ({ type: "awaiting_first_event" } & StripeWebhookEndpoint)
  | ({ type: "verified" } & StripeWebhookEndpoint);

export interface StripeConnection {
  account_id: string;
  livemode: boolean;
  publishable_key: string;
  charges_enabled: boolean;
  account_checked_at: EpochMilliseconds;
  webhook: StripeWebhook;
}

export interface MonriConnection {
  environment: MonriEnvironment;
}

export type PaymentOptionType =
  | { type: "cash_on_delivery" }
  | { type: "manual" }
  | ({ type: "stripe" } & StripeConnection)
  | ({ type: "monri" } & MonriConnection);

export type PaymentOptionTypeName = PaymentOptionType["type"];

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
  type: PaymentOptionTypeName;
}

export interface PaymentMethodConsent {
  given_by: Actor;
  accepted_at: EpochMilliseconds;
  terms_version: string;
}

export interface PaymentMethodConsentText {
  terms_version: string;
  language: string;
  text: string;
}

export type CardDetails =
  | { type: "card"; brand: string; last4: string; exp_month: number; exp_year: number }
  | { type: "sepa_debit"; last4: string; mandate_reference: string };

export type CardRemoval =
  | { type: "revoked"; by: Actor }
  | { type: "detached_at_stripe" };

export type StripeCardSetup =
  | { type: "from_payment"; payment_id: string }
  | { type: "dedicated" };

export type StripeCardStatus =
  | { type: "requested" }
  | { type: "creating_customer"; claim: ProviderOperationClaim }
  | { type: "creating_setup"; customer_id: string; claim: ProviderOperationClaim }
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
      mandate_id: string | null;
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

export type MonriCardStatus =
  | { type: "requested" }
  | { type: "ready"; token: MonriCardToken; details: CardDetails }
  | { type: "failed" }
  | { type: "cancelled"; by: Actor }
  | { type: "removed"; details: CardDetails; reason: CardRemoval };

export interface MonriCard {
  payment_id: string;
  status: MonriCardStatus;
}

export type PaymentMethodType =
  | ({ type: "stripe" } & StripeCard)
  | ({ type: "monri" } & MonriCard);

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
  client_secret: string;
  publishable_key: string;
}

export type ProviderCallStatus =
  | { type: "requested" }
  | { type: "sending"; claim: ProviderOperationClaim }
  | { type: "unknown"; error: ProviderEffectError; retry_at: EpochMilliseconds }
  | { type: "refused"; error: ProviderEffectError }
  | { type: "not_sent"; error: ProviderEffectError };

export type RefundReason =
  | "customer_request"
  | "duplicate"
  | "fraudulent"
  | "store_closure"
  | "recording_mistake"
  | "other";

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
}

export type StripeRefundSource =
  | ({ type: "account" } & RefundRequest)
  | { type: "stripe"; reason: string };

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
  | { type: "requires_action"; stripe_refund_id: string; action_reference: string }
  | { type: "succeeded"; stripe_refund_id: string; balance_transaction_id: string }
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

export type RecordedStatus = "open" | "cancelled";

export interface RecordedCollection {
  id: string;
  money: Money;
  recorded_by: AccountActor;
  reference: string | null;
  recorded_at: EpochMilliseconds;
}

export type RecordedRefundReceipt =
  | {
      type: "sent";
      id: string;
      money: Money;
      allocations: RefundAllocation[];
      recorded_by: AccountActor;
      reference: string;
      recorded_at: EpochMilliseconds;
    }
  | {
      type: "returned";
      id: string;
      sent_id: string;
      money: Money;
      recorded_by: AccountActor;
      reference: string;
      recorded_at: EpochMilliseconds;
    };

export interface RecordedRefund {
  id: string;
  money: Money;
  request: RefundRequest;
  status: RecordedStatus;
  receipts: RecordedRefundReceipt[];
  created_at: EpochMilliseconds;
}

export type DisputeResponse =
  | { type: "due_at"; due_at: EpochMilliseconds }
  | { type: "not_allowed" };

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
  | { type: "awaiting_money"; payment_intent_id: string }
  | { type: "paid"; payment_intent_id: string; charge_id: string; amount: number }
  | { type: "expired" }
  | { type: "failed"; error: ProviderEffectError };

export interface StripeCheckoutPayment {
  return_url: string;
  expires_at: EpochMilliseconds;
  status: StripeCheckoutStatus;
  refunds: StripeRefund[];
  disputes: StripeDispute[];
}

export type CardPaymentPurpose = "renewal" | "card_update";

export type StripeCardPaymentStatus =
  | { type: "pending" }
  | { type: "charging"; claim: ProviderOperationClaim }
  | { type: "unknown"; error: ProviderEffectError; retry_at: EpochMilliseconds }
  | { type: "processing"; payment_intent_id: string }
  | { type: "needs_customer"; payment_intent_id: string }
  | { type: "closing"; payment_intent_id: string; call: ProviderCallStatus }
  | { type: "paid"; payment_intent_id: string; charge_id: string; amount: number }
  | { type: "cancelled"; payment_intent_id: string }
  | { type: "failed"; error: ProviderEffectError };

export interface StripeCardPayment {
  payment_method: CustomerGroupMemberPaymentMethod;
  purpose: CardPaymentPurpose;
  status: StripeCardPaymentStatus;
  refunds: StripeRefund[];
  disputes: StripeDispute[];
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
  payment_method: CustomerGroupMemberPaymentMethod;
  purpose: CardPaymentPurpose;
  status: MonriCardPaymentStatus;
  refunds: MonriRefund[];
}

export interface RecordedPayment {
  status: RecordedStatus;
  collections: RecordedCollection[];
  refunds: RecordedRefund[];
}

export type ManualRequest =
  | { type: "at_checkout" }
  | { type: "later"; by: AccountActor };

export interface ManualPayment {
  requested: ManualRequest;
  reference: string | null;
  status: RecordedStatus;
  collections: RecordedCollection[];
  refunds: RecordedRefund[];
}

export type PaymentType =
  | ({ type: "stripe_checkout" } & StripeCheckoutPayment)
  | ({ type: "stripe_card" } & StripeCardPayment)
  | ({ type: "monri_checkout" } & MonriCheckoutPayment)
  | ({ type: "monri_card" } & MonriCardPayment)
  | ({ type: "cash_on_delivery" } & RecordedPayment)
  | ({ type: "manual" } & ManualPayment);

export type PaymentTypeName = PaymentType["type"];

export interface PaymentHold {
  message: string;
  opened_at: EpochMilliseconds;
}

export interface Payment {
  id: string;
  store_id: string;
  order_id: string;
  payment_option_id: string;
  money: Money;
  type: PaymentType;
  holds: PaymentHold[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type PaymentStatusName =
  | "pending"
  | "open"
  | "awaiting_money"
  | "processing"
  | "needs_customer"
  | "paid"
  | "expired"
  | "cancelled"
  | "declined"
  | "failed"
  | "unknown"
  | "closing";

export interface MonriComponentsAction {
  type: "monri_components";
  environment: MonriEnvironment;
  authenticity_token: string;
  client_secret: string;
  save_card: boolean;
}

export interface StripeEmbeddedCheckoutPaymentAction {
  type: "stripe_embedded_checkout";
  publishable_key: string;
  client_secret: string;
  expires_at: EpochMilliseconds;
}

export type CheckoutPaymentAction =
  | { type: "none" }
  | StripeEmbeddedCheckoutPaymentAction
  | MonriComponentsAction;

export interface CheckoutPayment {
  payment: Payment;
  payment_action: CheckoutPaymentAction;
}

export interface StripeEvent {
  event_type: string;
  object_id: string;
}

export interface ResendEvent {
  event_type: string;
  email_id: string;
  occurred_at: EpochMilliseconds;
  notification_id: string | null;
  store_id: string | null;
  message_id: string | null;
  recipients: string[];
  failure: EmailFailure | null;
}

export type MonriTransactionType = "authorize" | "purchase" | "capture" | "refund" | "void";

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

export type ProviderEventType =
  | { type: "stripe_payments"; store_id: string; payment_option_id: string; event: StripeEvent }
  | {
      type: "monri_payments";
      store_id: string;
      payment_option_id: string;
      transaction: MonriTransactionFact;
    }
  | { type: "stripe_billing"; event: StripeEvent }
  | { type: "resend"; event: ResendEvent };

export type ProviderEventTarget =
  | { type: "conversation_message"; conversation_message_id: string }
  | { type: "notification"; notification_id: string }
  | { type: "email_suppression"; email_suppression_id: string }
  | { type: "payment"; payment_id: string }
  | { type: "payment_method"; payment_method_id: string }
  | { type: "store_subscription"; store_subscription_id: string };

export type ProviderEventWaitReason =
  | { type: "new" }
  | { type: "unmatched"; reason: string }
  | { type: "retry"; reason: string };

export type ProviderEventStatus =
  | { type: "waiting"; attempt: number; next_at: EpochMilliseconds; reason: ProviderEventWaitReason }
  | { type: "processing"; attempt: number; until: EpochMilliseconds }
  | { type: "applied"; to: ProviderEventTarget; at: EpochMilliseconds }
  | { type: "ignored"; reason: string; at: EpochMilliseconds }
  | { type: "review"; reason: string; to: ProviderEventTarget | null };

export type ProviderEventStatusName = "waiting" | "unmatched" | "processing" | "applied" | "ignored" | "review";

export interface ProviderEvent {
  id: string;
  provider_event_id: string;
  type: ProviderEventType;
  status: ProviderEventStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type ProviderEventResolution = "apply" | "ignore";

export interface FindPaymentOptionsParams {
  store_id: string;
  key?: string;
  type_name?: PaymentOptionTypeName;
  status?: PaymentOptionStatus;
  sort_field?: "key" | "created_at" | "updated_at";
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

export interface CreateMonriPaymentOptionParams {
  store_id: string;
  id: string;
  key: string;
  blocks: Block[];
  status: PaymentOptionStatus;
  environment: MonriEnvironment;
  merchant_key: string;
  authenticity_token: string;
}

export interface ConnectStripePaymentOptionParams {
  store_id: string;
  id: string;
  key: string;
  blocks: Block[];
  status: PaymentOptionStatus;
  restricted_key: string;
  publishable_key: string;
}

export interface UpdatePaymentOptionParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  blocks: Block[];
  status: PaymentOptionStatus;
}

export interface CreateStripeWebhookParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface RotateStripeWebhookSecretParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  signing_secret: string;
  previous_secret_expires_at: EpochMilliseconds | null;
}

export interface ReplaceStripeKeysParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  restricted_key: string;
  publishable_key: string;
}

export interface RefreshStripePaymentOptionParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export type FindPaymentMethodsParams = (
  | (CommercePartyQuery & { payment_option_id?: never })
  | { customer_id?: never; company_id?: never; company_location_id?: never; payment_option_id?: string }
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
  terms_version: string;
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

export interface GetPaymentMethodConsentTextParams {
  store_id: string;
  terms_version: string;
}

export interface StorefrontGetPaymentMethodConsentTextParams {
  terms_version: string;
}

export interface StorefrontCurrentPaymentMethodConsentTextParams {
  language: string;
}

export interface StorefrontRequestPaymentMethodSetupParams {
  id: string;
  owner: CommerceParty;
  payment_option_id: string;
  terms_version: string;
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
  order_id?: string;
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

export interface CreateManualPaymentParams {
  store_id: string;
  id: string;
  order_id: string;
  payment_option_id: string;
  money: Money;
  reference: string | null;
}

export interface RecordPaymentCollectionParams {
  store_id: string;
  payment_id: string;
  id: string;
  money: Money;
  reference: string | null;
}

export interface CreatePaymentRefundParams {
  store_id: string;
  payment_id: string;
  id: string;
  money: Money;
  reason: RefundReason;
  application: RefundApplication;
}

export type RefundReceiptInput =
  | { type: "sent"; money: Money; allocations: RefundAllocation[]; reference: string }
  | { type: "returned"; sent_id: string; money: Money; reference: string };

export interface RecordRefundReceiptParams {
  store_id: string;
  payment_id: string;
  refund_id: string;
  id: string;
  receipt: RefundReceiptInput;
}

export interface CancelPaymentRefundParams {
  store_id: string;
  payment_id: string;
  refund_id: string;
  expected_updated_at: EpochMilliseconds;
}

export type MonriConfirmation =
  | { type: "made"; transaction_id: string }
  | { type: "not_made" };

export interface ResolvePaymentRefundParams {
  store_id: string;
  payment_id: string;
  refund_id: string;
  expected_updated_at: EpochMilliseconds;
  outcome: MonriConfirmation;
}

export interface ResolvePaymentChargeParams {
  store_id: string;
  payment_id: string;
  expected_updated_at: EpochMilliseconds;
  outcome: MonriConfirmation;
}

export interface ResolvePaymentHoldParams {
  store_id: string;
  payment_id: string;
  expected_updated_at: EpochMilliseconds;
  index: number;
}

export interface CancelPaymentParams {
  store_id: string;
  payment_id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindProviderEventsParams {
  store_id: string;
  status?: ProviderEventStatusName;
  limit?: number;
  cursor?: string | null;
}

export interface GetProviderEventParams {
  store_id: string;
  id: string;
}

export interface ResolveProviderEventParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  resolution: ProviderEventResolution;
}

export interface FindStripeBillingEventsParams {
  status: ProviderEventStatusName;
  limit?: number;
  cursor?: string | null;
}

export interface ResolveStripeBillingEventParams {
  id: string;
  expected_updated_at: EpochMilliseconds;
  resolution: ProviderEventResolution;
}
