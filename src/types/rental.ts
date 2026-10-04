import type { AccountActor } from "./accountActor";
import type { SubscriptionProductSnapshot } from "./commerce";
import type { FulfillmentOrderMethod, RentalIssueReplacement } from "./index";
import type { EpochMilliseconds } from "./time";
import type { ReturnStatus } from "./return";

export type RentalActor =
  | { type: "account"; actor: AccountActor }
  | { type: "system" };

export type RentalStatus =
  | { type: "active" }
  | {
      type: "ending";
      requested_at: EpochMilliseconds;
      actor: RentalActor;
      reason: string;
      return_due_at: EpochMilliseconds | null;
    }
  | { type: "closed"; closed_at: EpochMilliseconds };

export interface Rental {
  id: string;
  store_id: string;
  subscription_id: string;
  creation_revision_id: string;
  creation_entitlement_id: string;
  subscription_plan_entitlement_id: string;
  terms_revision_id: string;
  status: RentalStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface RentalTerms {
  product_id: string;
  variant_id: string;
  quantity: number;
  inventory_item_id: string;
  snapshot: SubscriptionProductSnapshot;
}

export interface RentalDetail {
  rental: Rental;
  terms: RentalTerms;
}

export type RentalCommand =
  | {
      type: "request_replacement";
      fulfillment_order_id: string;
      fulfillment_order_line_id: string;
      replacement: RentalIssueReplacement;
      store_location_id: string;
      method: FulfillmentOrderMethod;
    }
  | {
      type: "end";
      reason: string;
      return_due_at: EpochMilliseconds | null;
    }
  | { type: "close" }
  | {
      type: "cancel_issue";
      fulfillment_order_id: string;
      fulfillment_order_line_id: string;
    };

export interface GetRentalParams {
  store_id: string;
  id: string;
}

export interface FindRentalsParams {
  store_id: string;
  subscription_id?: string;
  status?: RentalStatus["type"];
  limit?: number;
  cursor?: string;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
}

export interface ExecuteRentalParams extends GetRentalParams {
  request_id: string;
  expected_updated_at: EpochMilliseconds;
  type: RentalCommand;
}
export type CustomerRentalStatus =
  | { type: "active" }
  | { type: "ending"; requested_at: EpochMilliseconds; return_due_at: EpochMilliseconds | null }
  | { type: "closed"; closed_at: EpochMilliseconds };

export interface CustomerRental {
  id: string;
  subscription_id: string;
  product_key: string;
  variant_sku: string | null;
  quantity: number;
  status: CustomerRentalStatus;
  units: CustomerRentalUnit[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CustomerRentalUnit {
  inventory_unit_id: string;
  asset_tag: string;
  manufacturer_serial: string | null;
  deliveries: CustomerRentalUnitDelivery[];
  returns: CustomerRentalUnitReturn[];
}

export type CustomerRentalUnitDelivery =
  | {
      type: "allocated";
      fulfillment_order_id: string;
      fulfillment_order_line_id: string;
      fulfillment_unit_index: number;
    }
  | {
      type: "dispatched";
      fulfillment_order_id: string;
      fulfillment_order_line_id: string;
      fulfillment_unit_index: number;
      fulfillment_id: string;
      dispatched_at: EpochMilliseconds;
    }
  | {
      type: "delivered";
      fulfillment_order_id: string;
      fulfillment_order_line_id: string;
      fulfillment_unit_index: number;
      fulfillment_id: string;
      dispatched_at: EpochMilliseconds;
      delivered_at: EpochMilliseconds;
    };

export type RentalReturnDisposition = "restocked" | "written_off";

export type RentalReturnState =
  | { type: "awaiting_receipt" }
  | { type: "awaiting_inspection"; received_at: EpochMilliseconds }
  | {
      type: "inspected";
      inspected_at: EpochMilliseconds;
      disposition: RentalReturnDisposition;
    }
  | { type: "missing"; recorded_at: EpochMilliseconds }
  | { type: "cancelled" }
  | { type: "declined" };

export interface CustomerRentalUnitReturn {
  return_id: string;
  status: ReturnStatus;
  state: RentalReturnState;
}

export interface FindCustomerRentalsParams {
  subscription_id: string;
  limit?: number;
  cursor?: string;
}
