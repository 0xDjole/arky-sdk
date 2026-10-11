import type {
  CartCustomerGroupDeliveries,
  CartCustomerGroupDelivery,
  CartDeliveryDestination,
  CustomerGroupDeliveryChoice,
  CustomerGroupDeliveryChoices,
  CustomerGroupDeliveryOffer,
  CustomerGroupDeliveryOffers,
  CustomerGroupOccurrence,
  QuoteCartFutureDeliveriesParams,
  SetCartFutureDeliveriesParams,
  StorefrontQuoteCartFutureDeliveriesParams,
  StorefrontSetCartFutureDeliveriesParams,
  createAdmin,
} from "arky-sdk";
import type { CartDeliveryDestination as PublicDestination, CartCustomerGroupDelivery as PublicDelivery, CustomerGroupDeliveryOffers as PublicOffers } from "arky-sdk/types";
import type { CartDeliveryDestination as StorefrontDestination, CartCustomerGroupDelivery as StorefrontDelivery, createStorefront, initialize } from "arky-sdk/storefront";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type AdminCart = ReturnType<typeof createAdmin>["eshop"]["cart"];
type StorefrontCart = ReturnType<typeof createStorefront>["eshop"]["cart"];
type InitializedCart = ReturnType<typeof initialize>["eshop"]["cart"];

export type DeliveryContracts = [
  Assert<Equal<CartDeliveryDestination, PublicDestination>>,
  Assert<Equal<CartDeliveryDestination, StorefrontDestination>>,
  Assert<Equal<CartCustomerGroupDelivery, PublicDelivery>>,
  Assert<Equal<CartCustomerGroupDelivery, StorefrontDelivery>>,
  Assert<Equal<CustomerGroupDeliveryOffers, PublicOffers>>,
  Assert<Equal<Parameters<AdminCart["quoteFutureDeliveries"]>[0], QuoteCartFutureDeliveriesParams>>,
  Assert<Equal<Parameters<AdminCart["setFutureDeliveries"]>[0], SetCartFutureDeliveriesParams>>,
  Assert<Equal<Parameters<StorefrontCart["quoteFutureDeliveries"]>[0], StorefrontQuoteCartFutureDeliveriesParams>>,
  Assert<Equal<Parameters<StorefrontCart["setFutureDeliveries"]>[0], StorefrontSetCartFutureDeliveriesParams>>,
  Assert<Equal<keyof StorefrontQuoteCartFutureDeliveriesParams, "id" | "token" | "customer_groups">>,
  Assert<Equal<keyof StorefrontSetCartFutureDeliveriesParams, "id" | "token" | "expected_updated_at" | "customer_groups">>,
  Assert<Equal<SetCartFutureDeliveriesParams["customer_groups"], CartCustomerGroupDeliveries[]>>,
  Assert<Missing<SetCartFutureDeliveriesParams, "plans">>,
  Assert<Missing<QuoteCartFutureDeliveriesParams, "plans">>,
  Assert<Equal<Parameters<InitializedCart["quoteFutureDeliveries"]>[0], CustomerGroupDeliveryChoices[]>>,
  Assert<Equal<Parameters<InitializedCart["setFutureDeliveries"]>[0], CartCustomerGroupDeliveries[]>>,
  Assert<Equal<Awaited<ReturnType<AdminCart["quoteFutureDeliveries"]>>, CustomerGroupDeliveryOffers[]>>,
  Assert<Equal<Awaited<ReturnType<StorefrontCart["quoteFutureDeliveries"]>>, CustomerGroupDeliveryOffers[]>>,
  Assert<Equal<QuoteCartFutureDeliveriesParams["language"], string>>,
  Assert<Missing<StorefrontQuoteCartFutureDeliveriesParams, "language">>,
  Assert<Equal<CustomerGroupDeliveryChoices["deliveries"], CustomerGroupDeliveryChoice[]>>,
  Assert<Equal<keyof CustomerGroupDeliveryChoice, "id" | "entitlement_ids" | "destination">>,
  Assert<Equal<keyof CartCustomerGroupDelivery, "id" | "entitlement_ids" | "destination" | "shipping">>,
  Assert<Equal<CustomerGroupDeliveryOffers["deliveries"], CustomerGroupDeliveryOffer[]>>,
  Assert<Equal<CustomerGroupDeliveryOffers["occurrence"], CustomerGroupOccurrence>>,
  Assert<Missing<AdminCart, "acceptFutureDeliveries">>,
];
