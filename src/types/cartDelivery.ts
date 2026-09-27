import type { CartDeliveryDestination, CartSubscriptionDelivery, DeliveryQuoteAcceptance, SubscriptionPlanStart } from "./api";
import type { SubscriptionDeliveryTerms, SubscriptionPlanSnapshot, SubscriptionPurchaseOccurrence } from "./commerce";
import type { TimeRange } from "./index";
import type { OrderDeliveryDestinationSnapshot, UnitSpan } from "./orderContract";
import type { QuotedShippingOffer } from "./quote";
import type { EpochMilliseconds } from "./time";

export interface FutureDeliveryChoice {
  id: string;
  entitlement_ids: string[];
  destination: CartDeliveryDestination;
  shipping_rate_id: string | null;
}

export interface FutureDeliveryPlanChoices {
  cart_line_item_id: string;
  deliveries: FutureDeliveryChoice[];
}

export interface AcceptedFutureDeliveryPlanChoices {
  cart_line_item_id: string;
  deliveries: CartSubscriptionDelivery[];
}

export interface QuoteCartFutureDeliveriesParams {
  store_id?: string;
  id: string;
  locale?: string;
  plans: FutureDeliveryPlanChoices[];
}

export interface AcceptCartFutureDeliveriesParams {
  store_id?: string;
  id: string;
  locale?: string;
  plans: AcceptedFutureDeliveryPlanChoices[];
}

export interface SubscriptionDeliveryEntitlementUnits {
  entitlement_id: string;
  units: UnitSpan;
}

export interface FutureDeliveryWindowBasis {
  window: TimeRange;
  entitlements: SubscriptionDeliveryEntitlementUnits[];
  base_merchandise_subtotal: number;
  weight_grams: number | null;
}

export interface FutureDeliveryBasis {
  choice: FutureDeliveryChoice;
  shipping_profile_id: string;
  windows: FutureDeliveryWindowBasis[];
}

export interface FutureDeliveryWindowOffers {
  basis: FutureDeliveryWindowBasis;
  offers: QuotedShippingOffer[];
}

export interface QuotedFutureDelivery {
  basis: FutureDeliveryBasis;
  destination: OrderDeliveryDestinationSnapshot;
  windows: FutureDeliveryWindowOffers[];
}

export type FutureDeliveryProposalStatus =
  | { type: "selection_required" }
  | { type: "ready"; terms: SubscriptionDeliveryTerms; quote_acceptance: DeliveryQuoteAcceptance };

export interface FutureDeliveryProposal {
  quote: QuotedFutureDelivery;
  status: FutureDeliveryProposalStatus;
}

export interface FutureDeliveryPlanQuote {
  cart_line_item_id: string;
  plan: SubscriptionPlanSnapshot;
  start: SubscriptionPlanStart;
  starts_at: EpochMilliseconds;
  occurrence: SubscriptionPurchaseOccurrence;
  deliveries: FutureDeliveryProposal[];
}

export interface CartFutureDeliveryQuote {
  cart: { cart_id: string; version: string };
  cart_version: string;
  quoted_at: EpochMilliseconds;
  plans: FutureDeliveryPlanQuote[];
}
