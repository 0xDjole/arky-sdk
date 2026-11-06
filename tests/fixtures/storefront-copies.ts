import type { createStorefront } from "arky-sdk/storefront";
import type {
  AccountActor,
  Cart,
  ChargeResolution,
  CheckoutAcceptance,
  Order,
  Payment,
  PaymentMethod,
  ResolvePaymentChargeParams,
  Return,
  StorefrontCart,
  StorefrontCheckoutAcceptance,
  StorefrontOrder,
  StorefrontPayment,
  StorefrontPaymentHold,
  StorefrontPaymentMethod,
  StorefrontPaymentMethodConsent,
  StorefrontRecordedCollection,
  StorefrontRecordedRefund,
  StorefrontReturn,
  StripeCardPaymentStatus,
} from "arky-sdk";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = Extract<K, keyof T> extends never ? true : false;
type Assignable<A, B> = A extends B ? true : false;
type Storefront = ReturnType<typeof createStorefront>;

export type StorefrontCopyContracts = [
  Assert<Assignable<Payment, StorefrontPayment>>,
  Assert<Assignable<Order, StorefrontOrder>>,
  Assert<Assignable<Cart, StorefrontCart>>,
  Assert<Assignable<Return, StorefrontReturn>>,
  Assert<Assignable<PaymentMethod, StorefrontPaymentMethod>>,
  Assert<Assignable<CheckoutAcceptance, StorefrontCheckoutAcceptance>>,
  Assert<Equal<keyof StorefrontPayment, "id" | "store_id" | "order_id" | "payment_option_id" | "money" | "type" | "holds" | "status" | "status_revision" | "created_at" | "updated_at">>,
  Assert<Equal<keyof StorefrontPaymentHold, "id" | "opened_at" | "status">>,
  Assert<Missing<StorefrontRecordedCollection, "recorded_by" | "reference">>,
  Assert<Missing<StorefrontRecordedRefund, "request">>,
  Assert<Missing<StorefrontPaymentMethodConsent, "given_by">>,
  Assert<Missing<StorefrontOrder, "placed_by">>,
  Assert<Missing<StorefrontReturn, "reviewed_by" | "actor">>,
  Assert<Equal<ResolvePaymentChargeParams["outcome"], ChargeResolution>>,
  Assert<Equal<Extract<StripeCardPaymentStatus, { type: "confirmed_not_made" }>, { type: "confirmed_not_made"; by: AccountActor }>>,
  Assert<Equal<Awaited<ReturnType<Storefront["eshop"]["order"]["get"]>>, StorefrontOrder>>,
];
