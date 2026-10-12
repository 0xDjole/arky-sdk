import type { createAdmin } from "arky-sdk/admin";
import type {
  FulfillmentUnitSlots,
  InventoryUnit,
  InventoryUnitExecution,
  InventoryUnitStatus,
  InventoryUnitWriteOffSource,
  MoveInventoryUnitParams,
  ReceiveInventoryUnitParams,
  ResolveFulfillmentUnitSlotsParams,
  SelectedUnit,
  WriteOffInventoryUnitParams,
} from "arky-sdk";
import type { InventoryUnit as PublicUnit, PaginatedResponse } from "arky-sdk/types";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Api = ReturnType<typeof createAdmin>["eshop"]["inventoryUnit"];
type WorkApi = ReturnType<typeof createAdmin>["eshop"]["fulfillmentJob"];

export type UnitContract = [
  Assert<Equal<Awaited<ReturnType<WorkApi["unitSlots"]>>, FulfillmentUnitSlots>>,
  Assert<Equal<Parameters<WorkApi["unitSlots"]>[0], ResolveFulfillmentUnitSlotsParams>>,
  Assert<Equal<FulfillmentUnitSlots["slots"][number]["inventory_unit"], InventoryUnit | null>>,
  Assert<Equal<InventoryUnit, PublicUnit>>,
  Assert<Equal<keyof InventoryUnit, "id" | "store_id" | "inventory_item_id" | "asset_tag" | "manufacturer_serial" | "status" | "created_at" | "updated_at">>,
  Assert<Equal<keyof Api, "receive" | "get" | "execution" | "find" | "allocate" | "unassign" | "move" | "writeOff">>,
  Assert<Equal<Awaited<ReturnType<Api["find"]>>, PaginatedResponse<InventoryUnit>>>,
  Assert<Equal<Awaited<ReturnType<Api["allocate"]>>, InventoryUnit>>,
  Assert<Equal<Awaited<ReturnType<Api["execution"]>>, InventoryUnitExecution | null>>,
  Assert<Equal<InventoryUnitStatus["type"], "available" | "allocated" | "issued" | "rented" | "returning" | "inspection" | "written_off">>,
  Assert<Equal<keyof Extract<InventoryUnitStatus, { type: "inspection" }>, "type" | "store_location_id" | "return_id" | "received_at">>,
  Assert<Equal<Extract<InventoryUnitStatus, { type: "written_off" }>["source"], InventoryUnitWriteOffSource>>,
  Assert<Equal<InventoryUnitWriteOffSource["type"], "warehouse" | "rental" | "return_disposition">>,
  Assert<Equal<keyof InventoryUnitExecution, "fulfillment_job_id" | "fulfillment_job_line_id" | "fulfillment_unit_index" | "fulfillment_id" | "executed_at">>,
  Assert<Equal<Parameters<Api["move"]>[0], MoveInventoryUnitParams>>,
  Assert<RequiredField<MoveInventoryUnitParams, "action_id">>,
  Assert<Equal<Parameters<Api["writeOff"]>[0], WriteOffInventoryUnitParams>>,
  Assert<Missing<WriteOffInventoryUnitParams, "request_id" | "action_id">>,
  Assert<RequiredField<ReceiveInventoryUnitParams, "id">>,
  Assert<RequiredField<ReceiveInventoryUnitParams, "manufacturer_serial">>,
  Assert<Equal<ReceiveInventoryUnitParams["manufacturer_serial"], string | null>>,
  Assert<Equal<keyof SelectedUnit, "fulfillment_unit_index" | "inventory_unit_id">>,
];
