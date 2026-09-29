import type { OrderAccessRevocation } from "./commerce";
import type { UnitSpan } from "./orderContract";
import type { EpochMilliseconds } from "./time";
import type { OrderLineItemRef } from "./checkout";

export interface RevokeOrderAccessParams {
  store_id: string;
  order_id: string;
  request_id: string;
  line: Extract<OrderLineItemRef, { type: "digital_product" | "subscription_plan" | "purchase_access" }>;
  effective_at: EpochMilliseconds;
  reason: string;
}

export type OrderLineItemOrigin =
  | { type: "direct" }
  | {
      type: "subscription";
      order_subscription_line_item_id: string;
      entitlement_id: string;
    };

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
