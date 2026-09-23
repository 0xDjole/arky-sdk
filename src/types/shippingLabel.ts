import type {
  CustomsDeclaration,
  Money,
  Parcel,
  PostalAddress,
  ProviderEffectError,
  ProviderOperationClaim,
} from "./index";
import type { ReconciliationState } from "./orderContract";
import type { CommerceProviderObservation } from "./payment";
import type { EpochMilliseconds } from "./time";

export type ShippingLabelOwner =
  | { type: "outbound_shipment"; shipment_id: string }
  | { type: "return"; return_id: string };

export type ShippingLabelQuoteOwner =
  | { type: "outbound_shipment"; shipment_id: string }
  | {
      type: "return";
      return_id: string;
      origin: PostalAddress;
      parcel: Parcel;
      customs: CustomsDeclaration | null;
    };

export interface ShippingLabelRequest {
  origin: PostalAddress;
  destination: PostalAddress;
  parcel: Parcel;
  customs: CustomsDeclaration | null;
  accepted_at: EpochMilliseconds;
}

export type ShippingLabelStatus =
  | { type: "requested"; requested_at: EpochMilliseconds }
  | { type: "processing"; claim: ProviderOperationClaim }
  | {
      type: "succeeded";
      transaction_id: string;
      label_url: string;
      completed_at: EpochMilliseconds;
    }
  | {
      type: "rejected";
      transaction_id: string | null;
      error: ProviderEffectError;
      completed_at: EpochMilliseconds;
    }
  | { type: "failed"; error: ProviderEffectError; completed_at: EpochMilliseconds }
  | {
      type: "unknown";
      claim: ProviderOperationClaim;
      transaction_id: string | null;
      error: ProviderEffectError;
    };

export type MerchantBalanceDirection = { type: "debit" } | { type: "credit" };

export interface MerchantBalanceEffect {
  effect_id: string;
  money: Money;
  direction: MerchantBalanceDirection;
  reverses_effect_id: string | null;
  observation: CommerceProviderObservation;
}

export type MerchantDebitStatus =
  | { type: "requested"; requested_at: EpochMilliseconds }
  | { type: "processing"; claim: ProviderOperationClaim }
  | {
      type: "succeeded";
      account_debit_payment_id: string;
      source_transfer_id: string;
      completed_at: EpochMilliseconds;
    }
  | {
      type: "rejected";
      account_debit_payment_id: string | null;
      source_transfer_id: string | null;
      error: ProviderEffectError;
      completed_at: EpochMilliseconds;
    }
  | { type: "failed"; error: ProviderEffectError; completed_at: EpochMilliseconds }
  | {
      type: "unknown";
      claim: ProviderOperationClaim;
      account_debit_payment_id: string | null;
      source_transfer_id: string | null;
      error: ProviderEffectError;
    };

export interface StripePlatformDebitAuthorization {
  accepted_by_account_id: string;
  accepted_at: EpochMilliseconds;
  terms_version: number;
}

