import type { AccountActor } from "./accountActor";
import type { CustomerGroupProductSnapshot } from "./commerce";
import type { FulfillmentOrderMethod } from "./index";
import type { EpochMilliseconds } from "./time";

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
  customer_group_subscription_id: string;
  customer_group_plan_benefit_id: string;
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
  snapshot: CustomerGroupProductSnapshot;
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
      predecessor_placement_id: string;
      store_location_id: string;
      method: FulfillmentOrderMethod;
      overlap_authorized: boolean;
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
  store_id?: string;
  id: string;
}

export interface FindRentalsParams {
  store_id?: string;
  customer_group_subscription_id?: string;
  status?: RentalStatus["type"];
  limit?: number;
  cursor?: string;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
}

export interface ExecuteRentalParams extends GetRentalParams {
  command_id: string;
  expected_updated_at: EpochMilliseconds;
  type: RentalCommand;
}
