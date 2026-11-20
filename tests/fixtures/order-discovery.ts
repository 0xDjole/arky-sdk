import type { createAdmin } from "arky-sdk/admin";
import type { createStorefront } from "arky-sdk/storefront";
import type {
  FindOrdersParams,
  Order,
  OrderBookingStatusFilter,
  OrderItemStatusFilter,
  OrderSourceFilter,
  OrderStatus,
  PaginatedResponse,
  StorefrontFindOrdersParams,
  StorefrontOrder,
  OrderBookingItemRow,
  OrderBookingLineReminder,
  OrderProduct,
  StorefrontOrderPayments,
  Invoice,
  ReminderResult,
  EpochMilliseconds,
} from "arky-sdk";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type AdminOrders = ReturnType<typeof createAdmin>["eshop"]["order"];
type StorefrontOrders = ReturnType<typeof createStorefront>["eshop"]["order"];

const filters: FindOrdersParams = {
  store_id: "9d3e7b50-1a26-4f8c-b74e-0c5a2d9f6e13",
  query: "ORD-2026",
  statuses: ["confirmed"],
  sources: ["cart", "renewal"],
  product_statuses: ["cancelled"],
  booking_statuses: ["no_show"],
  sort_field: "price",
  sort_direction: "asc",
  cursor: null,
  limit: 1,
  package_member_ids: ["d397ff50-690b-4da7-9fb9-17740e535d69"],
};
const buyerFilters: StorefrontFindOrdersParams = { query: "ORD-2026", sort_field: "number" };

export type OrderDiscoveryContracts = [
  Assert<Equal<Parameters<AdminOrders["find"]>[0], FindOrdersParams>>,
  Assert<Equal<Awaited<ReturnType<AdminOrders["findBookingItems"]>>["items"][number], OrderBookingItemRow>>,
  Assert<Equal<OrderBookingItemRow["live_invoice"], Invoice | null>>,
  Assert<Equal<OrderBookingItemRow["booking_line_count"], number>>,
  Assert<Equal<Awaited<ReturnType<AdminOrders["findBookingReminders"]>>, OrderBookingLineReminder[]>>,
  Assert<Equal<OrderBookingLineReminder["result"], ReminderResult | null>>,
  Assert<Equal<OrderBookingLineReminder["sent_at"], EpochMilliseconds | null>>,
  Assert<Equal<Awaited<ReturnType<AdminOrders["findProducts"]>>, OrderProduct[]>>,
  Assert<Equal<Awaited<ReturnType<StorefrontOrders["findProducts"]>>, OrderProduct[]>>,
  Assert<Equal<Awaited<ReturnType<StorefrontOrders["findOrdersPayments"]>>, StorefrontOrderPayments[]>>,
  Assert<Equal<Parameters<StorefrontOrders["findOrdersPayments"]>[0], { order_ids: string[] }>>,
  Assert<Equal<Extract<OrderProduct, { type: "gone" }>, { type: "gone"; id: string }>>,
  Assert<Equal<Awaited<ReturnType<AdminOrders["find"]>>, PaginatedResponse<Order>>>,
  Assert<Equal<Awaited<ReturnType<StorefrontOrders["find"]>>, PaginatedResponse<StorefrontOrder>>>,
  Assert<Equal<NonNullable<FindOrdersParams["sort_field"]>, "number" | "created_at" | "updated_at" | "status" | "price">>,
  Assert<Equal<NonNullable<FindOrdersParams["statuses"]>[number], OrderStatus>>,
  Assert<Equal<OrderStatus, "pending" | "confirmed" | "partially_cancelled" | "cancelled">>,
  Assert<Equal<OrderSourceFilter, "cart" | "renewal">>,
  Assert<Equal<OrderItemStatusFilter, "pending" | "confirmed" | "cancelled">>,
  Assert<Equal<OrderBookingStatusFilter, "pending" | "confirmed" | "waiting" | "in_progress" | "attended" | "no_show" | "cancelled">>,
  Assert<Equal<NonNullable<FindOrdersParams["query"]>, string>>,
  Assert<Equal<FindOrdersParams["package_member_ids"], string[] | undefined>>,
  Assert<Equal<FindOrdersParams["ids"], string[] | undefined>>,
  Assert<Equal<{ store_id: string; ids: string[]; query: string } extends FindOrdersParams ? true : false, false>>,
  Assert<Equal<{ store_id: string; ids: string[]; limit: number } extends FindOrdersParams ? true : false, false>>,
  Assert<Missing<StorefrontFindOrdersParams, "ids">>,
  Assert<Missing<StorefrontFindOrdersParams, "store_id" | "customer_id" | "subscription_id" | "package_member_id" | "package_member_ids">>,
  Assert<Equal<NonNullable<Parameters<StorefrontOrders["find"]>[0]>, StorefrontFindOrdersParams>>,
];

void [filters, buyerFilters];
