import type {
  FindInventoryItemsParams,
  GetInventoryItemByKeyParams,
  FindInventoryMovementsParams,
  FindInventoryReservationsParams,
  InventoryReservation,
  InventoryItem,
  InventoryTracking,
  ReservationUnitProgress,
} from "arky-sdk";
import type { InventoryReservation as PublicReservation, ReservationUnitProgress as PublicProgress } from "arky-sdk/types";
import type { GetInventoryItemByKeyParams as PublicKeyQuery } from "arky-sdk/types";

type AssertTrue<T extends true> = T;
type ProgressIsRequired = AssertTrue<{} extends Pick<InventoryReservation, "unit_progress"> ? false : true>;
type ProgressCanBeAbsent = AssertTrue<null extends InventoryReservation["unit_progress"] ? true : false>;
type PublicReservationParity = AssertTrue<PublicReservation extends InventoryReservation ? true : false>;
type PublicProgressParity = AssertTrue<PublicProgress extends ReservationUnitProgress ? true : false>;
type MovementOrder = AssertTrue<NonNullable<FindInventoryMovementsParams["sort_field"]> extends "created_at" ? true : false>;
type KeyRequired = AssertTrue<{} extends Pick<GetInventoryItemByKeyParams, "key"> ? false : true>;
type KeyQueryPublicParity = AssertTrue<PublicKeyQuery extends GetInventoryItemByKeyParams ? true : false>;
type TrackingChoices = AssertTrue<InventoryTracking["type"] extends "tracked" | "individual" | "untracked" ? true : false>;
type IndividualItem = AssertTrue<{ type: "individual" } extends InventoryItem["tracking"] ? true : false>;
type IndividualDiscovery = AssertTrue<"individual" extends FindInventoryItemsParams["tracking"] ? true : false>;

export type InventoryContracts = [
  ProgressIsRequired,
  ProgressCanBeAbsent,
  PublicReservationParity,
  PublicProgressParity,
  MovementOrder,
  KeyRequired,
  KeyQueryPublicParity,
  TrackingChoices,
  IndividualItem,
  IndividualDiscovery,
];

export const combinedReservationQuery: FindInventoryReservationsParams = {
  inventory_item_id: "item", store_location_id: "location", order_id: "order",
  command_id: "command", active_only: true, sort_field: "updated_at", sort_direction: "desc", cursor: "next",
};
export const progress: ReservationUnitProgress = {
  consumed_units: [{ first_unit: 0, quantity: 2 }],
  released_units: [{ first_unit: 2, quantity: 1 }],
};

export const inventoryItemQuery: FindInventoryItemsParams = {
  query: 'cobalt', status: 'archived', tracking: 'untracked',
  sort_field: 'updated_at', sort_direction: 'asc', cursor: 'next', limit: 20,
};
