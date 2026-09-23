import type { FulfillmentExecution, FulfillmentUnitSpan, ShipmentUnitBinding } from "./index";
import type { EpochMilliseconds } from "./time";

export type OrderPickupStatus =
  | { type: "preparing" }
  | { type: "ready"; ready_at: EpochMilliseconds }
  | { type: "collected"; collected_at: EpochMilliseconds }
  | { type: "cancelled"; cancelled_at: EpochMilliseconds };

export interface OrderPickupLine {
  fulfillment_order_line_id: string;
  unit_spans: FulfillmentUnitSpan[];
  unit_bindings: ShipmentUnitBinding[];
}

export interface OrderPickup {
  id: string;
  store_id: string;
  order_id: string;
  fulfillment_order_id: string;
  store_location_id: string;
  lines: OrderPickupLine[];
  status: OrderPickupStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
  collection: FulfillmentExecution | null;
}

export interface FindOrderPickupsParams {
  store_id?: string;
  order_id: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetOrderPickupParams {
  store_id?: string;
  order_id: string;
  pickup_id: string;
}
