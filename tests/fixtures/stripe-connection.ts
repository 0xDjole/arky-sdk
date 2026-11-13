import type { createAdmin } from "arky-sdk/admin";
import type {
  CheckoutPaymentAction,
  CheckStripeSetupParams,
  ConnectStripeStoreProviderParams,
  CreateCardPaymentOptionParams,
  EpochMilliseconds,
  PaymentOption,
  PaymentOptionType,
  RefreshStripeStoreProviderParams,
  ReplaceStripeKeysParams,
  SaveStripeWebhookSecretParams,
  StoreProvider,
  StoreSubscriptionPayment,
  StripeConnection,
  StripeSecretKeyKind,
  StripeSetup,
  StripeSetupProblem,
  StripeWebhook,
  StripeWebhookEndpoint,
  LocalizedMarkdown,
  UpdatePaymentOptionParams,
} from "arky-sdk";

type Admin = ReturnType<typeof createAdmin>;
type Provider = Admin["store"]["provider"];
type Options = Admin["store"]["paymentOption"];
type StripeLogin = Extract<StoreProvider["type"], { type: "stripe" }>;
type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type StripeCheckout = Extract<CheckoutPaymentAction, { type: "stripe_embedded_checkout" }>;
type BillingPayment = Extract<StoreSubscriptionPayment, { type: "stripe" }>;

export type StripeConnectionContracts = [
  Assert<Missing<Options, "stripe" | "arkyStripe">>,
  Assert<Equal<Parameters<Provider["connectStripe"]>[0], ConnectStripeStoreProviderParams>>,
  Assert<Equal<ConnectStripeStoreProviderParams, { store_id: string; id: string; restricted_key: string; publishable_key: string }>>,
  Assert<Equal<Awaited<ReturnType<Provider["connectStripe"]>>, StoreProvider>>,
  Assert<Equal<StripeLogin["secret_key"], StripeSecretKeyKind>>,
  Assert<Equal<StripeSecretKeyKind, "standard" | "restricted">>,
  Assert<Equal<Parameters<Provider["saveStripeWebhookSecret"]>[0], SaveStripeWebhookSecretParams>>,
  Assert<Equal<SaveStripeWebhookSecretParams, { store_id: string; id: string; expected_updated_at: EpochMilliseconds; signing_secret: string; previous_secret_expires_at: EpochMilliseconds | null }>>,
  Assert<RequiredField<SaveStripeWebhookSecretParams, "previous_secret_expires_at">>,
  Assert<Equal<Awaited<ReturnType<Provider["saveStripeWebhookSecret"]>>, StoreProvider>>,
  Assert<Equal<Parameters<Provider["checkStripeSetup"]>[0], CheckStripeSetupParams>>,
  Assert<Equal<CheckStripeSetupParams, { store_id: string; id: string }>>,
  Assert<Equal<Awaited<ReturnType<Provider["checkStripeSetup"]>>, StripeSetup>>,
  Assert<Equal<StripeSetup, { webhook_address: string; events: string[]; webhook_id: string | null; problems: StripeSetupProblem[] }>>,
  Assert<Missing<StripeSetup, "api_version">>,
  Assert<Equal<StripeSetupProblem["type"], "charges_disabled" | "webhook_secret_missing" | "webhook_unreadable" | "webhook_missing" | "webhook_duplicated" | "webhook_disabled" | "webhook_events_missing" | "webhook_replaced">>,
  Assert<Equal<Extract<StripeSetupProblem, { type: "webhook_replaced" }>, { type: "webhook_replaced"; saved_webhook_id: string }>>,
  Assert<Missing<Provider, "createWebhook" | "rotateWebhookSecret">>,
  Assert<Equal<Parameters<Provider["replaceStripeKeys"]>[0], ReplaceStripeKeysParams>>,
  Assert<Equal<Awaited<ReturnType<Provider["replaceStripeKeys"]>>, StoreProvider>>,
  Assert<Equal<Parameters<Provider["refreshStripe"]>[0], RefreshStripeStoreProviderParams>>,
  Assert<Equal<Awaited<ReturnType<Provider["refreshStripe"]>>, StoreProvider>>,
  Assert<Equal<Parameters<Options["createStripe"]>[0], CreateCardPaymentOptionParams>>,
  Assert<Equal<Awaited<ReturnType<Options["createStripe"]>>, PaymentOption>>,
  Assert<RequiredField<ConnectStripeStoreProviderParams, "id">>,
  Assert<RequiredField<ConnectStripeStoreProviderParams, "restricted_key">>,
  Assert<RequiredField<CreateCardPaymentOptionParams, "provider_id">>,
  Assert<RequiredField<CreateCardPaymentOptionParams, "saved_card_terms">>,
  Assert<Equal<CreateCardPaymentOptionParams["saved_card_terms"], LocalizedMarkdown>>,
  Assert<Equal<StripeConnection["saved_card_terms"], LocalizedMarkdown>>,
  Assert<Equal<StripeConnection["provider_id"], string>>,
  Assert<RequiredField<UpdatePaymentOptionParams, "saved_card_terms">>,
  Assert<Equal<UpdatePaymentOptionParams["saved_card_terms"], LocalizedMarkdown | null>>,
  Assert<RequiredField<RefreshStripeStoreProviderParams, "expected_updated_at">>,
  Assert<RequiredField<ReplaceStripeKeysParams, "expected_updated_at">>,
  Assert<Missing<ConnectStripeStoreProviderParams, "request_id" | "connected_account_id" | "configuration">>,
  Assert<Equal<StripeWebhook["type"], "not_configured" | "awaiting_first_event" | "verified">>,
  Assert<Missing<StripeWebhookEndpoint, "endpoint_url" | "api_version">>,
  Assert<Equal<keyof StripeWebhookEndpoint, "endpoint_id" | "enabled_events" | "previous_signing_secret">>,
  Assert<Equal<Extract<PaymentOptionType, { type: "stripe" }>["account_id"], StripeConnection["account_id"]>>,
  Assert<Missing<StripeConnection, "restricted_key" | "secret_key" | "signing_secret">>,
  Assert<Missing<StripeCheckout, "account_id" | "connected_account_id">>,
  Assert<Missing<BillingPayment, "account_id" | "stripe_account_id">>,
  Assert<Equal<PaymentOption["status"], "active" | "disabled">>,
];

export const connect: ConnectStripeStoreProviderParams = {
  store_id: "4c7a2e95-1d38-4b60-8f9e-0a5d3c7b2e14",
  id: "5b8c1e47-3d29-4a6f-9c15-7e0d2f4a8b31",
  restricted_key: "rk_test",
  publishable_key: "pk_test",
};

export const option: CreateCardPaymentOptionParams = {
  store_id: "4c7a2e95-1d38-4b60-8f9e-0a5d3c7b2e14",
  provider_id: "5b8c1e47-3d29-4a6f-9c15-7e0d2f4a8b31",
  id: "2e9d4b17-6a35-4c80-b1f2-8d7e3a5c9f04",
  key: "stripe",
  blocks: [],
  status: "active",
  saved_card_terms: { en: "The Store's exact saved-card wording." },
};
