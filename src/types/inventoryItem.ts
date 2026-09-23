import type { EpochMilliseconds } from "./time";

export type InventoryTracking =
  | { type: "tracked" }
  | { type: "individual" }
  | { type: "untracked" };

export interface InventoryDimensions {
  length_mm: number;
  width_mm: number;
  height_mm: number;
}

export interface InventoryPhysical {
  weight_grams: number | null;
  dimensions: InventoryDimensions | null;
}

export interface InventoryCustoms {
  origin_country: string | null;
  hs_code: string | null;
  material: string | null;
}

export type InventoryItemEditableStatus =
  | { type: "active" }
  | { type: "archived" };
export type InventoryItemStatus =
  InventoryItemEditableStatus | { type: "deleting" };

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

export interface CreateInventoryItemParams {
  store_id?: string;
  key: string;
  sku: string | null;
  barcode: string | null;
  tracking: InventoryTracking;
  physical: InventoryPhysical;
  customs: InventoryCustoms;
  status: InventoryItemEditableStatus;
}

export interface UpdateInventoryItemParams {
  store_id?: string;
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
  store_id?: string;
  id: string;
}

export interface GetInventoryItemByKeyParams {
  store_id?: string;
  key: string;
}

export interface FindInventoryItemsParams {
  store_id?: string;
  query?: string;
  status?: InventoryItemStatus["type"];
  tracking?: InventoryTracking["type"];
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
  limit?: number;
  cursor?: string;
}

export interface DeleteInventoryItemParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}
