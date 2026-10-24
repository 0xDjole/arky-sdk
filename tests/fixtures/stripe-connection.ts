import type { createAdmin } from "arky-sdk/admin";
import type {
  CheckoutPaymentAction,
  CheckStripeSetupParams,
  ConnectStripePaymentOptionParams,
  EpochMilliseconds,
  PaymentOption,
  PaymentOptionType,
  RefreshStripePaymentOptionParams,
  ReplaceStripeKeysParams,
  SaveStripeWebhookSecretParams,
  StoreSubscriptionPaymentAction,
  StripeConnection,
  StripeSetup,
  StripeSetupProblem,
  StripeWebhook,
  StripeWebhookEndpoint,
  LocalizedMarkdown,
  UpdatePaymentOptionParams,
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
  Assert<Equal<keyof Stripe, "connect" | "saveWebhookSecret" | "checkSetup" | "replaceKeys" | "refresh">>,
  Assert<Equal<Parameters<Stripe["connect"]>[0], ConnectStripePaymentOptionParams>>,
  Assert<Equal<Parameters<Stripe["saveWebhookSecret"]>[0], SaveStripeWebhookSecretParams>>,
  Assert<Equal<SaveStripeWebhookSecretParams, { store_id: string; id: string; expected_updated_at: EpochMilliseconds; signing_secret: string; previous_secret_expires_at: EpochMilliseconds | null }>>,
  Assert<RequiredField<SaveStripeWebhookSecretParams, "previous_secret_expires_at">>,
  Assert<Equal<Awaited<ReturnType<Stripe["saveWebhookSecret"]>>, PaymentOption>>,
  Assert<Equal<Parameters<Stripe["checkSetup"]>[0], CheckStripeSetupParams>>,
  Assert<Equal<CheckStripeSetupParams, { store_id: string; id: string }>>,
  Assert<Equal<Awaited<ReturnType<Stripe["checkSetup"]>>, StripeSetup>>,
  Assert<Equal<StripeSetup, { webhook_address: string; api_version: string; events: string[]; webhook_id: string | null; problems: StripeSetupProblem[] }>>,
  Assert<Equal<StripeSetupProblem["type"], "charges_disabled" | "webhook_secret_missing" | "webhook_unreadable" | "webhook_missing" | "webhook_duplicated" | "webhook_disabled" | "webhook_events_missing" | "webhook_api_version" | "webhook_replaced">>,
  Assert<Equal<Extract<StripeSetupProblem, { type: "webhook_api_version" }>, { type: "webhook_api_version"; api_version: string | null }>>,
  Assert<Equal<Extract<StripeSetupProblem, { type: "webhook_replaced" }>, { type: "webhook_replaced"; saved_webhook_id: string }>>,
  Assert<Missing<Stripe, "createWebhook" | "rotateWebhookSecret">>,
  Assert<Equal<Parameters<Stripe["replaceKeys"]>[0], ReplaceStripeKeysParams>>,
  Assert<Equal<Parameters<Stripe["refresh"]>[0], RefreshStripePaymentOptionParams>>,
  Assert<Equal<Awaited<ReturnType<Stripe["connect"]>>, PaymentOption>>,
  Assert<Equal<Awaited<ReturnType<Stripe["refresh"]>>, PaymentOption>>,
  Assert<RequiredField<ConnectStripePaymentOptionParams, "id">>,
  Assert<RequiredField<ConnectStripePaymentOptionParams, "restricted_key">>,
  Assert<RequiredField<ConnectStripePaymentOptionParams, "saved_card_terms">>,
  Assert<Equal<ConnectStripePaymentOptionParams["saved_card_terms"], LocalizedMarkdown>>,
  Assert<Equal<StripeConnection["saved_card_terms"], LocalizedMarkdown>>,
  Assert<RequiredField<UpdatePaymentOptionParams, "saved_card_terms">>,
  Assert<Equal<UpdatePaymentOptionParams["saved_card_terms"], LocalizedMarkdown | null>>,
  Assert<RequiredField<RefreshStripePaymentOptionParams, "expected_updated_at">>,
  Assert<RequiredField<ReplaceStripeKeysParams, "expected_updated_at">>,
  Assert<Missing<ConnectStripePaymentOptionParams, "request_id" | "connected_account_id" | "configuration">>,
  Assert<Equal<StripeWebhook["type"], "not_configured" | "awaiting_first_event" | "verified">>,
  Assert<Missing<StripeWebhookEndpoint, "endpoint_url">>,
  Assert<Equal<keyof StripeWebhookEndpoint, "endpoint_id" | "api_version" | "enabled_events" | "previous_signing_secret">>,
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
  saved_card_terms: { en: "The Store's exact saved-card wording." },
};
