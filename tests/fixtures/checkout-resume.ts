import type { createAdmin } from "arky-sdk/admin";
import type { ArkyCheckoutState, createStorefront, initialize } from "arky-sdk/storefront";
import type { CheckoutPaymentAction, ResumeOrderPaymentParams, StorefrontResumeOrderPaymentParams } from "arky-sdk";

type Admin = ReturnType<typeof createAdmin>;
type Storefront = ReturnType<typeof createStorefront>;
type Initialized = ReturnType<typeof initialize>;
type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;

export type CheckoutResumeContracts = [
  Assert<Equal<Parameters<Admin["eshop"]["order"]["resumePayment"]>[0], ResumeOrderPaymentParams>>,
  Assert<Equal<keyof ResumeOrderPaymentParams, "store_id" | "order_id">>,
  Assert<Equal<Awaited<ReturnType<Admin["eshop"]["order"]["resumePayment"]>>, CheckoutPaymentAction>>,
  Assert<Equal<Parameters<Storefront["eshop"]["order"]["resumePayment"]>[0], StorefrontResumeOrderPaymentParams>>,
  Assert<Equal<keyof StorefrontResumeOrderPaymentParams, "order_id">>,
  Assert<Equal<Awaited<ReturnType<Storefront["eshop"]["order"]["resumePayment"]>>, CheckoutPaymentAction>>,
  Assert<Equal<Awaited<ReturnType<ReturnType<Initialized["eshop"]["checkoutFlow"]>["resumePayment"]>>, ArkyCheckoutState>>,
  Assert<Missing<Admin["eshop"]["cart"], "paymentAction">>,
  Assert<Missing<Storefront["eshop"]["order"], "paymentAction">>,
  Assert<Missing<ReturnType<Initialized["eshop"]["cart"]>, "paymentAction">>,
  Assert<Missing<Admin["eshop"], "checkout">>,
  Assert<Missing<Storefront["eshop"], "checkout">>,
  Assert<Equal<CheckoutPaymentAction["type"], "none" | "stripe_embedded_checkout" | "monri_components">>,
];
