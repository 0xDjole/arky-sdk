import type {
  Order,
  OrderLineItem,
  OrderSource,
  OrderStatus,
  UpdateOrderParams,
} from "arky-sdk";
import type * as Public from "arky-sdk/types";

type Assert<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type RequiredNullable<T, K extends keyof T> =
  {} extends Pick<T, K> ? false : null extends T[K] ? true : false;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;

export type OrderContracts = [
  Assert<Equal<Order, Public.Order>>,
  Assert<Equal<OrderSource, Public.OrderSource>>,
  Assert<Equal<OrderStatus, Public.OrderStatus>>,
  Assert<
    Equal<keyof UpdateOrderParams, "id" | "store_id" | "confirm">
  >,
  Assert<
    Equal<
      OrderStatus,
      { type: "pending" | "confirmed" | "partially_cancelled" | "cancelled" }
    >
  >,
  Assert<RequiredField<Order, "customer_id">>,
  Assert<RequiredField<Order, "customer_snapshot">>,
  Assert<RequiredNullable<Order, "company">>,
  Assert<RequiredNullable<Order, "market_id">>,
  Assert<RequiredNullable<Order, "sales_channel_id">>,
  Assert<RequiredField<Order, "market_snapshot">>,
  Assert<RequiredField<Order, "sales_channel_snapshot">>,
  Assert<Missing<Order, "company_id">>,
  Assert<Missing<Order, "company_location_id">>,
  Assert<Missing<Order, "company_snapshot">>,
  Assert<Missing<Order, "source_cart_id">>,
  Assert<Missing<Order, "customer_session_id">>,
  Assert<Missing<Order, "product_items">>,
  Assert<Missing<Order, "booking_items">>,
  Assert<Missing<Order, "digital_items">>,
  Assert<Missing<Order, "audience_items">>,
  Assert<Equal<Order["line_items"], OrderLineItem[]>>,
  Assert<
    Equal<
      Extract<OrderLineItem, { type: "subscription_plan" }>["type"],
      "subscription_plan"
    >
  >,
  Assert<Equal<Order["source"], OrderSource>>,
  Assert<Missing<Order, "type">>,
  Assert<
    Equal<
      OrderSource["type"],
      "cart_acceptance" | "direct" | "exchange" | "subscription"
    >
  >,
  Assert<
    Equal<
      Extract<OrderSource, { type: "direct" }>,
      { type: "direct"; request_id: string }
    >
  >,
  Assert<
    Equal<
      Extract<OrderSource, { type: "subscription" }>,
      { type: "subscription"; order_subscription_line_item_id: string }
    >
  >,
  Assert<
    Equal<
      Extract<Order["origin"], { type: "admin" }>["type"],
      "admin"
    >
  >,
];
