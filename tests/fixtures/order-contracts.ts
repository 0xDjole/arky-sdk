import type {
  Order,
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

export type OrderContracts = [
  Assert<Equal<Order, Public.Order>>,
  Assert<Equal<OrderSource, Public.OrderSource>>,
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
  Assert<RequiredNullable<Order, "customer_id">>,
  Assert<RequiredNullable<Order, "company_id">>,
  Assert<RequiredNullable<Order, "company_location_id">>,
  Assert<RequiredNullable<Order, "market_id">>,
  Assert<RequiredNullable<Order, "sales_channel_id">>,
  Assert<RequiredNullable<Order, "customer_snapshot">>,
  Assert<RequiredNullable<Order, "company_snapshot">>,
  Assert<Missing<Order, "source_cart_id">>,
  Assert<Missing<Order, "customer_session_id">>,
  Assert<Missing<Order["booking_items"][number], "customer_session_id">>,
  Assert<Equal<Order["audience_items"], Public.OrderAudienceItem[]>>,
  Assert<
    Equal<
      Extract<OrderSource, { type: "cart" }>,
      { type: "cart"; request_id: string; cart_id: string | null }
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
      Extract<Order["origin"], { type: "storefront" }>,
      { type: "storefront"; customer_id: string; customer_session_id: string }
    >
  >,
];
