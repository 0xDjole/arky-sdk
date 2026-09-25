import type { UnitSpan } from "./orderContract";
import type { OrderQuote } from "./quote";

export type CartLineItemRef =
  | { type: "product"; line_item_id: string }
  | { type: "booking"; line_item_id: string }
  | { type: "digital_product"; line_item_id: string }
  | { type: "subscription_plan"; line_item_id: string };

export type OrderLineItemRef =
  | CartLineItemRef
  | { type: "rental_use"; line_item_id: string };

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
