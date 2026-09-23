import type { AccountActor } from "./accountActor";
import type { EpochMilliseconds } from "./time";

export interface InventoryUnitItemSnapshot {
  source_inventory_item_id: string;
  key: string;
}

export interface InventoryUnitAllocation {
  inventory_reservation_id: string;
  reservation_unit_index: number;
}

export type InventoryUnitExecutionSource =
  | { type: "shipment"; shipment_id: string }
  | { type: "pickup"; pickup_id: string };

export interface InventoryUnitExecution {
  fulfillment_order_id: string;
  fulfillment_order_line_id: string;
  fulfillment_unit_index: number;
  source: InventoryUnitExecutionSource;
  executed_at: EpochMilliseconds;
}

export type InventoryUnitStatus =
  | { type: "available"; store_location_id: string }
  | { type: "allocated"; store_location_id: string; allocation: InventoryUnitAllocation }
  | { type: "issued"; execution: InventoryUnitExecution }
  | { type: "inspection"; store_location_id: string; return_id: string; received_at: EpochMilliseconds }
  | { type: "written_off"; actor: AccountActor; reason: string; written_off_at: EpochMilliseconds };

export interface InventoryUnit {
  id: string;
  store_id: string;
  inventory_item_id: string | null;
  inventory_item_snapshot: InventoryUnitItemSnapshot;
  asset_tag: string;
  manufacturer_serial: string | null;
  status: InventoryUnitStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface GetInventoryUnitParams {
  store_id?: string;
  id: string;
}

export interface FindInventoryUnitsParams {
  store_id?: string;
  inventory_item_id?: string;
  store_location_id?: string;
  asset_tag?: string;
  status?: InventoryUnitStatus["type"];
  limit?: number;
  cursor?: string;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
}

export interface ReceiveInventoryUnitParams {
  store_id?: string;
  id: string;
  inventory_item_id: string;
  store_location_id: string;
  asset_tag: string;
  manufacturer_serial: string | null;
  expected_level_id: string;
  expected_level_updated_at: EpochMilliseconds;
}

export interface AllocateInventoryUnitParams extends GetInventoryUnitParams {
  inventory_reservation_id: string;
  reservation_unit_index: number;
  expected_updated_at: EpochMilliseconds;
}

export interface UnassignInventoryUnitParams extends GetInventoryUnitParams {
  expected_updated_at: EpochMilliseconds;
}
