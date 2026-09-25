import type { AccountActor } from "./accountActor";
import type { EpochMilliseconds } from "./time";

export interface RentalPlacementIssue {
  fulfillment_order_id: string;
  fulfillment_order_line_id: string;
  fulfillment_unit_index: number;
}

export type RentalPlacementExecutionSource =
  | { type: "shipment"; shipment_id: string }
  | { type: "pickup"; pickup_id: string };

export interface RentalPlacementExecution {
  source: RentalPlacementExecutionSource;
  executed_at: EpochMilliseconds;
}

export type RentalPlacementStatus =
  | { type: "assigned" }
  | { type: "cancelled"; cancelled_at: EpochMilliseconds }
  | { type: "in_transit"; execution: RentalPlacementExecution }
  | {
      type: "with_customer";
      execution: RentalPlacementExecution;
      handed_over_at: EpochMilliseconds;
    }
  | {
      type: "return_requested";
      execution: RentalPlacementExecution;
      handed_over_at: EpochMilliseconds | null;
      return_id: string;
    }
  | {
      type: "returned";
      execution: RentalPlacementExecution;
      handed_over_at: EpochMilliseconds | null;
      return_id: string;
      return_component_id: string;
      received_at: EpochMilliseconds;
    }
  | {
      type: "lost";
      execution: RentalPlacementExecution;
      handed_over_at: EpochMilliseconds | null;
      actor: AccountActor;
      reason: string;
      lost_at: EpochMilliseconds;
    };

export interface RentalPlacement {
  id: string;
  store_id: string;
  rental_id: string;
  inventory_unit_id: string;
  issue: RentalPlacementIssue;
  status: RentalPlacementStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type RentalPlacementCommand =
  | { type: "confirm_handover"; handed_over_at: EpochMilliseconds }
  | { type: "mark_lost"; reason: string };

export interface GetRentalPlacementParams {
  store_id?: string;
  id: string;
}

export interface FindRentalPlacementsParams {
  store_id?: string;
  rental_id?: string;
  inventory_unit_id?: string;
  status?: RentalPlacementStatus["type"];
  limit?: number;
  cursor?: string;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
}

export interface ExecuteRentalPlacementParams extends GetRentalPlacementParams {
  command_id: string;
  expected_updated_at: EpochMilliseconds;
  type: RentalPlacementCommand;
}
