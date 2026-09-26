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
  unavailable: number;
  available: number;
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

export interface ChangeSetAsideParams {
  store_id?: string;
  id: string;
  command_id: string;
  quantity: number;
  reason: string;
  expected_updated_at: EpochMilliseconds;
}

export interface MoveInventoryParams {
  store_id?: string;
  id: string;
  command_id: string;
  to_store_location_id: string;
  quantity: number;
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

export type InventoryQuantity = { type: "on_hand" } | { type: "unavailable" };

export type InventoryMovementReason =
  | { type: "receiving"; actor: AccountActor; reference: string | null }
  | { type: "adjustment"; actor: AccountActor; reason: string }
  | { type: "damage"; actor: AccountActor; reference: string | null }
  | { type: "dispatched"; fulfillment_order_id: string; fulfillment_id: string }
  | { type: "return_restock"; return_id: string }
  | { type: "set_aside"; actor: AccountActor; reason: string }
  | { type: "made_available"; actor: AccountActor; reason: string }
  | {
      type: "moved";
      actor: AccountActor;
      from_store_location_id: string;
      to_store_location_id: string;
    };

export type ManualInventoryMovementReason =
  | { type: "receiving"; reference: string | null }
  | { type: "adjustment"; reason: string }
  | { type: "damage"; reference: string | null };

export interface InventoryMovement {
  id: string;
  store_id: string;
  inventory_item_id: string;
  inventory_unit_id: string | null;
  store_location_id: string;
  quantity: InventoryQuantity;
  delta: number;
  after: number;
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
  delta: number;
  from_set_aside?: boolean;
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
  inventory_unit_id?: string;
  command_id?: string;
  limit?: number;
  cursor?: string;
  sort_field?: "created_at";
  sort_direction?: "asc" | "desc";
}
