import type { PurchaseOriginSnapshot, UnitSpan } from "./orderContract";
import type { EpochMilliseconds } from "./time";
import type { OrderQuote } from "./quote";

export type CartLineItemRef =
  | { type: "product"; line_item_id: string }
  | { type: "booking"; line_item_id: string }
  | { type: "digital_product"; line_item_id: string }
  | { type: "customer_group_plan"; line_item_id: string };

export type OrderLineItemRef = CartLineItemRef;

export interface CheckoutCartVersion {
  cart_id: string;
  version: string;
}

export interface CheckoutLineBinding {
  cart_id: string;
  cart_line_item: CartLineItemRef;
  cart_units: UnitSpan;
  order_line_item: OrderLineItemRef;
  order_units: UnitSpan;
}

export interface CheckoutQuoteDeliveryBinding {
  cart_id: string;
  cart_delivery_group_id: string;
  delivery_group_id: string;
}

export interface CheckoutQuoteSources {
  carts: CheckoutCartVersion[];
  lines: CheckoutLineBinding[];
  delivery_groups: CheckoutQuoteDeliveryBinding[];
}

export interface CheckoutQuote {
  sources: CheckoutQuoteSources | null;
  order: OrderQuote;
  presentation_digest: string;
}

export interface CheckoutResult {
  order_id: string;
  bindings: CheckoutLineBinding[];
}

export type CheckoutState =
  | { type: "preparing" }
  | { type: "accepted"; accepted_at: EpochMilliseconds; result: CheckoutResult }
  | { type: "rejected"; reason: string; ended_at: EpochMilliseconds }
  | { type: "aborted"; reason: string; ended_at: EpochMilliseconds };

export interface Checkout {
  id: string;
  store_id: string;
  customer_id: string;
  carts: CheckoutCartVersion[];
  request_id: string;
  fingerprint_version: number;
  request_fingerprint: string;
  actor: PurchaseOriginSnapshot;
  state: CheckoutState;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface GetCheckoutParams {
  store_id?: string;
  id: string;
}
