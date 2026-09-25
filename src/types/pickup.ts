import type { FulfillmentExecution, FulfillmentUnitSpan, ShipmentUnitBinding } from "./index";
import type { EpochMilliseconds } from "./time";

export type PickupStatus =
  | { type: "preparing" }
  | { type: "ready"; ready_at: EpochMilliseconds }
  | { type: "collected"; collected_at: EpochMilliseconds }
  | { type: "cancelled"; cancelled_at: EpochMilliseconds };

export interface PickupLine {
  fulfillment_order_line_id: string;
  unit_spans: FulfillmentUnitSpan[];
  unit_bindings: ShipmentUnitBinding[];
}

export interface Pickup {
  id: string;
  store_id: string;
  fulfillment_order_id: string;
  store_location_id: string;
  lines: PickupLine[];
  status: PickupStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
  collection: FulfillmentExecution | null;
}

export type FindPickupsParams = {
  store_id?: string;
  limit?: number;
  cursor?: string | null;
} & (
  | { order_id: string; fulfillment_order_id?: never; rental_id?: never }
  | { fulfillment_order_id: string; order_id?: never; rental_id?: never }
  | { rental_id: string; order_id?: never; fulfillment_order_id?: never }
);

export interface GetPickupParams {
  store_id?: string;
  pickup_id: string;
}

export interface CreatePickupParams extends GetPickupParams {
  fulfillment_order_id: string;
  store_location_id: string;
  lines: PickupLine[];
}

export type PickupCommand =
  | { type: "ready" }
  | { type: "cancel" }
  | { type: "collect"; late_reason: string | null };

export interface ExecutePickupParams extends GetPickupParams {
  command_id: string;
  expected_updated_at: EpochMilliseconds;
  command: PickupCommand;
}
