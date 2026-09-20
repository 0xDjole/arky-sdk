import type { AccountActor } from "./accountActor";
import type { EpochMilliseconds } from "./time";

export interface UnitSpan {
  first_unit: number;
  quantity: number;
}

export interface InventoryLevel {
  id: string;
  store_id: string;
  inventory_item_id: string;
  store_location_id: string;
  on_hand: number;
  reserved: number;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CreateInventoryLevelParams {
  store_id?: string;
  inventory_item_id: string;
  store_location_id: string;
}

export interface GetInventoryLevelParams {
  store_id?: string;
  id: string;
}

export interface RemoveInventoryLevelParams extends GetInventoryLevelParams {
  expected_updated_at: EpochMilliseconds;
}

export interface FindInventoryLevelsParams {
  store_id?: string;
  inventory_item_id?: string;
  store_location_id?: string;
  limit?: number;
  cursor?: string;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
}

export type InventoryMovementReason =
  | { type: "receiving"; reference: string | null }
  | { type: "adjustment"; actor: AccountActor; reason: string }
  | { type: "fulfillment"; order_id: string; fulfillment_order_id: string }
  | { type: "return_restock"; return_id: string }
  | { type: "damage"; reference: string | null }
  | { type: "transfer_in"; inventory_transfer_id: string }
  | { type: "transfer_out"; inventory_transfer_id: string };

export type ManualInventoryMovementReason =
  | { type: "receiving"; reference: string | null }
  | { type: "adjustment"; reason: string }
  | { type: "damage"; reference: string | null };

export interface InventoryMovement {
  id: string;
  store_id: string;
  inventory_item_id: string;
  store_location_id: string;
  quantity_delta: number;
  on_hand_after: number;
  reason: InventoryMovementReason;
  created_at: EpochMilliseconds;
  command_id: string;
  source_line_id: string;
}

export interface RecordInventoryMovementParams {
  store_id?: string;
  inventory_item_id: string;
  store_location_id: string;
  command_id: string;
  source_line_id: string;
  expected_level_id: string;
  expected_level_updated_at: EpochMilliseconds;
  quantity_delta: number;
  reason: ManualInventoryMovementReason;
}

export interface GetInventoryMovementParams {
  store_id?: string;
  id: string;
}

export interface FindInventoryMovementsParams {
  store_id?: string;
  inventory_item_id?: string;
  store_location_id?: string;
  command_id?: string;
  limit?: number;
  cursor?: string;
  sort_field?: "created_at";
  sort_direction?: "asc" | "desc";
}

export type InventoryReservationSource =
  | {
      type: "order_item";
      order_id: string;
      order_product_item_id: string;
      order_delivery_group_id: string;
      fulfillment_order_id: string;
      fulfillment_order_line_id: string;
      unit_spans: UnitSpan[];
    }
  | {
      type: "transfer_line";
      inventory_transfer_id: string;
      transfer_line_id: string;
    }
  | { type: "manual"; actor: AccountActor; reason: string };

export type InventoryReservationStatus =
  | { type: "active" }
  | { type: "closed"; closed_at: EpochMilliseconds };

export interface InventoryReservation {
  id: string;
  store_id: string;
  inventory_item_id: string;
  store_location_id: string;
  source: InventoryReservationSource;
  quantity: number;
  status: InventoryReservationStatus;
  expires_at: EpochMilliseconds | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
  consumed_quantity: number;
  released_quantity: number;
  command_id: string;
  unit_progress: ReservationUnitProgress | null;
}

export interface ReservationUnitProgress {
  consumed_units: UnitSpan[];
  released_units: UnitSpan[];
}

export interface CreateManualInventoryReservationParams {
  store_id?: string;
  inventory_item_id: string;
  store_location_id: string;
  command_id: string;
  quantity: number;
  reason: string;
  expires_at: EpochMilliseconds | null;
  expected_level_id: string;
  expected_level_updated_at: EpochMilliseconds;
}

export interface ReleaseManualInventoryReservationParams {
  store_id?: string;
  id: string;
  released_quantity: number;
  expected_updated_at: EpochMilliseconds;
}

export interface GetInventoryReservationParams {
  store_id?: string;
  id: string;
}

export interface FindInventoryReservationsParams {
  store_id?: string;
  inventory_item_id?: string;
  store_location_id?: string;
  command_id?: string;
  order_id?: string;
  inventory_transfer_id?: string;
  active_only?: boolean;
  limit?: number;
  cursor?: string;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
}
