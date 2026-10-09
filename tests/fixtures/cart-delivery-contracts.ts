import type {
  CartDeliveryDestination,
  CartPlanDeliveries,
  CartSubscriptionDelivery,
  PlanDeliveryChoice,
  PlanDeliveryChoices,
  PlanDeliveryOffer,
  PlanDeliveryOffers,
  QuoteCartFutureDeliveriesParams,
  SetCartFutureDeliveriesParams,
  StorefrontQuoteCartFutureDeliveriesParams,
  StorefrontSetCartFutureDeliveriesParams,
  createAdmin,
} from "arky-sdk";
import type { CartDeliveryDestination as PublicDestination, CartSubscriptionDelivery as PublicDelivery, PlanDeliveryOffers as PublicOffers } from "arky-sdk/types";
import type { CartDeliveryDestination as StorefrontDestination, CartSubscriptionDelivery as StorefrontDelivery, createStorefront, initialize } from "arky-sdk/storefront";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type AdminCart = ReturnType<typeof createAdmin>["eshop"]["cart"];
type StorefrontCart = ReturnType<typeof createStorefront>["eshop"]["cart"];
type InitializedCart = ReturnType<typeof initialize>["eshop"]["cart"];

export type DeliveryContracts = [
  Assert<Equal<CartDeliveryDestination, PublicDestination>>,
  Assert<Equal<CartDeliveryDestination, StorefrontDestination>>,
  Assert<Equal<CartSubscriptionDelivery, PublicDelivery>>,
  Assert<Equal<CartSubscriptionDelivery, StorefrontDelivery>>,
  Assert<Equal<PlanDeliveryOffers, PublicOffers>>,
  Assert<Equal<Parameters<AdminCart["quoteFutureDeliveries"]>[0], QuoteCartFutureDeliveriesParams>>,
  Assert<Equal<Parameters<AdminCart["setFutureDeliveries"]>[0], SetCartFutureDeliveriesParams>>,
  Assert<Equal<Parameters<StorefrontCart["quoteFutureDeliveries"]>[0], StorefrontQuoteCartFutureDeliveriesParams>>,
  Assert<Equal<Parameters<StorefrontCart["setFutureDeliveries"]>[0], StorefrontSetCartFutureDeliveriesParams>>,
  Assert<Equal<keyof StorefrontQuoteCartFutureDeliveriesParams, "id" | "token" | "plans">>,
  Assert<Equal<Parameters<InitializedCart["quoteFutureDeliveries"]>[0], PlanDeliveryChoices[]>>,
  Assert<Equal<Parameters<InitializedCart["setFutureDeliveries"]>[0], CartPlanDeliveries[]>>,
  Assert<Equal<Awaited<ReturnType<AdminCart["quoteFutureDeliveries"]>>, PlanDeliveryOffers[]>>,
  Assert<Equal<Awaited<ReturnType<StorefrontCart["quoteFutureDeliveries"]>>, PlanDeliveryOffers[]>>,
  Assert<Equal<QuoteCartFutureDeliveriesParams["language"], string>>,
  Assert<Missing<StorefrontQuoteCartFutureDeliveriesParams, "language">>,
  Assert<Equal<PlanDeliveryChoices["deliveries"], PlanDeliveryChoice[]>>,
  Assert<Equal<keyof PlanDeliveryChoice, "id" | "entitlement_ids" | "destination">>,
  Assert<Equal<keyof CartSubscriptionDelivery, "id" | "entitlement_ids" | "destination" | "shipping">>,
  Assert<Equal<PlanDeliveryOffers["deliveries"], PlanDeliveryOffer[]>>,
  Assert<Missing<AdminCart, "acceptFutureDeliveries">>,
];
