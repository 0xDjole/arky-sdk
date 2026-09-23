import type { createAdmin } from "arky-sdk/admin";
import type { InventoryUnit, InventoryUnitStatus, ReceiveInventoryUnitParams, ShipmentUnitBinding } from "arky-sdk";
import type { InventoryUnit as PublicUnit, PaginatedResponse } from "arky-sdk/types";

type Same<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false;
type True<T extends true> = T;
type Api = ReturnType<typeof createAdmin>["eshop"]["inventoryUnit"];

export type UnitContract = [
  True<Same<InventoryUnit, PublicUnit>>,
  True<Same<keyof InventoryUnit, "id" | "store_id" | "inventory_item_id" | "inventory_item_snapshot" | "asset_tag" | "manufacturer_serial" | "status" | "created_at" | "updated_at">>,
  True<Same<keyof Api, "receive" | "get" | "find" | "allocate" | "unassign">>,
  True<Same<Awaited<ReturnType<Api["find"]>>, PaginatedResponse<InventoryUnit>>>,
  True<Same<Awaited<ReturnType<Api["allocate"]>>, InventoryUnit>>,
  True<Same<InventoryUnitStatus["type"], "available" | "allocated" | "issued" | "inspection" | "written_off">>,
  True<{} extends Pick<ReceiveInventoryUnitParams, "manufacturer_serial"> ? false : true>,
  True<null extends ReceiveInventoryUnitParams["manufacturer_serial"] ? true : false>,
  True<{} extends Pick<InventoryUnit, "inventory_item_id"> ? false : true>,
  True<null extends InventoryUnit["inventory_item_id"] ? true : false>,
  True<Same<keyof ShipmentUnitBinding, "fulfillment_unit_index" | "inventory_unit_id">>,
];
