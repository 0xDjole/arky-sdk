import type {
  CartPackageDeliveries,
  CartPackageDelivery,
  CartDeliveryDestination,
  PackageDeliveryChoice,
  PackageDeliveryChoices,
  PackageDeliveryOffer,
  PackageDeliveryOffers,
  PackageOccurrence,
  QuoteCartFutureDeliveriesParams,
  SetCartFutureDeliveriesParams,
  StorefrontQuoteCartFutureDeliveriesParams,
  StorefrontSetCartFutureDeliveriesParams,
  createAdmin,
} from "arky-sdk";
import type { CartDeliveryDestination as PublicDestination, CartPackageDelivery as PublicDelivery, PackageDeliveryOffers as PublicOffers } from "arky-sdk/types";
import type { CartDeliveryDestination as StorefrontDestination, CartPackageDelivery as StorefrontDelivery, createStorefront, initialize } from "arky-sdk/storefront";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type AdminCart = ReturnType<typeof createAdmin>["eshop"]["cart"];
type StorefrontCart = ReturnType<typeof createStorefront>["eshop"]["cart"];
type InitializedCart = ReturnType<ReturnType<typeof initialize>["eshop"]["cart"]>;

export type DeliveryContracts = [
  Assert<Equal<CartDeliveryDestination, PublicDestination>>,
  Assert<Equal<CartDeliveryDestination, StorefrontDestination>>,
  Assert<Equal<CartPackageDelivery, PublicDelivery>>,
  Assert<Equal<CartPackageDelivery, StorefrontDelivery>>,
  Assert<Equal<PackageDeliveryOffers, PublicOffers>>,
  Assert<Equal<Parameters<AdminCart["quoteFutureDeliveries"]>[0], QuoteCartFutureDeliveriesParams>>,
  Assert<Equal<Parameters<AdminCart["setFutureDeliveries"]>[0], SetCartFutureDeliveriesParams>>,
  Assert<Equal<Parameters<StorefrontCart["quoteFutureDeliveries"]>[0], StorefrontQuoteCartFutureDeliveriesParams>>,
  Assert<Equal<Parameters<StorefrontCart["setFutureDeliveries"]>[0], StorefrontSetCartFutureDeliveriesParams>>,
  Assert<Equal<keyof StorefrontQuoteCartFutureDeliveriesParams, "id" | "token" | "packages">>,
  Assert<Equal<keyof StorefrontSetCartFutureDeliveriesParams, "id" | "token" | "expected_updated_at" | "packages">>,
  Assert<Equal<SetCartFutureDeliveriesParams["packages"], CartPackageDeliveries[]>>,
  Assert<Missing<SetCartFutureDeliveriesParams, "plans">>,
  Assert<Missing<QuoteCartFutureDeliveriesParams, "plans">>,
  Assert<Equal<Parameters<InitializedCart["quoteFutureDeliveries"]>[0]["packages"], PackageDeliveryChoices[]>>,
  Assert<Equal<Parameters<InitializedCart["setFutureDeliveries"]>[0]["packages"], CartPackageDeliveries[]>>,
  Assert<Equal<Awaited<ReturnType<AdminCart["quoteFutureDeliveries"]>>, PackageDeliveryOffers[]>>,
  Assert<Equal<Awaited<ReturnType<StorefrontCart["quoteFutureDeliveries"]>>, PackageDeliveryOffers[]>>,
  Assert<Equal<QuoteCartFutureDeliveriesParams["language"], string>>,
  Assert<Missing<StorefrontQuoteCartFutureDeliveriesParams, "language">>,
  Assert<Equal<PackageDeliveryChoices["deliveries"], PackageDeliveryChoice[]>>,
  Assert<Equal<keyof PackageDeliveryChoice, "id" | "package_item_ids" | "destination">>,
  Assert<Equal<keyof CartPackageDelivery, "id" | "package_item_ids" | "destination" | "shipping">>,
  Assert<Equal<PackageDeliveryOffers["deliveries"], PackageDeliveryOffer[]>>,
  Assert<Equal<PackageDeliveryOffers["occurrence"], PackageOccurrence>>,
  Assert<Missing<AdminCart, "acceptFutureDeliveries">>,
];
