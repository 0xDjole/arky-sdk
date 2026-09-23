import type { createAdmin } from "arky-sdk/admin";
import type { InventoryUnit, InventoryUnitStatus, ReceiveInventoryUnitParams, ShipmentUnitBinding } from "arky-sdk";
import type { InventoryUnit as PublicUnit, PaginatedResponse } from "arky-sdk/types";
import type { FulfillmentUnitSlots, ResolveFulfillmentUnitSlotsParams } from "arky-sdk";

type Same<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false;
type True<T extends true> = T;
type Api = ReturnType<typeof createAdmin>["eshop"]["inventoryUnit"];
type WorkApi = ReturnType<typeof createAdmin>["eshop"]["shipment"]["fulfillment"];

export type UnitContract = [
  True<Same<Awaited<ReturnType<WorkApi["resolveUnitSlots"]>>, FulfillmentUnitSlots>>,
  True<Same<Parameters<WorkApi["resolveUnitSlots"]>[0], ResolveFulfillmentUnitSlotsParams>>,
  True<Same<FulfillmentUnitSlots["slots"][number]["inventory_unit"], InventoryUnit | null>>,
  True<Same<InventoryUnit, PublicUnit>>,
  True<Same<keyof InventoryUnit, "id" | "store_id" | "inventory_item_id" | "inventory_item_snapshot" | "asset_tag" | "manufacturer_serial" | "status" | "created_at" | "updated_at">>,
  True<Same<keyof Api, "receive" | "get" | "find" | "allocate" | "unassign">>,
  True<Same<Awaited<ReturnType<Api["find"]>>, PaginatedResponse<InventoryUnit>>>,
  True<Same<Awaited<ReturnType<Api["allocate"]>>, InventoryUnit>>,
  True<Same<InventoryUnitStatus["type"], "available" | "allocated" | "issued" | "inspection" | "written_off">>,
  True<Same<keyof Extract<InventoryUnitStatus, { type: "inspection" }>, "type" | "store_location_id" | "return_id" | "return_component_id" | "received_at">>,
  True<{} extends Pick<Extract<InventoryUnitStatus, { type: "inspection" }>, "return_component_id"> ? false : true>,
  True<{} extends Pick<ReceiveInventoryUnitParams, "manufacturer_serial"> ? false : true>,
  True<null extends ReceiveInventoryUnitParams["manufacturer_serial"] ? true : false>,
  True<{} extends Pick<InventoryUnit, "inventory_item_id"> ? false : true>,
  True<null extends InventoryUnit["inventory_item_id"] ? true : false>,
  True<Same<keyof ShipmentUnitBinding, "fulfillment_unit_index" | "inventory_unit_id">>,
];
