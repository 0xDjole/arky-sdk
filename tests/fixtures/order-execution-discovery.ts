import type { createAdmin } from "arky-sdk/admin";
import type { OrderInvoice, OrderPickup, OrderShipment, FulfillmentOrder, CreateOrderShipmentParams } from "arky-sdk";
import type { OrderInvoice as PublicInvoice, OrderPickup as PublicPickup, PaginatedResponse } from "arky-sdk/types";
import { selectShipmentUnits } from "arky-sdk/utils";
type Same<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false;
type True<T extends true> = T;
type Api = ReturnType<typeof createAdmin>["eshop"];
export type HistoryContract = [
  True<Same<OrderInvoice, PublicInvoice>>,
  True<Same<OrderPickup, PublicPickup>>,
  True<Same<Awaited<ReturnType<Api["invoice"]["find"]>>, PaginatedResponse<OrderInvoice>>>,
  True<Same<Awaited<ReturnType<Api["pickup"]["get"]>>, OrderPickup>>,
  True<Same<OrderShipment["status"]["type"], "pending" | "label_created" | "in_transit" | "out_for_delivery" | "delivered" | "failed" | "returned" | "cancelled">>,
  True<Same<FulfillmentOrder["method"]["type"], "pickup" | "delivery">>,
  True<Same<ReturnType<typeof selectShipmentUnits>, CreateOrderShipmentParams["lines"][number]>>,
  True<"unit_spans" extends keyof OrderShipment["lines"][number] ? true : false>,
  True<"order_product_item_id" extends keyof OrderShipment["lines"][number] ? false : true>,
];
