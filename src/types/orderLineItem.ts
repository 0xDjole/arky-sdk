import type { OrderAccessRevocation } from "./commerce";
import type { UnitSpan } from "./orderContract";
import type { EpochMilliseconds } from "./time";

export type OrderLineItemOrigin =
  | { type: "direct" }
  | {
      type: "customer_group";
      order_customer_group_line_item_id: string;
      benefit_id: string;
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
  | { type: "customer_group_member"; customer_group_member_id: string };

export type OrderAccessValidity =
  { type: "permanent" } | { type: "customer_group_purchase" };

export interface OrderAccess {
  recipient: OrderAccessRecipient;
  validity: OrderAccessValidity;
  revocation: OrderAccessRevocation | null;
}
