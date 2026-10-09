import type { EpochMilliseconds } from "./time";
import type { AccountActor, SortDirection } from "./common";

export type InventoryTracking =
  | { type: "tracked" }
  | { type: "individual" }
  | { type: "untracked" };

export interface Dimensions {
  length_mm: number;
  width_mm: number;
  height_mm: number;
}

export interface InventoryPhysical {
  weight_grams: number | null;
  dimensions: Dimensions | null;
}

export interface InventoryCustoms {
  origin_country: string | null;
  hs_code: string | null;
  material: string | null;
}

export type InventoryItemStatus =
  | { type: "active" }
  | { type: "archived" }
  | { type: "deleting" };

export type InventoryItemEditableStatus = Exclude<InventoryItemStatus, { type: "deleting" }>;

export interface InventoryItem {
  id: string;
  store_id: string;
  key: string;
  sku: string | null;
  barcode: string | null;
  tracking: InventoryTracking;
  physical: InventoryPhysical;
  customs: InventoryCustoms;
  status: InventoryItemStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
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

export interface InventoryStockLevel extends InventoryLevel {
  item: { key: string; sku: string | null; tracking: InventoryTracking };
}

export type InventoryMovementTracking =
  | { type: "tracked" }
  | { type: "individual"; inventory_unit_id: string };

export type InventoryQuantity = { type: "on_hand" } | { type: "unavailable" };

export type InventoryMovementReason =
  | { type: "receiving"; actor: AccountActor; reference: string | null }
  | { type: "adjustment"; actor: AccountActor; quantity: InventoryQuantity; note: string }
  | { type: "damage"; actor: AccountActor; quantity: InventoryQuantity; reference: string | null }
  | { type: "dispatched"; fulfillment_job_id: string; fulfillment_id: string }
  | { type: "return_restock"; return_id: string }
  | { type: "set_aside"; actor: AccountActor; note: string }
  | { type: "made_available"; actor: AccountActor; note: string }
  | { type: "moved_out"; actor: AccountActor; to_store_location_id: string }
  | { type: "moved_in"; actor: AccountActor; from_store_location_id: string };

export interface InventoryMovement {
  id: string;
  store_id: string;
  inventory_item_id: string;
  tracking: InventoryMovementTracking;
  store_location_id: string;
  delta: number;
  after: number;
  reason: InventoryMovementReason;
  action_id: string;
  created_at: EpochMilliseconds;
}

export type ManualInventoryMovementReason =
  | { type: "receiving"; reference: string | null }
  | { type: "adjustment"; note: string }
  | { type: "damage"; reference: string | null };

export interface InventoryUnitAllocation {
  fulfillment_job_id: string;
  fulfillment_job_line_id: string;
  fulfillment_unit_index: number;
}

export interface InventoryUnitExecution {
  fulfillment_job_id: string;
  fulfillment_job_line_id: string;
  fulfillment_unit_index: number;
  fulfillment_id: string;
  executed_at: EpochMilliseconds;
}

export type InventoryUnitWriteOffSource =
  | { type: "warehouse"; store_location_id: string }
  | { type: "rental"; rental_id: string; execution: InventoryUnitExecution }
  | { type: "return_disposition"; return_id: string; store_location_id: string };

export type InventoryUnitStatus =
  | { type: "available"; store_location_id: string }
  | { type: "allocated"; store_location_id: string; allocation: InventoryUnitAllocation }
  | { type: "issued"; execution: InventoryUnitExecution }
  | { type: "rented"; rental_id: string; execution: InventoryUnitExecution }
  | { type: "returning"; rental_id: string; execution: InventoryUnitExecution; return_id: string }
  | { type: "inspection"; store_location_id: string; return_id: string; received_at: EpochMilliseconds }
  | {
      type: "written_off";
      source: InventoryUnitWriteOffSource;
      actor: AccountActor;
      reason: string;
      written_off_at: EpochMilliseconds;
    };

export interface InventoryUnit {
  id: string;
  store_id: string;
  inventory_item_id: string;
  asset_tag: string;
  manufacturer_serial: string | null;
  status: InventoryUnitStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CreateInventoryItemParams {
  store_id: string;
  id: string;
  key: string;
  sku: string | null;
  barcode: string | null;
  tracking: InventoryTracking;
  physical: InventoryPhysical;
  customs: InventoryCustoms;
  status: InventoryItemEditableStatus;
}

export interface UpdateInventoryItemParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  sku: string | null;
  barcode: string | null;
  tracking: InventoryTracking;
  physical: InventoryPhysical;
  customs: InventoryCustoms;
  status: InventoryItemEditableStatus;
}

export interface GetInventoryItemParams {
  store_id: string;
  id: string;
}

export interface GetInventoryItemByKeyParams {
  store_id: string;
  key: string;
}

export interface FindInventoryItemsParams {
  store_id: string;
  query?: string;
  status?: InventoryItemStatus["type"];
  tracking?: InventoryTracking["type"];
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface DeleteInventoryItemParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface CreateInventoryLevelParams {
  store_id: string;
  id: string;
  inventory_item_id: string;
  store_location_id: string;
}

export interface GetInventoryLevelParams {
  store_id: string;
  id: string;
}

export interface RemoveInventoryLevelParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface FindInventoryLevelsParams {
  store_id: string;
  inventory_item_id?: string;
  store_location_id?: string;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface ChangeSetAsideParams {
  store_id: string;
  id: string;
  action_id: string;
  expected_updated_at: EpochMilliseconds;
  quantity: number;
  note: string;
}

export interface MoveInventoryParams {
  store_id: string;
  id: string;
  action_id: string;
  expected_updated_at: EpochMilliseconds;
  to_store_location_id: string;
  quantity: number;
}

export type IncomingStock =
  | { type: "counted"; from_store_location_id: string; quantity: number }
  | { type: "unit"; asset_tag: string };

export interface ReceiveStockMoveParams {
  store_id: string;
  id: string;
  action_id: string;
  expected_updated_at: EpochMilliseconds;
  type: IncomingStock;
}

export interface RecordInventoryMovementParams {
  store_id: string;
  inventory_item_id: string;
  store_location_id: string;
  action_id: string;
  expected_level_id: string;
  expected_level_updated_at: EpochMilliseconds;
  delta: number;
  from_set_aside: boolean;
  reason: ManualInventoryMovementReason;
}

export interface GetInventoryMovementParams {
  store_id: string;
  id: string;
}

export interface FindInventoryMovementsParams {
  store_id: string;
  inventory_item_id?: string;
  store_location_id?: string;
  inventory_unit_id?: string;
  action_id?: string;
  sort_field?: "created_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface GetInventoryUnitParams {
  store_id: string;
  id: string;
}

export interface FindInventoryUnitsParams {
  store_id: string;
  inventory_item_id?: string;
  store_location_id?: string;
  rental_id?: string;
  asset_tag?: string;
  status?: InventoryUnitStatus["type"];
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface ReceiveInventoryUnitParams {
  store_id: string;
  id: string;
  inventory_item_id: string;
  store_location_id: string;
  asset_tag: string;
  manufacturer_serial: string | null;
  expected_level_id: string;
  expected_level_updated_at: EpochMilliseconds;
}

export interface AllocateInventoryUnitParams extends GetInventoryUnitParams {
  expected_updated_at: EpochMilliseconds;
  fulfillment_job_id: string;
  fulfillment_job_line_id: string;
  fulfillment_unit_index: number;
}

export interface UnassignInventoryUnitParams extends GetInventoryUnitParams {
  expected_updated_at: EpochMilliseconds;
}

export interface MoveInventoryUnitParams extends GetInventoryUnitParams {
  expected_updated_at: EpochMilliseconds;
  action_id: string;
  to_store_location_id: string;
}

export interface WriteOffInventoryUnitParams extends GetInventoryUnitParams {
  expected_updated_at: EpochMilliseconds;
  reason: string;
}
