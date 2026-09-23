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
  True<Same<FulfillmentOrder["lines"][number]["source"]["type"], "order_product">>,
  True<Same<keyof FulfillmentOrder["lines"][number]["source"], "type" | "order_id" | "order_delivery_group_id" | "order_product_line_item_id" | "order_unit_spans">>,
  True<"order_id" extends keyof FulfillmentOrder ? false : true>,
  True<"order_delivery_group_id" extends keyof FulfillmentOrder ? false : true>,
  True<"unit_spans" extends keyof FulfillmentOrder["lines"][number] ? false : true>,
  True<"order_product_item_id" extends keyof FulfillmentOrder["lines"][number] ? false : true>,
  True<Same<ReturnType<typeof selectShipmentUnits>, CreateOrderShipmentParams["lines"][number]>>,
  True<Same<keyof OrderShipment["lines"][number], "fulfillment_order_line_id" | "unit_spans" | "unit_bindings">>,
  True<Same<keyof OrderPickup["lines"][number], "fulfillment_order_line_id" | "unit_spans" | "unit_bindings">>,
  True<Same<OrderPickup["lines"][number]["unit_bindings"], OrderShipment["lines"][number]["unit_bindings"]>>,
  True<{} extends Pick<OrderShipment["lines"][number], "unit_bindings"> ? false : true>,
  True<Same<Awaited<ReturnType<Api["shipment"]["cancel"]>>, OrderShipment>>,
  True<"order_product_item_id" extends keyof OrderShipment["lines"][number] ? false : true>,
];
