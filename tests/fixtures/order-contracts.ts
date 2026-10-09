import type {
  Order,
  OrderBuyer,
  OrderCollection,
  OrderLineItem,
  OrderSource,
  OrderStatus,
  OrderTotals,
  CancelOrderBookingItemParams,
  CancelOrderProductItemParams,
  StorefrontCancelOrderBookingItemParams,
  StorefrontCancelOrderProductItemParams,
  ResendOrderReceiptParams,
  Actor,
} from "arky-sdk";
import type { createAdmin } from "arky-sdk/admin";
import type * as Public from "arky-sdk/types";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type RequiredNullable<T, K extends keyof T> = {} extends Pick<T, K> ? false : null extends T[K] ? true : false;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type OrderApi = ReturnType<typeof createAdmin>["eshop"]["order"];

export type OrderContracts = [
  Assert<Equal<Order, Public.Order>>,
  Assert<Equal<OrderSource, Public.OrderSource>>,
  Assert<Equal<OrderStatus, Public.OrderStatus>>,
  Assert<Equal<OrderStatus, "pending" | "confirmed" | "partially_cancelled" | "cancelled">>,
  Assert<Equal<OrderSource["type"], "cart" | "renewal">>,
  Assert<Equal<Extract<OrderSource, { type: "cart" }>, { type: "cart"; cart_id: string; placed_by: Actor }>>,
  Assert<RequiredField<Order, "customer_id">>,
  Assert<RequiredField<Order, "contact">>,
  Assert<Equal<Order["buyer"], OrderBuyer>>,
  Assert<Equal<OrderBuyer["type"], "personal" | "company">>,
  Assert<Equal<Order["collection"], OrderCollection>>,
  Assert<Equal<OrderCollection["type"], "free" | "payment_option" | "subscription" | "on_account">>,
  Assert<Equal<Order["market_id"], string>>,
  Assert<Equal<Order["sales_channel_id"], string>>,
  Assert<Equal<Order["language"], string>>,
  Assert<Equal<Order["totals"], OrderTotals>>,
  Assert<RequiredNullable<Order, "billing_address">>,
  Assert<Missing<Order, "company">>,
  Assert<Missing<Order, "customer_snapshot">>,
  Assert<Missing<Order, "market_snapshot">>,
  Assert<Missing<Order, "payment_terms">>,
  Assert<Missing<Order, "money">>,
  Assert<Missing<Order, "product_items">>,
  Assert<Missing<Order, "booking_items">>,
  Assert<Missing<Order, "digital_items">>,
  Assert<Equal<Order["line_items"], OrderLineItem[]>>,
  Assert<Equal<OrderLineItem["type"], "product" | "booking" | "subscription_plan" | "rental_use" | "purchase_access">>,
  Assert<Equal<keyof CancelOrderBookingItemParams, "store_id" | "order_id" | "line_item_id" | "credit_id" | "expected_updated_at">>,
  Assert<Equal<keyof CancelOrderProductItemParams, "store_id" | "order_id" | "line_item_id" | "credit_id" | "expected_updated_at" | "units">>,
  Assert<Equal<keyof StorefrontCancelOrderBookingItemParams, Exclude<keyof CancelOrderBookingItemParams, "store_id">>>,
  Assert<Equal<keyof StorefrontCancelOrderProductItemParams, Exclude<keyof CancelOrderProductItemParams, "store_id">>>,
  Assert<Equal<keyof ResendOrderReceiptParams, "store_id" | "order_id" | "id">>,
  Assert<Missing<OrderApi, "update">>,
  Assert<Missing<OrderApi, "getBookingAppointment">>,
  Assert<Missing<OrderApi, "resumePayment">>,
  Assert<Missing<OrderApi, "getQuote">>,
];
