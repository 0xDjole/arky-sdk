import type { createAdmin } from "arky-sdk/admin";
import type { createStorefront } from "arky-sdk/storefront";
import type {
  ActOnReturnParams,
  CreateReturnParams,
  CreditReturnParams,
  FindReturnsParams,
  GetReturnInspectionUnitParams,
  GetReturnParams,
  OrderCredit,
  OrderReturnOptions,
  Return,
  ReturnAction,
  ReturnDestination,
  ReturnDestinationOptions,
  ReturnDisposition,
  ReturnInspectionUnit,
  ReturnItem,
  ReturnStatus,
  ReturnType as ArkyReturnType,
  ReturnTypeRequest,
  StorefrontCreateReturnParams,
  StorefrontFindReturnsParams,
} from "arky-sdk";
import type { Return as PublicReturn, PaginatedResponse } from "arky-sdk/types";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Api = ReturnType<typeof createAdmin>["eshop"]["return"];
type StorefrontReturnApi = ReturnType<typeof createStorefront>["eshop"]["return"];

export type ReturnContract = [
  Assert<Equal<Return, PublicReturn>>,
  Assert<Equal<keyof Return, "id" | "store_id" | "type" | "requested_by" | "tracking" | "status" | "created_at" | "updated_at">>,
  Assert<Missing<Return, "request_id" | "source" | "lines" | "destination">>,
  Assert<Equal<ArkyReturnType["type"], "order" | "rental">>,
  Assert<Equal<ReturnTypeRequest["type"], "order" | "rental">>,
  Assert<Equal<Extract<ReturnStatus, { type: "requested" }>["destination"], ReturnDestination>>,
  Assert<Equal<ReturnDestination, { type: "undecided" } | { type: "decided"; store_location_id: string }>>,
  Assert<Equal<ReturnStatus["type"], "requested" | "declined" | "open" | "closed" | "cancelled">>,
  Assert<Equal<keyof ReturnItem, "inventory_item_id" | "quantity" | "received" | "missing" | "decisions">>,
  Assert<Equal<ReturnDisposition, { type: "restocked" } | { type: "not_restocked"; reason: string }>>,
  Assert<Equal<keyof ReturnDestinationOptions, "return_id" | "suggested_store_location_id" | "store_location_ids">>,
  Assert<Equal<ReturnInspectionUnit, { store_id: string; return_id: string; line_id: string; inventory_item_id: string; inventory_unit_id: string }>>,
  Assert<Equal<ReturnAction["type"], "approve" | "decide" | "decline" | "cancel" | "receive" | "dispose" | "missing" | "tracking">>,
  Assert<Equal<Extract<ReturnAction, { type: "decide" }>, { type: "decide"; store_location_id: string }>>,
  Assert<Equal<keyof Extract<ReturnAction, { type: "receive" }>["items"][number], "line_id" | "inventory_item_id" | "quantity" | "inventory_unit_ids">>,
  Assert<Equal<keyof Extract<ReturnAction, { type: "missing" }>["items"][number], "line_id" | "inventory_item_id" | "quantity">>,
  Assert<Equal<keyof ActOnReturnParams, "store_id" | "return_id" | "expected_updated_at" | "command">>,
  Assert<Equal<ActOnReturnParams["command"], ReturnAction>>,
  Assert<RequiredField<CreateReturnParams, "id">>,
  Assert<Equal<CreateReturnParams["type"], ReturnTypeRequest>>,
  Assert<Missing<CreateReturnParams, "request_id" | "source" | "lines">>,
  Assert<Equal<StorefrontCreateReturnParams["destination_store_location_id"], CreateReturnParams["destination_store_location_id"]>>,
  Assert<Missing<StorefrontCreateReturnParams, "store_id">>,
  Assert<Equal<Parameters<StorefrontReturnApi["create"]>[0], StorefrontCreateReturnParams>>,
  Assert<Equal<NonNullable<Parameters<StorefrontReturnApi["find"]>[0]>, StorefrontFindReturnsParams>>,
  Assert<Equal<Awaited<ReturnType<StorefrontReturnApi["orderOptions"]>>, OrderReturnOptions>>,
  Assert<Equal<keyof FindReturnsParams, "store_id" | "order_id" | "rental_id" | "destination_store_location_id" | "status" | "limit" | "cursor" | "sort_field" | "sort_direction">>,
  Assert<Equal<keyof Api, "create" | "get" | "find" | "execute" | "credit" | "destinationOptions" | "inspectionUnit" | "orderOptions" | "rentalOptions">>,
  Assert<Equal<Parameters<Api["destinationOptions"]>[0], GetReturnParams>>,
  Assert<Equal<Awaited<ReturnType<Api["destinationOptions"]>>, ReturnDestinationOptions>>,
  Assert<Equal<Parameters<Api["inspectionUnit"]>[0], GetReturnInspectionUnitParams>>,
  Assert<Equal<Awaited<ReturnType<Api["inspectionUnit"]>>, ReturnInspectionUnit>>,
  Assert<Equal<Awaited<ReturnType<Api["find"]>>, PaginatedResponse<Return>>>,
  Assert<Equal<Awaited<ReturnType<Api["execute"]>>, Return>>,
  Assert<Equal<Parameters<Api["credit"]>[0], CreditReturnParams>>,
  Assert<Equal<Awaited<ReturnType<Api["credit"]>>, OrderCredit>>,
  Assert<RequiredField<CreditReturnParams, "id">>,
  Assert<Equal<Return["tracking"] extends infer T ? null extends T ? true : false : false, true>>,
];
