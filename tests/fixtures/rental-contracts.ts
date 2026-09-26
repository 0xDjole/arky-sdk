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
  RentalIssueReplacement,
  InventoryReservationSource,
  InventoryMovementReason,
  InventoryUnit,
  InventoryUnitExecution,
  InventoryUnitStatus,
  FindInventoryUnitsParams,
  OrderDeliveryGroup,
  OrderDeliveryGroupRentalItem,
  SubscriptionProductSnapshot,
  EpochMilliseconds,
  PostalAddress,
  FulfillmentOrder,
  FulfillmentOrderMethod,
  QuotedDeliveryGroup,
  SubscriptionEntitlementOrderQuoteLine,
} from "arky-sdk";
import type {
  Rental as PublicRental,
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
type UnitStatus<T extends InventoryUnitStatus["type"]> = Extract<InventoryUnitStatus, { type: T }>;
type Command<T extends RentalCommand["type"]> = Extract<RentalCommand, { type: T }>;
type Ending = Extract<RentalStatus, { type: "ending" }>;

export type RentalContract = [
  True<Same<Rental, PublicRental>>,
  True<Same<RentalDetail, PublicDetail>>,
  True<Same<keyof Rental, "id" | "store_id" | "subscription_id" | "creation_revision_id" | "creation_entitlement_id" | "subscription_plan_entitlement_id" | "terms_revision_id" | "status" | "created_at" | "updated_at">>,
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
  True<Same<RentalTerms["snapshot"], SubscriptionProductSnapshot>>,
  True<Same<keyof RentalDetail, "rental" | "terms">>,
  True<Same<RentalCommand["type"], "request_replacement" | "end" | "close" | "cancel_issue">>,
  True<Same<keyof Command<"request_replacement">, "type" | "fulfillment_order_id" | "fulfillment_order_line_id" | "replacement" | "store_location_id" | "method">>,
  True<Same<Command<"request_replacement">["replacement"], RentalIssueReplacement>>,
  True<Same<keyof RentalIssueReplacement, "predecessor_inventory_unit_id" | "predecessor_fulfillment_order_line_id" | "predecessor_fulfillment_unit_index" | "overlap_authorized">>,
  True<Same<RentalIssueReplacement["overlap_authorized"], boolean>>,
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
  True<Same<keyof FindRentalsParams, "store_id" | "subscription_id" | "status" | "limit" | "cursor" | "sort_field" | "sort_direction">>,
  True<Same<Awaited<ReturnType<RentalApi["find"]>>, PaginatedResponse<Rental>>>,
  True<Same<Parameters<RentalApi["get"]>[0], GetRentalParams>>,
  True<Same<Awaited<ReturnType<RentalApi["get"]>>, RentalDetail>>,
  True<Same<Parameters<RentalApi["execute"]>[0], ExecuteRentalParams>>,
  True<Same<keyof ExecuteRentalParams, "store_id" | "id" | "command_id" | "expected_updated_at" | "type">>,
  True<Same<ExecuteRentalParams["type"], RentalCommand>>,
  True<Same<Awaited<ReturnType<RentalApi["execute"]>>, Rental>>,
  True<"rentalPlacement" extends keyof Admin ? false : true>,
];

export type RentedUnitContract = [
  True<Same<keyof UnitStatus<"rented">, "type" | "rental_id" | "execution" | "return_id">>,
  True<Same<UnitStatus<"rented">["execution"], InventoryUnitExecution>>,
  True<Same<UnitStatus<"rented">["return_id"], string | null>>,
  True<Same<UnitStatus<"written_off">["rental_id"], string | null>>,
  True<Same<InventoryUnit["status"], InventoryUnitStatus>>,
  True<Same<FindInventoryUnitsParams["rental_id"], string | undefined>>,
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
  True<Same<SubscriptionEntitlementOrderQuoteLine["type"], "product" | "digital_product" | "rental">>,
];

const ending: RentalCommand = { type: "end", reason: "Customer ended the agreement", return_due_at: null };
const replacement: RentalCommand = {
  type: "request_replacement",
  fulfillment_order_id: "work",
  fulfillment_order_line_id: "line",
  replacement: {
    predecessor_inventory_unit_id: "unit",
    predecessor_fulfillment_order_line_id: "delivered-line",
    predecessor_fulfillment_unit_index: 0,
    overlap_authorized: false,
  },
  store_location_id: "location",
  method: { type: "pickup" },
};
void [ending, replacement];
