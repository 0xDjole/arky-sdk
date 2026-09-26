import type { createAdmin } from "arky-sdk/admin";
import type { Return, ReturnCommand, ReturnComponentReceipt, ReturnLine, ReturnLineSource, ReturnSource, CreateReturnParams, ExecuteReturnParams, FindReturnsParams } from "arky-sdk";
import type { Return as PublicReturn, PaginatedResponse } from "arky-sdk/types";

type Same<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false;
type True<T extends true> = T;
type Api = ReturnType<typeof createAdmin>["eshop"]["return"];

export type ReturnContract = [
  True<Same<Return, PublicReturn>>,
  True<Same<keyof Return, "id" | "store_id" | "source" | "destination_store_location_id" | "requested_by" | "lines" | "selected_label_id" | "status" | "created_at" | "updated_at" | "command_id">>,
  True<Same<keyof ReturnLine, "id" | "source" | "reason" | "components">>,
  True<Same<keyof ReturnComponentReceipt, "id" | "unit_index" | "source_inventory_item_id" | "authorized_quantity" | "received_quantity" | "closed_unreceived_quantity" | "restocked_quantity" | "written_off_quantity" | "discarded_quantity">>,
  True<Same<ReturnSource["type"], "order" | "rental">>,
  True<Same<keyof Extract<ReturnSource, { type: "rental" }>, "type" | "rental_id">>,
  True<Same<ReturnLineSource["type"], "order_product" | "rental_unit">>,
  True<Same<keyof Extract<ReturnLineSource, { type: "rental_unit" }>, "type" | "inventory_unit_id">>,
  True<"unit_spans" extends keyof Extract<ReturnLineSource, { type: "rental_unit" }> ? false : true>,
  True<Same<CreateReturnParams["source"], ReturnSource>>,
  True<Same<ExecuteReturnParams["source"], ReturnSource>>,
  True<Same<keyof FindReturnsParams, "store_id" | "order_id" | "rental_id" | "destination_store_location_id" | "status" | "limit" | "cursor" | "sort_field" | "sort_direction">>,
  True<{} extends FindReturnsParams ? true : false>,
  True<{ rental_id: string } extends FindReturnsParams ? true : false>,
  True<{ order_id: string; rental_id: string } extends FindReturnsParams ? false : true>,
  True<Same<Parameters<Api["find"]>[0], FindReturnsParams | undefined>>,
  True<Same<ReturnCommand["type"], "authorize" | "cancel" | "receive" | "dispose" | "close">>,
  True<Same<keyof Api, "create" | "get" | "find" | "execute">>,
  True<Same<Awaited<ReturnType<Api["find"]>>, PaginatedResponse<Return>>>,
  True<Same<Awaited<ReturnType<Api["get"]>>, Return>>,
  True<Same<Awaited<ReturnType<Api["create"]>>, Return>>,
  True<Same<Awaited<ReturnType<Api["execute"]>>, Return>>,
  True<Same<Parameters<Api["create"]>[0], CreateReturnParams>>,
  True<Same<Parameters<Api["execute"]>[0], ExecuteReturnParams>>,
  True<{} extends Pick<Return, "selected_label_id"> ? false : true>,
  True<null extends Return["selected_label_id"] ? true : false>,
  True<Same<Extract<ReturnCommand, { type: "dispose" }>["components"][number]["disposition"]["type"], "restock" | "write_off" | "discard">>,
];