export interface MerchantDebit {
  id: string;
  store_id: string;
  shipping_label_id: string;
  payment_provider_id: string;
  connected_account_id: string;
  authorization: StripePlatformDebitAuthorization;
  status: MerchantDebitStatus;
  money: Money;
  idempotency_key: string;
  livemode: boolean;
  financial_effects: MerchantBalanceEffect[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface ShippingLabel {
  id: string;
  store_id: string;
  rate_id: string;
  metadata: string;
  postage: Money;
  platform_label_fee: Money;
  status: ShippingLabelStatus;
  owner: ShippingLabelOwner;
  request: ShippingLabelRequest;
  operation_id: string;
  idempotency_key: string;
  fee_refundable_if_unused: boolean;
  provider_scope: string;
  reconciliation: ReconciliationState;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface ShippingLabelPurchase {
  label: ShippingLabel;
  merchant_debit: MerchantDebit | null;
}

export interface ShippingLabelRequestResolution {
  store_id: string;
  shipping_label_id: string;
  owner: ShippingLabelOwner;
  quote_digest: string;
  result: { type: "accepted"; purchase: ShippingLabelPurchase } | { type: "not_accepted" };
}

export interface ShippingLabelQuoteRate {
  quote: string;
  carrier: string;
  service: string;
  display_name: string;
  postage: Money;
  platform_label_fee: Money;
  total: Money;
  fee_refundable_if_unused: boolean;
  estimated_days: number | null;
  expires_at: EpochMilliseconds;
}

export interface QuoteShippingLabelParams {
  store_id?: string;
  owner: ShippingLabelQuoteOwner;
}

export interface RequestShippingLabelParams {
  store_id?: string;
  shipping_label_id: string;
  quote: string;
}

export interface GetShippingLabelParams {
  store_id?: string;
  shipping_label_id: string;
}

export interface FindShippingLabelsParams {
  store_id?: string;
  owner: ShippingLabelOwner;
  limit?: number;
  cursor?: string;
}

export type ShippingLabelRefundStatus =
  | { type: "requested"; requested_at: EpochMilliseconds }
  | { type: "processing"; claim: ProviderOperationClaim }
  | {
      type: "succeeded";
      carrier_refund_id: string | null;
      completed_at: EpochMilliseconds;
    }
  | {
      type: "rejected";
      carrier_refund_id: string | null;
      error: ProviderEffectError;
      completed_at: EpochMilliseconds;
    }
  | { type: "failed"; error: ProviderEffectError; completed_at: EpochMilliseconds }
  | {
      type: "unknown";
      claim: ProviderOperationClaim;
      carrier_refund_id: string | null;
      error: ProviderEffectError;
    };

export type CarrierRefundEffect =
  | {
      type: "received";
      effect_id: string;
      money: Money;
      observation: CommerceProviderObservation;
      observed_at: EpochMilliseconds;
    }
  | {
      type: "reversed";
      effect_id: string;
      received_effect_id: string;
      money: Money;
      observation: CommerceProviderObservation;
      observed_at: EpochMilliseconds;
    };

export interface ShippingLabelRefund {
  id: string;
  store_id: string;
  shipping_label_id: string;
  status: ShippingLabelRefundStatus;
  idempotency_key: string;
  requested_money: Money;
  financial_effects: CarrierRefundEffect[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type ShippingLabelRefundStatusName =
  "requested" | "processing" | "succeeded" | "rejected" | "failed" | "unknown";

export interface RequestShippingLabelRefundParams {
  store_id?: string;
  shipping_label_id: string;
}

export interface GetShippingLabelRefundParams {
  store_id?: string;
  shipping_label_refund_id: string;
}

export interface FindShippingLabelRefundsParams {
  store_id?: string;
  shipping_label_id?: string;
  status?: { type: ShippingLabelRefundStatusName };
  limit?: number;
  cursor?: string;
}

export type MerchantDebitReversalReason =
  | { type: "label_purchase_failed" }
  | { type: "unused_label_refund"; shipping_label_refund_id: string };

export type MerchantDebitReversalStatus =
  | { type: "requested"; requested_at: EpochMilliseconds }
  | { type: "processing"; claim: ProviderOperationClaim }
  | {
      type: "succeeded";
      transfer_reversal_id: string;
      destination_payment_refund_id: string;
      completed_at: EpochMilliseconds;
    }
  | {
      type: "rejected";
      transfer_reversal_id: string | null;
      destination_payment_refund_id: string | null;
      error: ProviderEffectError;
      completed_at: EpochMilliseconds;
    }
  | { type: "failed"; error: ProviderEffectError; completed_at: EpochMilliseconds }
  | {
      type: "unknown";
      claim: ProviderOperationClaim;
      transfer_reversal_id: string | null;
      destination_payment_refund_id: string | null;
      error: ProviderEffectError;
    };

export interface MerchantDebitReversal {
  id: string;
  store_id: string;
  reason: MerchantDebitReversalReason;
  status: MerchantDebitReversalStatus;
  money: Money;
  idempotency_key: string;
  merchant_debit_id: string;
  financial_effects: MerchantBalanceEffect[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface RequestMerchantDebitReversalParams {
  store_id?: string;
  merchant_debit_reversal_id: string;
  merchant_debit_id: string;
  reason: MerchantDebitReversalReason;
  money: Money;
}

export interface GetMerchantDebitReversalParams {
  store_id?: string;
  merchant_debit_reversal_id: string;
}

export interface FindMerchantDebitReversalsParams {
  store_id?: string;
  merchant_debit_id?: string;
  limit?: number;
  cursor?: string;
}
