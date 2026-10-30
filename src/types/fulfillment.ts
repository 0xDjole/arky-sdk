import type { EpochMilliseconds } from "./time";
import type { Block } from "./block";
import type { AccountActor, CommerceParty, EmailContact, Money, PostalAddress, SortDirection, UnitSpan } from "./common";
import type { InventoryRequirement } from "./product";
import type { OrderDeliveryTiming } from "./order";
import type { PurchaseRequirementScope } from "./customerGroup";

export type RoutingCondition =
  | { type: "markets"; market_ids: string[] }
  | { type: "sales_channels"; sales_channel_ids: string[] }
  | { type: "zones"; zone_ids: string[] }
  | { type: "shipping_profiles"; shipping_profile_ids: string[] };

export type LocationPick = { type: "in_list_order" } | { type: "most_stock" };

export type RoutingSplit = { type: "never" } | { type: "when_needed" };

export type RoutingAssign =
  | { type: "manual" }
  | { type: "automatic"; pick: LocationPick; split: RoutingSplit };

export interface RoutingTarget {
  location_ids: string[];
  assign: RoutingAssign;
}

export type RoutingRuleStatus = { type: "active" } | { type: "paused" };

export interface RoutingRule {
  id: string;
  key: string;
  conditions: RoutingCondition[];
  target: RoutingTarget;
  status: RoutingRuleStatus;
}

