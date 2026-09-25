import type { createAdmin } from "arky-sdk/admin";
import type {
  Rental,
  RentalActor,
  RentalCommand,
  RentalDetail,
  RentalStatus,
  RentalTerms,
  ExecuteRentalParams,
  FindRentalsParams,
  GetRentalParams,
  RentalPlacement,
  RentalPlacementCommand,
  RentalPlacementExecution,
  RentalPlacementExecutionSource,
  RentalPlacementIssue,
  RentalPlacementStatus,
  ExecuteRentalPlacementParams,
  FindRentalPlacementsParams,
  GetRentalPlacementParams,
  InventoryReservationSource,
  InventoryMovementReason,
  InventoryUnitExecutionSource,
  OrderDeliveryGroup,
  OrderDeliveryGroupRentalItem,
  CustomerGroupProductSnapshot,
  EpochMilliseconds,
  PostalAddress,
  FulfillmentOrder,
  FulfillmentOrderMethod,
  QuotedDeliveryGroup,
  CustomerGroupBenefitOrderQuoteLine,
} from "arky-sdk";
import type {
  Rental as PublicRental,
  RentalPlacement as PublicPlacement,
  RentalDetail as PublicDetail,
  PaginatedResponse,
  CartDeliveryRentalAssignment,
  CartPhysicalLineRef,
} from "arky-sdk/types";

type Same<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false;
type True<T extends true> = T;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Admin = ReturnType<typeof createAdmin>["eshop"];
type RentalApi = Admin["rental"];
type PlacementApi = Admin["rentalPlacement"];
type Status<T extends RentalPlacementStatus["type"]> = Extract<RentalPlacementStatus, { type: T }>;
type Command<T extends RentalCommand["type"]> = Extract<RentalCommand, { type: T }>;
type Ending = Extract<RentalStatus, { type: "ending" }>;

export type RentalContract = [
  True<Same<Rental, PublicRental>>,
  True<Same<RentalDetail, PublicDetail>>,
  True<Same<keyof Rental, "id" | "store_id" | "customer_group_subscription_id" | "customer_group_plan_benefit_id" | "terms_revision_id" | "status" | "created_at" | "updated_at">>,
  True<"product_id" extends keyof Rental ? false : true>,
  True<"quantity" extends keyof Rental ? false : true>,
  True<"inventory_item_id" extends keyof Rental ? false : true>,
  True<Same<RentalStatus["type"], "active" | "ending" | "closed">>,
  True<Same<keyof Ending, "type" | "requested_at" | "actor" | "reason" | "return_due_at">>,
  True<Same<Ending["return_due_at"], EpochMilliseconds | null>>,
  True<RequiredField<Ending, "return_due_at">>,
  True<Same<Ending["actor"], RentalActor>>,
  True<Same<RentalActor["type"], "account" | "system">>,
  True<Same<keyof Extract<RentalStatus, { type: "closed" }>, "type" | "closed_at">>,
  True<Same<keyof RentalTerms, "product_id" | "variant_id" | "quantity" | "inventory_item_id" | "snapshot">>,
  True<Same<RentalTerms["snapshot"], CustomerGroupProductSnapshot>>,
  True<Same<keyof RentalDetail, "rental" | "terms">>,
  True<Same<RentalCommand["type"], "request_replacement" | "end" | "close" | "cancel_issue">>,
  True<Same<keyof Command<"request_replacement">, "type" | "fulfillment_order_id" | "fulfillment_order_line_id" | "predecessor_placement_id" | "store_location_id" | "method" | "overlap_authorized">>,
  True<Same<Command<"request_replacement">["overlap_authorized"], boolean>>,
  True<Same<Command<"request_replacement">["method"], FulfillmentOrderMethod>>,
  True<Same<FulfillmentOrder["method"], FulfillmentOrderMethod>>,
  True<Same<FulfillmentOrderMethod, { type: "delivery"; destination: PostalAddress } | { type: "pickup" }>>,
  True<Same<keyof Command<"end">, "type" | "reason" | "return_due_at">>,
  True<RequiredField<Command<"end">, "return_due_at">>,
  True<Same<Command<"end">["return_due_at"], EpochMilliseconds | null>>,
  True<Same<keyof Command<"close">, "type">>,
  True<Same<keyof Command<"cancel_issue">, "type" | "fulfillment_order_id" | "fulfillment_order_line_id">>,
  True<Same<keyof RentalApi, "find" | "get" | "execute">>,
  True<Same<Parameters<RentalApi["find"]>[0], FindRentalsParams | undefined>>,
  True<Same<keyof FindRentalsParams, "store_id" | "customer_group_subscription_id" | "status" | "limit" | "cursor" | "sort_field" | "sort_direction">>,
  True<Same<Awaited<ReturnType<RentalApi["find"]>>, PaginatedResponse<Rental>>>,
  True<Same<Parameters<RentalApi["get"]>[0], GetRentalParams>>,
  True<Same<Awaited<ReturnType<RentalApi["get"]>>, RentalDetail>>,
  True<Same<Parameters<RentalApi["execute"]>[0], ExecuteRentalParams>>,
  True<Same<keyof ExecuteRentalParams, "store_id" | "id" | "command_id" | "expected_updated_at" | "type">>,
  True<Same<ExecuteRentalParams["type"], RentalCommand>>,
  True<Same<Awaited<ReturnType<RentalApi["execute"]>>, Rental>>,
];

