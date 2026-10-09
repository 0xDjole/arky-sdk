import type { createAdmin } from "arky-sdk/admin";
import type {
  CheckoutPaymentAction,
  ConnectStripePaymentOptionParams,
  CreateStripeWebhookParams,
  PaymentOption,
  PaymentOptionType,
  RefreshStripePaymentOptionParams,
  ReplaceStripeKeysParams,
  RotateStripeWebhookSecretParams,
  StoreSubscriptionPaymentAction,
  StripeConnection,
  StripeWebhook,
} from "arky-sdk";

type Admin = ReturnType<typeof createAdmin>;
type Stripe = Admin["store"]["paymentOption"]["stripe"];
type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type StripeCheckout = Extract<CheckoutPaymentAction, { type: "stripe_embedded_checkout" }>;
type BillingCheckout = Extract<StoreSubscriptionPaymentAction, { type: "stripe_embedded_checkout" }>;

export type StripeConnectionContracts = [
  Assert<Equal<keyof Stripe, "connect" | "createWebhook" | "rotateWebhookSecret" | "replaceKeys" | "refresh">>,
  Assert<Equal<Parameters<Stripe["connect"]>[0], ConnectStripePaymentOptionParams>>,
  Assert<Equal<Parameters<Stripe["createWebhook"]>[0], CreateStripeWebhookParams>>,
  Assert<Equal<Parameters<Stripe["rotateWebhookSecret"]>[0], RotateStripeWebhookSecretParams>>,
  Assert<Equal<Parameters<Stripe["replaceKeys"]>[0], ReplaceStripeKeysParams>>,
  Assert<Equal<Parameters<Stripe["refresh"]>[0], RefreshStripePaymentOptionParams>>,
  Assert<Equal<Awaited<ReturnType<Stripe["connect"]>>, PaymentOption>>,
  Assert<Equal<Awaited<ReturnType<Stripe["refresh"]>>, PaymentOption>>,
  Assert<RequiredField<ConnectStripePaymentOptionParams, "id">>,
  Assert<RequiredField<ConnectStripePaymentOptionParams, "restricted_key">>,
  Assert<RequiredField<RefreshStripePaymentOptionParams, "expected_updated_at">>,
  Assert<RequiredField<ReplaceStripeKeysParams, "expected_updated_at">>,
  Assert<Missing<ConnectStripePaymentOptionParams, "request_id" | "connected_account_id" | "configuration">>,
  Assert<Equal<StripeWebhook["type"], "not_created" | "awaiting_first_event" | "verified">>,
  Assert<Equal<Extract<PaymentOptionType, { type: "stripe" }>["account_id"], StripeConnection["account_id"]>>,
  Assert<Missing<StripeConnection, "restricted_key" | "secret_key" | "signing_secret">>,
  Assert<Missing<StripeCheckout, "account_id" | "connected_account_id">>,
  Assert<Missing<BillingCheckout, "account_id" | "stripe_account_id">>,
  Assert<Equal<PaymentOption["status"], "active" | "disabled">>,
];

export const connect: ConnectStripePaymentOptionParams = {
  store_id: "4c7a2e95-1d38-4b60-8f9e-0a5d3c7b2e14",
  id: "5b8c1e47-3d29-4a6f-9c15-7e0d2f4a8b31",
  key: "stripe",
  blocks: [],
  status: "active",
  restricted_key: "rk_test",
  publishable_key: "pk_test",
};
