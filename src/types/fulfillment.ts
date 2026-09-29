import type {
  FulfillmentExecution,
  FulfillmentUnitSpan,
  SelectedUnit,
  Tracking,
} from "./index";
import type { EpochMilliseconds } from "./time";

export type FulfillmentStatus =
  | { type: "preparing" }
  | { type: "ready"; ready_at: EpochMilliseconds }
  | { type: "fulfilled"; execution: FulfillmentExecution }
  | { type: "cancelled"; cancelled_at: EpochMilliseconds };

export interface FulfillmentLine {
  fulfillment_order_line_id: string;
  unit_spans: FulfillmentUnitSpan[];
  selected_units: SelectedUnit[];
  lot_reference: string | null;
}

export interface Fulfillment {
  request_id: string;
  id: string;
  store_id: string;
  fulfillment_order_id: string;
  lines: FulfillmentLine[];
  status: FulfillmentStatus;
  tracking: Tracking | null;
  delivered_at: EpochMilliseconds | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type FindFulfillmentsParams = {
  store_id: string;
  limit?: number;
  cursor?: string | null;
} & (
  | { order_id: string; fulfillment_order_id?: never; rental_id?: never }
  | { fulfillment_order_id: string; order_id?: never; rental_id?: never }
  | { rental_id: string; order_id?: never; fulfillment_order_id?: never }
);

export interface GetFulfillmentParams {
  store_id: string;
  fulfillment_id: string;
}

export interface CreateFulfillmentParams extends GetFulfillmentParams {
  request_id: string;
  fulfillment_order_id: string;
  lines: FulfillmentLine[];
}

export type FulfillmentAction =
  | { type: "ready" }
  | { type: "cancel" }
  | { type: "fulfill"; late_reason: string | null };

export interface FulfillmentLotReference {
  fulfillment_order_line_id: string;
  lot_reference: string;
}

export interface ControlFulfillmentParams extends GetFulfillmentParams {
  request_id: string;
  expected_updated_at: EpochMilliseconds;
  action: FulfillmentAction;
  tracking?: Tracking | null;
  lot_references?: FulfillmentLotReference[];
}

export interface UpdateFulfillmentTrackingParams extends GetFulfillmentParams {
  expected_updated_at: EpochMilliseconds;
  tracking: Tracking;
}

export interface MarkFulfillmentDeliveredParams extends GetFulfillmentParams {
  expected_updated_at: EpochMilliseconds;
  delivered_at: EpochMilliseconds;
}