export type PlacementContract = [
  True<Same<RentalPlacement, PublicPlacement>>,
  True<Same<keyof RentalPlacement, "id" | "store_id" | "rental_id" | "inventory_unit_id" | "issue" | "status" | "created_at" | "updated_at">>,
  True<Same<keyof RentalPlacementIssue, "fulfillment_order_id" | "fulfillment_order_line_id" | "fulfillment_unit_index">>,
  True<Same<keyof RentalPlacementExecution, "source" | "executed_at">>,
  True<Same<RentalPlacementExecution["source"], RentalPlacementExecutionSource>>,
  True<Same<RentalPlacementExecutionSource, InventoryUnitExecutionSource>>,
  True<Same<RentalPlacementExecutionSource, { type: "shipment"; shipment_id: string } | { type: "pickup"; pickup_id: string }>>,
  True<Same<RentalPlacementStatus["type"], "assigned" | "cancelled" | "in_transit" | "with_customer" | "return_requested" | "returned" | "lost">>,
  True<Same<keyof Status<"assigned">, "type">>,
  True<Same<keyof Status<"cancelled">, "type" | "cancelled_at">>,
  True<Same<keyof Status<"in_transit">, "type" | "execution">>,
  True<Same<keyof Status<"with_customer">, "type" | "execution" | "handed_over_at">>,
  True<Same<Status<"with_customer">["handed_over_at"], EpochMilliseconds>>,
  True<Same<keyof Status<"return_requested">, "type" | "execution" | "handed_over_at" | "return_id">>,
  True<Same<Status<"return_requested">["handed_over_at"], EpochMilliseconds | null>>,
  True<RequiredField<Status<"return_requested">, "handed_over_at">>,
  True<Same<keyof Status<"returned">, "type" | "execution" | "handed_over_at" | "return_id" | "return_component_id" | "received_at">>,
  True<Same<keyof Status<"lost">, "type" | "execution" | "handed_over_at" | "actor" | "reason" | "lost_at">>,
  True<Same<RentalPlacementCommand["type"], "confirm_handover" | "mark_lost">>,
  True<Same<keyof Extract<RentalPlacementCommand, { type: "confirm_handover" }>, "type" | "handed_over_at">>,
  True<Same<keyof Extract<RentalPlacementCommand, { type: "mark_lost" }>, "type" | "reason">>,
  True<Same<keyof PlacementApi, "find" | "get" | "execute">>,
  True<Same<Parameters<PlacementApi["find"]>[0], FindRentalPlacementsParams | undefined>>,
  True<Same<keyof FindRentalPlacementsParams, "store_id" | "rental_id" | "inventory_unit_id" | "status" | "limit" | "cursor" | "sort_field" | "sort_direction">>,
  True<Same<Awaited<ReturnType<PlacementApi["find"]>>, PaginatedResponse<RentalPlacement>>>,
  True<Same<Parameters<PlacementApi["get"]>[0], GetRentalPlacementParams>>,
  True<Same<Awaited<ReturnType<PlacementApi["get"]>>, RentalPlacement>>,
  True<Same<Parameters<PlacementApi["execute"]>[0], ExecuteRentalPlacementParams>>,
  True<Same<keyof ExecuteRentalPlacementParams, "store_id" | "id" | "command_id" | "expected_updated_at" | "type">>,
  True<Same<Awaited<ReturnType<PlacementApi["execute"]>>, RentalPlacement>>,
];

export type RentalIssueWorkContract = [
  True<Same<keyof Extract<InventoryReservationSource, { type: "rental_issue" }>, "type" | "rental_id" | "fulfillment_order_id" | "fulfillment_order_line_id">>,
  True<"unit_spans" extends keyof Extract<InventoryReservationSource, { type: "rental_issue" }> ? false : true>,
  True<Same<keyof Extract<InventoryMovementReason, { type: "rental_issue" }>, "type" | "rental_id" | "fulfillment_order_id">>,
  True<Same<keyof Extract<InventoryMovementReason, { type: "fulfillment" }>, "type" | "order_id" | "fulfillment_order_id">>,
  True<"order_id" extends keyof Extract<InventoryMovementReason, { type: "rental_issue" }> ? false : true>,
  True<Same<OrderDeliveryGroup["rental_items"], OrderDeliveryGroupRentalItem[]>>,
  True<RequiredField<OrderDeliveryGroup, "rental_items">>,
  True<Same<keyof OrderDeliveryGroupRentalItem, "rental_id" | "quantity">>,
  True<Same<QuotedDeliveryGroup["rental_items"], CartDeliveryRentalAssignment[]>>,
  True<RequiredField<QuotedDeliveryGroup, "rental_items">>,
  True<Same<keyof CartDeliveryRentalAssignment, "cart_delivery_group_id" | "line_item" | "quantity">>,
  True<Same<CartDeliveryRentalAssignment["line_item"], CartPhysicalLineRef>>,
  True<Same<CustomerGroupBenefitOrderQuoteLine["type"], "product" | "digital_product">>,
];

const ending: RentalCommand = { type: "end", reason: "Customer ended the agreement", return_due_at: null };
const replacement: RentalCommand = {
  type: "request_replacement",
  fulfillment_order_id: "work",
  fulfillment_order_line_id: "line",
  predecessor_placement_id: "placement",
  store_location_id: "location",
  method: { type: "pickup" },
  overlap_authorized: false,
};
const handover: RentalPlacementCommand = { type: "confirm_handover", handed_over_at: 1700000000000 as EpochMilliseconds };
void [ending, replacement, handover];
