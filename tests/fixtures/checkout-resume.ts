import type { createAdmin } from "arky-sdk/admin";
import type { createStorefront, initialize } from "arky-sdk/storefront";
import type { CheckoutPaymentAction, GetOrderPaymentActionParams } from "arky-sdk";

type Admin = ReturnType<typeof createAdmin>;
type Storefront = ReturnType<typeof createStorefront>;
type Initialized = ReturnType<typeof initialize>;
type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;

export type CheckoutResumeContracts = [
  Assert<Equal<Parameters<Admin["eshop"]["cart"]["paymentAction"]>[0], GetOrderPaymentActionParams>>,
  Assert<Equal<keyof GetOrderPaymentActionParams, "store_id" | "order_id">>,
  Assert<Equal<Awaited<ReturnType<Admin["eshop"]["cart"]["paymentAction"]>>, CheckoutPaymentAction>>,
  Assert<Equal<Parameters<Storefront["eshop"]["order"]["paymentAction"]>[0], { order_id: string }>>,
  Assert<Equal<Awaited<ReturnType<Storefront["eshop"]["order"]["paymentAction"]>>, CheckoutPaymentAction>>,
  Assert<Equal<Parameters<Initialized["eshop"]["cart"]["paymentAction"]>, [orderId: string]>>,
  Assert<Equal<Awaited<ReturnType<Initialized["eshop"]["cart"]["paymentAction"]>>, CheckoutPaymentAction>>,
  Assert<Missing<Admin["eshop"], "checkout">>,
  Assert<Missing<Storefront["eshop"], "checkout">>,
  Assert<Equal<CheckoutPaymentAction["type"], "none" | "stripe_embedded_checkout" | "monri_components">>,
];
