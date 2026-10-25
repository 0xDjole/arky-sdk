import type { createAdmin } from "arky-sdk/admin";
import type {
  FindInventoryItemsParams, GetInventoryItemByKeyParams, FindInventoryMovementsParams,
  InventoryItem, InventoryItemStatus, InventoryTracking, InventoryLevel, InventoryStockLevel, InventoryMovement,
  InventoryMovementReason, InventoryQuantity, ChangeSetAsideParams, MoveInventoryParams,
  ReceiveStockMoveParams, IncomingStock, RecordInventoryMovementParams, ManualInventoryMovementReason,
  CreateInventoryItemParams, UpdateInventoryItemParams, CreateInventoryLevelParams,
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
  True<Same<keyof InventoryStockLevel["item"], "key" | "sku" | "tracking">>,
  True<Same<InventoryStockLevel["item"]["tracking"], InventoryTracking>>,
  True<Same<InventoryQuantity["type"], "on_hand" | "unavailable">>,
  True<Same<keyof InventoryMovement, "id" | "store_id" | "inventory_item_id" | "tracking" | "store_location_id" | "delta" | "after" | "reason" | "action_id" | "created_at">>,
  True<"request_id" extends keyof InventoryMovement ? false : true>,
  True<Same<keyof Extract<InventoryMovementReason, { type: "dispatched" }>, "type" | "fulfillment_id">>,
  True<Same<Extract<InventoryMovementReason, { type: "dispatched" }>, { type: "dispatched"; fulfillment_id: string }>>,
  True<Same<NonNullable<FindInventoryMovementsParams["sort_field"]>, "created_at">>,
  True<RequiredField<GetInventoryItemByKeyParams, "key">>,
  True<Same<InventoryTracking["type"], "tracked" | "individual" | "untracked">>,
  True<Same<InventoryItemStatus, { type: "active" } | { type: "archived" }>>,
  True<Same<InventoryItem["status"], InventoryItemStatus>>,
  True<Same<CreateInventoryItemParams["status"], InventoryItemStatus>>,
  True<Same<UpdateInventoryItemParams["status"], InventoryItemStatus>>,
  True<Same<NonNullable<FindInventoryItemsParams["status"]>, "active" | "archived">>,
  True<{ type: "individual" } extends InventoryItem["tracking"] ? true : false>,
  True<"individual" extends FindInventoryItemsParams["tracking"] ? true : false>,
  True<Same<Parameters<Api["inventoryLevel"]["setAside"]>[0], ChangeSetAsideParams>>,
  True<Same<Parameters<Api["inventoryLevel"]["makeAvailable"]>[0], ChangeSetAsideParams>>,
  True<Same<Parameters<Api["inventoryLevel"]["move"]>[0], MoveInventoryParams>>,
  True<Same<Parameters<Api["inventoryLevel"]["receiveMove"]>[0], ReceiveStockMoveParams>>,
  True<RequiredField<ChangeSetAsideParams, "action_id">>,
  True<RequiredField<ChangeSetAsideParams, "note">>,
  True<RequiredField<MoveInventoryParams, "action_id">>,
  True<Same<Awaited<ReturnType<Api["inventoryLevel"]["findStock"]>>, PaginatedResponse<InventoryStockLevel>>>,
  True<Same<IncomingStock["type"], "counted" | "unit">>,
  True<Same<keyof Extract<IncomingStock, { type: "unit" }>, "type" | "asset_tag">>,
  True<Same<keyof Extract<IncomingStock, { type: "counted" }>, "type" | "from_store_location_id" | "quantity">>,
  True<Same<Parameters<Api["inventoryMovement"]["record"]>[0], RecordInventoryMovementParams>>,
  True<Same<RecordInventoryMovementParams["reason"], ManualInventoryMovementReason>>,
  True<Same<ManualInventoryMovementReason["type"], "receiving" | "adjustment" | "damage">>,
  True<RequiredField<RecordInventoryMovementParams, "action_id">>,
  True<RequiredField<RecordInventoryMovementParams, "from_set_aside">>,
  True<"expected_updated_at" extends keyof ChangeSetAsideParams ? false : true>,
  True<"expected_updated_at" extends keyof MoveInventoryParams ? false : true>,
  True<"expected_updated_at" extends keyof ReceiveStockMoveParams ? false : true>,
  True<"expected_level_updated_at" extends keyof RecordInventoryMovementParams ? false : true>,
  True<"expected_updated_at" extends keyof RecordInventoryMovementParams ? false : true>,
  True<RequiredField<RecordInventoryMovementParams, "expected_level_id">>,
  True<Same<keyof ChangeSetAsideParams, "store_id" | "id" | "action_id" | "quantity" | "note">>,
  True<Same<keyof MoveInventoryParams, "store_id" | "id" | "action_id" | "to_store_location_id" | "quantity">>,
  True<Same<keyof ReceiveStockMoveParams, "store_id" | "id" | "action_id" | "type">>,
  True<Same<Extract<ManualInventoryMovementReason, { type: "adjustment" }>, { type: "adjustment"; note: string; expected_count: number }>>,
  True<RequiredField<Extract<ManualInventoryMovementReason, { type: "adjustment" }>, "expected_count">>,
  True<"expected_count" extends keyof Extract<ManualInventoryMovementReason, { type: "damage" }> ? false : true>,
  True<"expected_count" extends keyof Extract<ManualInventoryMovementReason, { type: "receiving" }> ? false : true>,
  True<RequiredField<FindInventoryMovementsParams, "store_id">>,
  True<RequiredField<CreateInventoryItemParams, "id">>,
  True<RequiredField<CreateInventoryLevelParams, "id">>,
  True<Same<Awaited<ReturnType<Api["inventoryItem"]["delete"]>>, void>>,
  True<"inventoryReservation" extends keyof Api ? false : true>,
];

export const combinedMovementQuery: FindInventoryMovementsParams = {
  store_id: "store", inventory_item_id: "item", store_location_id: "location", inventory_unit_id: "unit",
  action_id: "7c4e1a93-2d58-4b06-9f3e-5a8c0d2b6e19", sort_field: "created_at", sort_direction: "desc", cursor: "next",
};

export const inventoryItemQuery: FindInventoryItemsParams = {
  store_id: "store", query: "cobalt", status: "archived", tracking: "untracked",
  sort_field: "updated_at", sort_direction: "asc", cursor: "next", limit: 20,
};
