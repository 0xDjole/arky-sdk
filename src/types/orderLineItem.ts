import type { OrderAccessRevocation } from "./commerce";
import type { UnitSpan } from "./orderContract";
import type { EpochMilliseconds } from "./time";

export type OrderLineItemOrigin =
  | { type: "direct" }
  | {
      type: "subscription";
      order_subscription_line_item_id: string;
      entitlement_id: string;
    };

export interface OrderProductLocationAllocation {
  store_location_id: string;
  quantity: number;
  cancelled_quantity: number;
  fulfillment_order_id: string;
  fulfillment_order_line_id: string;
  order_delivery_group_id: string;
  unit_spans: UnitSpan[];
}

export interface AcceptedFormSubmission {
  source_submission_id: string;
  source_form_id: string;
  form_version: string;
  values: Record<string, unknown>;
  accepted_at: EpochMilliseconds;
}

export type OrderAccessRecipient =
  | { type: "customer"; customer_id: string }
  | { type: "company"; company_id: string };

export type OrderAccessValidity =
  { type: "permanent" } | { type: "subscription_purchase" };

export interface OrderAccess {
  recipient: OrderAccessRecipient;
  validity: OrderAccessValidity;
  revocation: OrderAccessRevocation | null;
}
