import type {
  Order,
  OrderLineItem,
  OrderPurchaseSource,
  OrderStatus,
  OrderType,
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
  Assert<Equal<OrderType, Public.OrderType>>,
  Assert<Equal<OrderPurchaseSource, Public.OrderPurchaseSource>>,
  Assert<Equal<OrderStatus, Public.OrderStatus>>,
  Assert<
    Equal<keyof UpdateOrderParams, "id" | "store_id" | "confirm" | "cancel">
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
      Extract<OrderLineItem, { type: "customer_group_plan" }>["type"],
      "customer_group_plan"
    >
  >,
  Assert<
    Equal<
      Extract<OrderPurchaseSource, { type: "checkout" }>,
      { type: "checkout"; checkout_id: string }
    >
  >,
  Assert<
    Equal<
      Extract<OrderPurchaseSource, { type: "direct" }>,
      { type: "direct"; request_id: string }
    >
  >,
  Assert<
    Equal<
      Extract<OrderType, { type: "customer_group" }>,
      { type: "customer_group"; order_customer_group_line_item_id: string }
    >
  >,
  Assert<
    Equal<
      Extract<Order["origin"], { type: "admin" }>["type"],
      "admin"
    >
  >,
];
