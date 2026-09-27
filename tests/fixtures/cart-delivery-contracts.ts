import type {
  AcceptCartFutureDeliveriesParams,
  CartFutureDeliveryQuote,
  FutureDeliveryProposalStatus,
  FutureDeliveryWindowBasis,
  QuoteCartFutureDeliveriesParams,
  SubscriptionDeliveryEntitlementUnits,
  UnitSpan,
  createAdmin,
} from "arky-sdk";
import type { CartFutureDeliveryQuote as PublicQuote } from "arky-sdk/types";
import type { CartFutureDeliveryQuote as StorefrontQuote, createStorefront, initialize } from "arky-sdk/storefront";

type Same<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false;
type True<T extends true> = T;
type AdminCart = ReturnType<typeof createAdmin>["eshop"]["cart"];
type StorefrontCart = ReturnType<typeof createStorefront>["eshop"]["cart"];
type InitializedCart = ReturnType<typeof initialize>["eshop"]["cart"];

export type DeliveryContracts = [
  True<Same<CartFutureDeliveryQuote, PublicQuote>>,
  True<Same<CartFutureDeliveryQuote, StorefrontQuote>>,
  True<Same<Parameters<AdminCart["quoteFutureDeliveries"]>[0], QuoteCartFutureDeliveriesParams>>,
  True<Same<Parameters<AdminCart["acceptFutureDeliveries"]>[0], AcceptCartFutureDeliveriesParams>>,
  True<Same<keyof Parameters<StorefrontCart["quoteFutureDeliveries"]>[0], "id" | "plans">>,
  True<Same<keyof Parameters<StorefrontCart["acceptFutureDeliveries"]>[0], "id" | "plans">>,
  True<Same<keyof Parameters<InitializedCart["quoteFutureDeliveries"]>[0], "plans">>,
  True<Same<keyof Parameters<InitializedCart["acceptFutureDeliveries"]>[0], "plans">>,
  True<Same<Awaited<ReturnType<AdminCart["quoteFutureDeliveries"]>>, CartFutureDeliveryQuote>>,
  True<Same<FutureDeliveryProposalStatus["type"], "ready" | "selection_required">>,
  True<Same<keyof Extract<FutureDeliveryProposalStatus, { type: "ready" }>, "type" | "terms" | "quote_acceptance">>,
  True<Same<keyof Extract<FutureDeliveryProposalStatus, { type: "selection_required" }>, "type">>,
  True<Same<FutureDeliveryWindowBasis["entitlements"], SubscriptionDeliveryEntitlementUnits[]>>,
  True<Same<SubscriptionDeliveryEntitlementUnits["units"], UnitSpan>>,
  True<Same<CartFutureDeliveryQuote["cart"], { cart_id: string; version: string }>>,
];
