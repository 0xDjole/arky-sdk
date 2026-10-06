import type { AccountActor } from "./accountActor";
import type {
  FulfillmentRecipient,
  FulfillmentUnitSpan,
  FulfillmentWindow,
  InventoryRequirement,
  PostalAddress,
  RentalIssueReplacement,
} from "./index";
import type { EpochMilliseconds } from "./time";

export type FulfillmentJobStatus = {
  type:
    | "scheduled"
    | "unassigned"
    | "on_hold"
    | "open"
    | "in_progress"
    | "completed"
    | "cancelled";
};

export type FulfillmentAssignmentSource =
  | { type: "served_from"; company_location_id: string }
  | { type: "routing_rule"; rule_id: string }
  | { type: "otherwise" }
  | { type: "staff"; actor: AccountActor };

export type FulfillmentAssignment =
  | { type: "unassigned" }
  | {
      type: "assigned";
      store_location_id: string;
      source: FulfillmentAssignmentSource;
    };

export type FulfillmentJobMethod =
  | {
      type: "delivery";
      destination: PostalAddress;
      assignment: FulfillmentAssignment;
    }
  | { type: "pickup"; store_location_id: string };

export type FulfillmentHoldReason =
  | { type: "awaiting_release" }
  | { type: "out_of_stock" }
  | { type: "manual"; actor: AccountActor; note: string }
  | { type: "handed_back"; actor: AccountActor; note: string };

export interface FulfillmentHold {
  id: string;
  reason: FulfillmentHoldReason;
  created_at: EpochMilliseconds;
}

export interface OrderDeliveryRef {
  order_id: string;
  order_delivery_group_id: string;
}

export type FulfillmentJobLineSource =
  | {
      type: "order_product";
      order_product_line_item_id: string;
      order_unit_spans: import("./orderContract").UnitSpan[];
    }
  | {
      type: "rental_issue";
      rental_id: string;
      terms_revision_id: string;
      replacement: RentalIssueReplacement | null;
    };

export interface FulfillmentJobLine {
  id: string;
  source: FulfillmentJobLineSource;
  inventory_requirements: InventoryRequirement[];
  quantity: number;
  fulfilled_quantity: number;
  cancelled_units: FulfillmentUnitSpan[];
  moved_units: FulfillmentUnitSpan[];
}

export interface FulfillmentJob {
  id: string;
  store_id: string;
  order: OrderDeliveryRef | null;
  method: FulfillmentJobMethod;
  status: FulfillmentJobStatus;
  holds: FulfillmentHold[];
  recipient: FulfillmentRecipient;
  scheduled_window: FulfillmentWindow | null;
  lines: FulfillmentJobLine[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface FulfillmentJobItem {
  fulfillment_job_line_id: string;
  order_number: string | null;
  product_key: string;
  variant_sku: string | null;
  image_media_id: string | null;
  quantity: number;
  source: FulfillmentJobLineSource;
}

export interface FulfillmentJobMoveLine {
  fulfillment_job_line_id: string;
  unit_spans: FulfillmentUnitSpan[];
}

export type FulfillmentJobCommand =
  | { type: "assign"; store_location_id: string }
  | {
      type: "move";
      to_store_location_id: string;
      lines: FulfillmentJobMoveLine[];
    }
  | { type: "hand_back"; note: string }
  | { type: "hold"; note: string }
  | { type: "release_hold"; hold_id: string };

export interface GetFulfillmentJobParams {
  store_id: string;
  fulfillment_job_id: string;
}

export interface DecideFulfillmentJobParams extends GetFulfillmentJobParams {
  request_id: string;
  expected_updated_at: EpochMilliseconds;
  action: FulfillmentJobCommand;
}

type FindFulfillmentJobsBase = {
  store_id: string;
  inventory_item_id?: string;
  status?: FulfillmentJobStatus["type"];
  scheduled_from?: EpochMilliseconds;
  scheduled_to?: EpochMilliseconds;
  sort_field?: "created_at" | "updated_at" | "scheduled_at";
  sort_direction?: "asc" | "desc";
  limit?: number;
  cursor?: string;
};

type FindFulfillmentJobsSource =
  | { order_id: string; rental_id?: never }
  | { rental_id: string; order_id?: never }
  | { order_id?: never; rental_id?: never };

type FindFulfillmentJobsPlace =
  | { store_location_id?: string; assignment?: never }
  | { assignment: "unassigned"; store_location_id?: never };

export type FindFulfillmentJobsParams = FindFulfillmentJobsBase &
  FindFulfillmentJobsSource &
  FindFulfillmentJobsPlace;

export type CustomerFulfillmentMethod =
  | { type: "delivery" }
  | { type: "pickup"; store_location_id: string };

export type CustomerFulfillmentJobStatus = {
  type: "scheduled" | "pending" | "in_progress" | "completed" | "cancelled";
};

export type CustomerShipmentStatus =
  | { type: "preparing" }
  | { type: "ready_for_pickup"; ready_at: EpochMilliseconds }
  | { type: "dispatched"; dispatched_at: EpochMilliseconds }
  | {
      type: "delivered";
      dispatched_at: EpochMilliseconds;
      delivered_at: EpochMilliseconds;
    }
  | { type: "cancelled"; cancelled_at: EpochMilliseconds };

export interface CustomerOrderShipment {
  fulfillment_id: string;
  status: CustomerShipmentStatus;
  preparation_started_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CustomerOrderFulfillment {
  fulfillment_job_id: string;
  order_delivery_group_id: string;
  method: CustomerFulfillmentMethod;
  status: CustomerFulfillmentJobStatus;
  scheduled_window: FulfillmentWindow | null;
  shipments: CustomerOrderShipment[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface FindCustomerOrderFulfillmentsParams {
  order_id: string;
}
