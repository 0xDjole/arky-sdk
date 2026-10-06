import type { createAdmin } from "arky-sdk/admin";
import type {
  FindInventoryItemsParams, GetInventoryItemByKeyParams, FindInventoryMovementsParams,
  InventoryItem, InventoryTracking, InventoryLevel, InventoryStockLevel, InventoryMovement,
  InventoryMovementReason, InventoryQuantity, ChangeSetAsideParams, MoveInventoryParams,
  ReceiveStockMoveParams, IncomingStock, RecordInventoryMovementParams,
} from "arky-sdk";
import type {
  InventoryLevel as PublicLevel, InventoryMovement as PublicMovement,
  GetInventoryItemByKeyParams as PublicKeyQuery, PaginatedResponse,
} from "arky-sdk/types";

type True<T extends true> = T;
type Same<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Api = ReturnType<typeof createAdmin>["eshop"];

export type InventoryContracts = [
  True<Same<InventoryLevel, PublicLevel>>,
  True<Same<InventoryMovement, PublicMovement>>,
  True<Same<GetInventoryItemByKeyParams, PublicKeyQuery>>,
  True<Same<keyof InventoryLevel, "id" | "store_id" | "inventory_item_id" | "store_location_id" | "on_hand" | "reserved" | "unavailable" | "available" | "created_at" | "updated_at">>,
  True<RequiredField<InventoryLevel, "unavailable">>,
  True<RequiredField<InventoryLevel, "available">>,
  True<Same<keyof InventoryStockLevel["item"], "key" | "sku" | "tracking">>,
  True<Same<InventoryStockLevel["item"]["tracking"], InventoryTracking>>,
  True<Same<InventoryQuantity["type"], "on_hand" | "unavailable">>,
  True<Same<keyof InventoryMovement, "id" | "store_id" | "inventory_item_id" | "inventory_unit_id" | "store_location_id" | "quantity" | "delta" | "after" | "reason" | "created_at" | "request_id" | "source_line_id">>,
  True<Same<InventoryMovement["quantity"], InventoryQuantity>>,
  True<Same<InventoryMovement["inventory_unit_id"], string | null>>,
  True<Same<keyof Extract<InventoryMovementReason, { type: "dispatched" }>, "type" | "fulfillment_job_id" | "fulfillment_id">>,
  True<Same<NonNullable<FindInventoryMovementsParams["sort_field"]>, "created_at">>,
  True<RequiredField<GetInventoryItemByKeyParams, "key">>,
  True<Same<InventoryTracking["type"], "tracked" | "individual" | "untracked">>,
  True<{ type: "individual" } extends InventoryItem["tracking"] ? true : false>,
  True<"individual" extends FindInventoryItemsParams["tracking"] ? true : false>,
  True<Same<Parameters<Api["inventoryLevel"]["setAside"]>[0], ChangeSetAsideParams>>,
  True<Same<Parameters<Api["inventoryLevel"]["makeAvailable"]>[0], ChangeSetAsideParams>>,
  True<Same<Parameters<Api["inventoryLevel"]["move"]>[0], MoveInventoryParams>>,
  True<Same<Parameters<Api["inventoryLevel"]["receiveMove"]>[0], ReceiveStockMoveParams>>,
  True<Same<Awaited<ReturnType<Api["inventoryLevel"]["stock"]>>, PaginatedResponse<InventoryStockLevel>>>,
  True<Same<IncomingStock["type"], "counted" | "unit">>,
  True<Same<keyof Extract<IncomingStock, { type: "unit" }>, "type" | "asset_tag">>,
  True<Same<keyof Extract<IncomingStock, { type: "counted" }>, "type" | "from_store_location_id" | "quantity">>,
  True<Same<Parameters<Api["inventoryMovement"]["record"]>[0], RecordInventoryMovementParams>>,
  True<Same<RecordInventoryMovementParams["reason"]["type"], "receiving" | "adjustment" | "damage">>,
  True<RequiredField<RecordInventoryMovementParams, "request_id">>,
  True<RequiredField<FindInventoryMovementsParams, "store_id">>,
  True<"inventoryReservation" extends keyof Api ? false : true>,
];

export const combinedMovementQuery: FindInventoryMovementsParams = {
  store_id: "store", inventory_item_id: "item", store_location_id: "location", inventory_unit_id: "unit",
  request_id: "7c4e1a93-2d58-4b06-9f3e-5a8c0d2b6e19", sort_field: "created_at", sort_direction: "desc", cursor: "next",
};

export const inventoryItemQuery: FindInventoryItemsParams = {
  store_id: "store", query: "cobalt", status: "archived", tracking: "untracked",
  sort_field: "updated_at", sort_direction: "asc", cursor: "next", limit: 20,
};
