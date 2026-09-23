import type { FulfillmentUnitSpan } from "./index";
import type { InventoryUnit } from "./inventoryUnit";
import type { EpochMilliseconds } from "./time";

export interface FulfillmentUnitSelection {
  fulfillment_order_line_id: string;
  unit_spans: FulfillmentUnitSpan[];
}

export interface ResolveFulfillmentUnitSlotsParams {
  store_id?: string;
  order_id: string;
  fulfillment_order_id: string;
  expected_updated_at: EpochMilliseconds;
  lines: FulfillmentUnitSelection[];
}

export interface FulfillmentUnitSlot {
  fulfillment_order_line_id: string;
  fulfillment_unit_index: number;
  inventory_item_id: string;
  inventory_item_key: string;
  inventory_reservation_id: string;
  reservation_unit_index: number;
  inventory_unit: InventoryUnit | null;
}

export interface FulfillmentUnitSlots {
  fulfillment_order_id: string;
  store_location_id: string;
  updated_at: EpochMilliseconds;
  slots: FulfillmentUnitSlot[];
}
