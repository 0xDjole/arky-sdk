import type { createAdmin } from "arky-sdk/admin";
import type { InventoryUnit, InventoryUnitStatus, ReceiveInventoryUnitParams, SelectedUnit, InventoryUnitExecution, MoveInventoryUnitParams, WriteOffInventoryUnitParams } from "arky-sdk";
import type { InventoryUnit as PublicUnit, PaginatedResponse } from "arky-sdk/types";
import type { FulfillmentUnitSlots, ResolveFulfillmentUnitSlotsParams } from "arky-sdk";

type Same<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false;
type True<T extends true> = T;
type Api = ReturnType<typeof createAdmin>["eshop"]["inventoryUnit"];
type WorkApi = ReturnType<typeof createAdmin>["eshop"]["fulfillmentJob"];

export type UnitContract = [
  True<Same<Awaited<ReturnType<WorkApi["unitSlots"]>>, FulfillmentUnitSlots>>,
  True<Same<Parameters<WorkApi["unitSlots"]>[0], ResolveFulfillmentUnitSlotsParams>>,
  True<Same<FulfillmentUnitSlots["slots"][number]["inventory_unit"], InventoryUnit | null>>,
  True<Same<InventoryUnit, PublicUnit>>,
  True<Same<keyof InventoryUnit, "id" | "store_id" | "inventory_item_id" | "asset_tag" | "manufacturer_serial" | "status" | "created_at" | "updated_at">>,
  True<Same<keyof Api, "receive" | "get" | "execution" | "find" | "allocate" | "unassign" | "move" | "writeOff">>,
  True<Same<Awaited<ReturnType<Api["find"]>>, PaginatedResponse<InventoryUnit>>>,
  True<Same<Awaited<ReturnType<Api["allocate"]>>, InventoryUnit>>,
  True<Same<Awaited<ReturnType<Api["execution"]>>, InventoryUnitExecution | null>>,
  True<Same<InventoryUnitStatus["type"], "available" | "allocated" | "issued" | "rented" | "inspection" | "written_off">>,
  True<Same<keyof Extract<InventoryUnitStatus, { type: "inspection" }>, "type" | "store_location_id" | "return_id" | "received_at">>,
  True<Same<keyof InventoryUnitExecution, "fulfillment_job_id" | "fulfillment_job_line_id" | "fulfillment_unit_index" | "fulfillment_id" | "executed_at">>,
  True<Same<Parameters<Api["move"]>[0], MoveInventoryUnitParams>>,
  True<Same<Parameters<Api["writeOff"]>[0], WriteOffInventoryUnitParams>>,
  True<{} extends Pick<ReceiveInventoryUnitParams, "manufacturer_serial"> ? false : true>,
  True<null extends ReceiveInventoryUnitParams["manufacturer_serial"] ? true : false>,
  True<{} extends Pick<InventoryUnit, "inventory_item_id"> ? false : true>,
  True<Same<InventoryUnit["inventory_item_id"], string>>,
  True<Same<keyof SelectedUnit, "fulfillment_unit_index" | "inventory_unit_id">>,
];