export interface FulfillmentRouting {
  id: string;
  store_id: string;
  rules: RoutingRule[];
  otherwise: RoutingTarget;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface FulfillmentUnitSpan {
  first_unit: number;
  quantity: number;
}

export type FulfillmentJobLineSource =
  | { type: "order_product"; order_product_line_item_id: string; order_unit_spans: UnitSpan[] }
  | { type: "rental_issue"; rental_id: string; revision_id: string };

export interface FulfillmentJobLine {
  id: string;
  source: FulfillmentJobLineSource;
  inventory_requirements: InventoryRequirement[];
  quantity: number;
  fulfilled_quantity: number;
  cancelled_units: FulfillmentUnitSpan[];
  moved_units: FulfillmentUnitSpan[];
}

export interface RentalIssueReplacement {
  predecessor_inventory_unit_id: string;
  predecessor_fulfillment_job_line_id: string;
  predecessor_fulfillment_unit_index: number;
  overlap_authorized: boolean;
}

export type FulfillmentJobType =
  | {
      type: "order_delivery";
      order_id: string;
      order_delivery_group_id: string;
      timing: OrderDeliveryTiming;
      lines: FulfillmentJobLine[];
    }
  | { type: "rental_replacement"; replacement: RentalIssueReplacement; line: FulfillmentJobLine };

export type FulfillmentAssignmentSource =
  | { type: "served_from" }
  | { type: "routing_rule"; rule_id: string }
  | { type: "otherwise" }
  | { type: "account"; actor: AccountActor };

export type FulfillmentJobMethod =
  | {
      type: "delivery";
      destination: PostalAddress;
      store_location_id: string;
      source: FulfillmentAssignmentSource;
    }
  | { type: "pickup"; store_location_id: string };

export type FulfillmentHoldReason =
  | { type: "awaiting_payment" }
  | { type: "awaiting_location_choice" }
  | { type: "out_of_stock" }
  | { type: "manual"; actor: AccountActor; note: string }
  | { type: "handed_back"; actor: AccountActor; note: string };

export interface FulfillmentHold {
  id: string;
  reason: FulfillmentHoldReason;
  created_at: EpochMilliseconds;
}

export type FulfillmentJobBuyer =
  | { type: "customer"; customer_id: string }
  | { type: "company"; company_id: string; company_name: string }
  | {
      type: "company_location";
      company_id: string;
      company_name: string;
      company_location_id: string;
      company_location_name: string;
    };

export interface FulfillmentJobContact {
  email: EmailContact | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  buyer: FulfillmentJobBuyer;
}

export type FulfillmentJobStatus = "scheduled" | "on_hold" | "open" | "in_progress" | "completed" | "cancelled";

export interface FulfillmentJob {
  id: string;
  store_id: string;
  type: FulfillmentJobType;
  method: FulfillmentJobMethod;
  holds: FulfillmentHold[];
  contact: FulfillmentJobContact;
  status: FulfillmentJobStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface Tracking {
  carrier: string;
  number: string;
  url: string | null;
}

export type FulfillmentExecutionTiming =
  | { type: "on_time" }
  | { type: "late"; reason: string };

export interface FulfillmentExecution {
  executed_at: EpochMilliseconds;
  actor: AccountActor;
  timing: FulfillmentExecutionTiming;
}

export type DeliveryStatus =
  | { type: "preparing" }
  | { type: "dispatched"; execution: FulfillmentExecution }
  | { type: "delivered"; execution: FulfillmentExecution; delivered_at: EpochMilliseconds }
  | { type: "cancelled"; cancelled_at: EpochMilliseconds };

export type PickupStatus =
  | { type: "preparing" }
  | { type: "ready"; ready_at: EpochMilliseconds }
  | { type: "collected"; execution: FulfillmentExecution }
  | { type: "cancelled"; cancelled_at: EpochMilliseconds };

export type FulfillmentType =
  | { type: "delivery"; trackings: Tracking[]; status: DeliveryStatus }
  | { type: "pickup"; status: PickupStatus };

export interface SelectedUnit {
  fulfillment_unit_index: number;
  inventory_unit_id: string;
}

export interface FulfillmentLine {
  fulfillment_job_line_id: string;
  unit_spans: FulfillmentUnitSpan[];
  selected_units: SelectedUnit[];
  lot_reference: string | null;
}

export type FulfillmentSource =
  | { type: "order_delivery"; order_id: string; buyer: CommerceParty }
  | { type: "rental_replacement" };

export interface Fulfillment {
  id: string;
  store_id: string;
  fulfillment_job_id: string;
  source: FulfillmentSource;
  created_by: AccountActor;
  lines: FulfillmentLine[];
  type: FulfillmentType;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface FulfillmentJobItemImage {
  media_id: string;
  url: string;
}

export interface FulfillmentJobItem {
  fulfillment_job_line_id: string;
  order_number: string | null;
  product_key: string;
  product_blocks: Block[];
  variant_sku: string | null;
  variant_blocks: Block[];
  image: FulfillmentJobItemImage | null;
  quantity: number;
  source: FulfillmentJobLineSource;
}

export interface FulfillmentJobMoveLine {
  fulfillment_job_line_id: string;
  unit_spans: FulfillmentUnitSpan[];
}

export type FulfillmentJobCommand =
  | { type: "move"; to_store_location_id: string }
  | {
      type: "split";
      fulfillment_job_id: string;
      to_store_location_id: string;
      lines: FulfillmentJobMoveLine[];
    }
  | { type: "hand_back"; note: string }
  | { type: "hold"; note: string }
  | { type: "release_hold"; hold_id: string };

export interface GetFulfillmentRoutingParams {
  store_id: string;
}

export interface UpdateFulfillmentRoutingParams {
  store_id: string;
  expected_updated_at: EpochMilliseconds;
  rules: RoutingRule[];
  otherwise: RoutingTarget;
}

export interface GetFulfillmentJobParams {
  store_id: string;
  fulfillment_job_id: string;
}

export interface ActOnFulfillmentJobParams extends GetFulfillmentJobParams {
  expected_updated_at: EpochMilliseconds;
  command: FulfillmentJobCommand;
}

export interface RecordPickupCashParams {
  store_id: string;
  fulfillment_job_id: string;
  id: string;
  payment_id: string;
  expected_job_updated_at: EpochMilliseconds;
  expected_payment_updated_at: EpochMilliseconds;
  money: Money;
  reference: string | null;
}

export interface PickupCash {
  payment_id: string;
  payment_updated_at: EpochMilliseconds;
  due: Money;
}

export interface FindFulfillmentJobsParams {
  store_id: string;
  order_id?: string;
  rental_id?: string;
  store_location_id?: string;
  hold?: FulfillmentHoldReason["type"];
  inventory_item_id?: string;
  status?: FulfillmentJobStatus;
  scheduled_from?: EpochMilliseconds;
  scheduled_to?: EpochMilliseconds;
  sort_field?: "created_at" | "updated_at" | "scheduled_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface GetFulfillmentParams {
  store_id: string;
  fulfillment_id: string;
}

export interface FindFulfillmentsParams {
  store_id: string;
  order_id?: string;
  fulfillment_job_id?: string;
  rental_id?: string;
  limit?: number;
  cursor?: string | null;
}

export interface CreateFulfillmentParams {
  store_id: string;
  id: string;
  fulfillment_job_id: string;
  lines: FulfillmentLine[];
}

export interface FulfillmentLotReference {
  fulfillment_job_line_id: string;
  lot_reference: string;
}

export type FulfillmentCommand =
  | { type: "ready"; notify_customer: boolean }
  | {
      type: "fulfill";
      timing: FulfillmentExecutionTiming;
      notify_customer: boolean;
      trackings?: Tracking[];
      lot_references?: FulfillmentLotReference[];
    }
  | { type: "cancel" };

export interface ActOnFulfillmentParams extends GetFulfillmentParams {
  expected_updated_at: EpochMilliseconds;
  command: FulfillmentCommand;
}

export interface UpdateFulfillmentTrackingParams extends GetFulfillmentParams {
  expected_updated_at: EpochMilliseconds;
  trackings: Tracking[];
}

export interface MarkFulfillmentDeliveredParams extends GetFulfillmentParams {
  expected_updated_at: EpochMilliseconds;
  delivered_at: EpochMilliseconds;
  notify_customer: boolean;
}

export type CustomerFulfillmentMethod =
  | { type: "delivery" }
  | { type: "pickup"; store_location_id: string };

export type CustomerShipmentStatus =
  | { type: "preparing" }
  | { type: "ready_for_pickup"; ready_at: EpochMilliseconds }
  | { type: "dispatched"; dispatched_at: EpochMilliseconds }
  | { type: "delivered"; dispatched_at: EpochMilliseconds; delivered_at: EpochMilliseconds }
  | { type: "collected"; collected_at: EpochMilliseconds }
  | { type: "cancelled"; cancelled_at: EpochMilliseconds };

export interface CustomerOrderShipment {
  fulfillment_id: string;
  status: CustomerShipmentStatus;
  preparation_started_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type CustomerFulfillmentJobStatus =
  | { type: "scheduled" }
  | { type: "pending" }
  | { type: "in_progress" }
  | { type: "completed" }
  | { type: "cancelled" };

export interface CustomerOrderFulfillment {
  fulfillment_job_id: string;
  order_delivery_group_id: string;
  method: CustomerFulfillmentMethod;
  status: CustomerFulfillmentJobStatus;
  timing: OrderDeliveryTiming;
  shipments: CustomerOrderShipment[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface FindCustomerOrderFulfillmentsParams {
  order_id: string;
}

export type MinimumProgressUnavailableReason =
  | "no_requirement"
  | "incomplete_source_evidence"
  | "incomplete_return_evidence"
  | "arithmetic_overflow"
  | "history_limit"
  | "per_location";

export type MinimumProgressMonthState =
  | {
      type: "available";
      scope: PurchaseRequirementScope;
      delivered_quantity: number;
      returned_quantity: number;
      current_quantity: number;
      minimum_quantity: number;
      remaining_quantity: number;
      attention: boolean;
      grace: boolean;
      paused: boolean;
      inactive: boolean;
    }
  | { type: "unavailable"; reason: MinimumProgressUnavailableReason };

export interface MinimumProgressMonth {
  year: number;
  month: number;
  timezone: string;
  starts_at: EpochMilliseconds;
  ends_at: EpochMilliseconds;
  customer_group_member_id: string | null;
  progress: MinimumProgressMonthState;
}

export type MinimumProgressState =
  | { type: "available"; current: MinimumProgressMonth; history: MinimumProgressMonth[] }
  | { type: "unavailable"; reason: MinimumProgressUnavailableReason };

export interface MinimumProgress {
  party: CommerceParty;
  state: MinimumProgressState;
}

export type StorefrontGetMinimumProgressParams =
  | { customer_id: string; company_id?: never; company_location_id?: never }
  | { customer_id?: never; company_id: string; company_location_id?: never }
  | { customer_id?: never; company_id?: never; company_location_id: string };

export type GetMinimumProgressParams = StorefrontGetMinimumProgressParams & { store_id: string };
