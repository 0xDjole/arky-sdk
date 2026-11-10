import type { createAdmin } from "arky-sdk/admin";
import {
  isSimulatedPayment,
  mountCheckoutAction,
  mountPaymentMethodSetup,
  simulatePayment,
} from "arky-sdk";
import {
  isSimulatedPayment as storefrontIsSimulatedPayment,
  simulatePayment as storefrontSimulatePayment,
} from "arky-sdk/storefront";
import type {
  Account,
  CheckoutPaymentAction,
  ConnectArkyMonriPaymentOptionParams,
  ConnectArkyResendEmailProviderParams,
  ConnectArkyStripePaymentOptionParams,
  CreateSimulatorPlannedOutcomeParams,
  CreateStoreParams,
  EmailProvider,
  EmbeddedCheckoutMount,
  EpochMilliseconds,
  FindPaymentOptionsParams,
  FindSimulatedEmailsParams,
  FindSimulatorPlannedOutcomesParams,
  LocalizedMarkdown,
  MonriComponentsAction,
  MonriConnection,
  PaginatedResponse,
  PaymentMethodSetupStart,
  PaymentOption,
  PaymentOptionType,
  PaymentOptionTypeName,
  PaymentRunsOn,
  RemoveSimulatorPlannedOutcomeParams,
  SimulatorPaymentControlParams,
  SimulatedEmail,
  SimulatorMonriOperation,
  SimulatorPlannedOperation,
  SimulatorPlannedOutcome,
  SimulatorPlannedResult,
  SimulatorProvider,
  SimulatorResendOperation,
  SimulatorStripeOperation,
  Store,
  StoreMembershipWithStoreName,
  StoreType,
  StoreCardSetup,
  CreateStoreType,
  StoreSubscriptionPayment,
  StorefrontPaymentMethodSetupStart,
  StorefrontPaymentOption,
  StorefrontPaymentOptionType,
  StripeConnection,
  StripeEmbeddedCheckoutAction,
} from "arky-sdk";
import type { PaymentSimulation, SimulatePaymentParams } from "arky-sdk/storefront";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Admin = ReturnType<typeof createAdmin>;
type PaymentOptions = Admin["store"]["paymentOption"];
type EmailProviders = Admin["notification"]["emailProvider"];
type Simulator = Admin["store"]["simulator"];
type StripeAction = Extract<CheckoutPaymentAction, { type: "stripe_embedded_checkout" }>;
type PlanAction = Extract<StoreSubscriptionPayment, { type: "stripe" }>;
type SimulatorMount = Extract<EmbeddedCheckoutMount, { type: "simulator" }>;

export type TestStoreContracts = [
  Assert<Equal<StoreType, { type: "live"; account_id: string; network_id: string } | { type: "test"; store_id: string }>>,
  Assert<Equal<Store["type"], StoreType>>,
  Assert<Equal<CreateStoreParams["type"], CreateStoreType>>,
  Assert<RequiredField<CreateStoreParams, "type">>,
  Assert<Missing<Account, "test_stores">>,
  Assert<Equal<StoreMembershipWithStoreName["store_type"], StoreType>>,

  Assert<Equal<PaymentRunsOn, { type: "provider" } | { type: "simulator"; api_url: string }>>,
  Assert<Equal<StripeAction["runs_on"], PaymentRunsOn>>,
  Assert<Equal<PlanAction["runs_on"], PaymentRunsOn>>,
  Assert<Equal<MonriComponentsAction["runs_on"], PaymentRunsOn>>,
  Assert<Equal<PaymentMethodSetupStart["runs_on"], PaymentRunsOn>>,
  Assert<Equal<Parameters<typeof isSimulatedPayment>[0], CheckoutPaymentAction | StoreSubscriptionPayment | StorefrontPaymentMethodSetupStart | StoreCardSetup>>,
  Assert<Equal<ReturnType<typeof isSimulatedPayment>, boolean>>,
  Assert<Equal<typeof isSimulatedPayment, typeof storefrontIsSimulatedPayment>>,
  Assert<Equal<typeof simulatePayment, typeof storefrontSimulatePayment>>,

  Assert<Equal<PaymentSimulation["type"], "stripe_checkout" | "stripe_payment_intent" | "monri" | "card_setup">>,
  Assert<Equal<Extract<PaymentSimulation, { type: "stripe_checkout" }>["action"], StripeEmbeddedCheckoutAction>>,
  Assert<Equal<Extract<PaymentSimulation, { type: "stripe_checkout" }>["outcome"], "complete" | "decline" | "expire">>,
  Assert<Equal<Extract<PaymentSimulation, { type: "stripe_payment_intent" }>["action"], PlanAction>>,
  Assert<Equal<Extract<PaymentSimulation, { type: "stripe_payment_intent" }>["outcome"], "complete" | "decline">>,
  Assert<Equal<Extract<PaymentSimulation, { type: "monri" }>["action"], MonriComponentsAction>>,
  Assert<Equal<Extract<PaymentSimulation, { type: "monri" }>["outcome"], "complete" | "decline">>,
  Assert<Equal<Extract<PaymentSimulation, { type: "card_setup" }>["setup"], StorefrontPaymentMethodSetupStart | StoreCardSetup>>,
  Assert<Equal<Extract<PaymentSimulation, { type: "card_setup" }>["outcome"], "complete" | "cancel" | "decline">>,
  Assert<Missing<Extract<PaymentSimulation, { type: "monri" }>, "payment_id" | "attempt_id">>,
  Assert<Equal<keyof SimulatePaymentParams, "simulation">>,
  Assert<Missing<SimulatePaymentParams, "simulator_url">>,
  Assert<Equal<Awaited<ReturnType<typeof simulatePayment>>, void>>,

  Assert<Equal<PaymentOptionTypeName, "cash_on_delivery" | "manual" | "stripe" | "monri" | "arky_stripe" | "arky_monri">>,
  Assert<Equal<FindPaymentOptionsParams["type_name"], PaymentOptionTypeName | undefined>>,
  Assert<Equal<Extract<PaymentOptionType, { type: "arky_stripe" }>["account_id"], StripeConnection["account_id"]>>,
  Assert<Equal<Extract<PaymentOptionType, { type: "arky_monri" }>["environment"], MonriConnection["environment"]>>,
  Assert<Missing<StripeConnection, "host" | "mode" | "base_url">>,
  Assert<Missing<MonriConnection, "host" | "mode" | "base_url">>,
  Assert<Equal<StorefrontPaymentOptionType, "cash_on_delivery" | "manual" | "stripe" | "monri">>,
  Assert<Equal<StorefrontPaymentOption["type"], StorefrontPaymentOptionType>>,

  Assert<Equal<keyof PaymentOptions["arkyStripe"], "connect">>,
  Assert<Equal<keyof PaymentOptions["arkyMonri"], "connect">>,
  Assert<Equal<Parameters<PaymentOptions["arkyStripe"]["connect"]>[0], ConnectArkyStripePaymentOptionParams>>,
  Assert<Equal<Parameters<PaymentOptions["arkyMonri"]["connect"]>[0], ConnectArkyMonriPaymentOptionParams>>,
  Assert<Equal<keyof ConnectArkyStripePaymentOptionParams, "store_id" | "id" | "key" | "blocks" | "status" | "saved_card_terms">>,
  Assert<Equal<keyof ConnectArkyMonriPaymentOptionParams, "store_id" | "id" | "key" | "blocks" | "status" | "saved_card_terms">>,
  Assert<Equal<ConnectArkyStripePaymentOptionParams["saved_card_terms"], LocalizedMarkdown>>,
  Assert<Equal<Awaited<ReturnType<PaymentOptions["arkyStripe"]["connect"]>>, PaymentOption>>,
  Assert<Equal<Awaited<ReturnType<PaymentOptions["arkyMonri"]["connect"]>>, PaymentOption>>,

  Assert<Equal<EmailProvider["type"]["type"], "resend" | "arky_resend">>,
  Assert<Equal<Extract<EmailProvider["type"], { type: "arky_resend" }>, { type: "arky_resend" }>>,
  Assert<Equal<Extract<EmailProvider["type"], { type: "resend" }>["webhook_id"], string>>,
  Assert<Equal<Parameters<EmailProviders["connectArkyResend"]>[0], ConnectArkyResendEmailProviderParams>>,
  Assert<Equal<ConnectArkyResendEmailProviderParams, { store_id: string; id: string; name: string; domains: string[] }>>,
  Assert<Equal<Awaited<ReturnType<EmailProviders["connectArkyResend"]>>, EmailProvider>>,

  Assert<Equal<keyof Simulator, "payments" | "emails" | "plannedOutcomes">>,
  Assert<Equal<keyof Simulator["payments"], "pay" | "decline" | "expire">>,
  Assert<Equal<Parameters<Simulator["payments"]["pay"]>[0], SimulatorPaymentControlParams>>,
  Assert<Equal<SimulatorPaymentControlParams, { store_id: string; payment_id: string }>>,
  Assert<Equal<Awaited<ReturnType<Simulator["payments"]["pay"]>>, void>>,
  Assert<Equal<Awaited<ReturnType<Simulator["payments"]["decline"]>>, void>>,
  Assert<Equal<Awaited<ReturnType<Simulator["payments"]["expire"]>>, void>>,
  Assert<Equal<keyof Simulator["emails"], "find">>,
  Assert<Equal<Parameters<Simulator["emails"]["find"]>[0], FindSimulatedEmailsParams>>,
  Assert<Equal<keyof FindSimulatedEmailsParams, "store_id" | "to" | "limit" | "cursor">>,
  Assert<Equal<Awaited<ReturnType<Simulator["emails"]["find"]>>, PaginatedResponse<SimulatedEmail>>>,
  Assert<Equal<SimulatedEmail["created_at"], EpochMilliseconds>>,
  Assert<Equal<SimulatedEmail["html"], string | null>>,
  Assert<Equal<SimulatedEmail["tags"], { name: string; value: string }[]>>,
  Assert<Equal<keyof Simulator["plannedOutcomes"], "create" | "find" | "remove">>,
  Assert<Equal<Parameters<Simulator["plannedOutcomes"]["create"]>[0], CreateSimulatorPlannedOutcomeParams>>,
  Assert<Equal<Extract<CreateSimulatorPlannedOutcomeParams, { provider: "stripe" }>["operation"], SimulatorStripeOperation>>,
  Assert<Equal<Extract<CreateSimulatorPlannedOutcomeParams, { provider: "monri" }>["operation"], SimulatorMonriOperation>>,
  Assert<Equal<Extract<CreateSimulatorPlannedOutcomeParams, { provider: "resend" }>["operation"], SimulatorResendOperation>>,
  Assert<Equal<Extract<SimulatorPlannedOperation, { provider: "resend" }>["operation"] & "create_checkout_session", never>>,
  Assert<Equal<SimulatorProvider, "stripe" | "monri" | "resend">>,
  Assert<Equal<SimulatorPlannedResult["type"], "refused" | "rate_limited" | "unavailable" | "lost_response" | "delayed" | "declined" | "missing_link" | "expired_link" | "daily_quota_exceeded" | "monthly_quota_exceeded">>,
  Assert<Equal<Extract<SimulatorPlannedResult, { type: "daily_quota_exceeded" }>, { type: "daily_quota_exceeded" }>>,
  Assert<Equal<Extract<SimulatorPlannedResult, { type: "monthly_quota_exceeded" }>, { type: "monthly_quota_exceeded" }>>,
  Assert<Equal<SimulatorPlannedOutcome["outcome"], SimulatorPlannedResult>>,
  Assert<Equal<CreateSimulatorPlannedOutcomeParams["outcome"], SimulatorPlannedResult>>,
  Assert<Equal<Awaited<ReturnType<Simulator["plannedOutcomes"]["create"]>>, SimulatorPlannedOutcome>>,
  Assert<Equal<Parameters<Simulator["plannedOutcomes"]["find"]>[0], FindSimulatorPlannedOutcomesParams>>,
  Assert<Equal<Awaited<ReturnType<Simulator["plannedOutcomes"]["find"]>>, PaginatedResponse<SimulatorPlannedOutcome>>>,
  Assert<Equal<Parameters<Simulator["plannedOutcomes"]["remove"]>[0], RemoveSimulatorPlannedOutcomeParams>>,
  Assert<Equal<Awaited<ReturnType<Simulator["plannedOutcomes"]["remove"]>>, { deleted: boolean }>>,

  Assert<Equal<EmbeddedCheckoutMount["type"], "stripe_embedded_checkout" | "monri_components" | "simulator">>,
  Assert<Equal<keyof SimulatorMount, "type" | "unmount" | "destroy">>,
  Assert<Missing<SimulatorMount, "checkout" | "confirm">>,
];

export const stripeSimulation: PaymentSimulation = {
  type: "stripe_checkout",
  action: { type: "stripe_embedded_checkout", publishable_key: "pk_test_arky", client_secret: "cs_secret_x", expires_at: 1 as EpochMilliseconds, runs_on: { type: "simulator", api_url: "https://api.arky.io" } },
  outcome: "decline",
};

export const storePaymentSimulation: SimulatePaymentParams = {
  simulation: {
    type: "stripe_payment_intent",
    action: { type: "stripe", payment_intent_id: "pi_store", publishable_key: "pk_test_network", client_secret: "pi_store_secret_exact", runs_on: { type: "simulator", api_url: "https://api.arky.io" } },
    outcome: "complete",
  },
};

export const planned: CreateSimulatorPlannedOutcomeParams = {
  store_id: "store",
  id: "plan",
  provider: "monri",
  operation: "charge_saved_card",
  matching: { type: "payment", payment_id: "payment" },
  outcome: { type: "declined" },
};

export const delayed: CreateSimulatorPlannedOutcomeParams = {
  store_id: "store",
  id: "plan",
  provider: "stripe",
  operation: "deliver_webhook",
  matching: { type: "any" },
  outcome: { type: "delayed", delay_ms: 1000 },
};

export const refused: CreateSimulatorPlannedOutcomeParams = {
  store_id: "store",
  id: "plan",
  provider: "resend",
  operation: "send_email",
  matching: { type: "to", address: "buyer@example.test" },
  outcome: { type: "refused", message: "No" },
};

export const dailyQuota: CreateSimulatorPlannedOutcomeParams = {
  store_id: "store",
  id: "plan",
  provider: "resend",
  operation: "send_email",
  matching: { type: "any" },
  outcome: { type: "daily_quota_exceeded" },
};

export const monthlyQuota: CreateSimulatorPlannedOutcomeParams = {
  store_id: "store",
  id: "plan",
  provider: "resend",
  operation: "send_email",
  matching: { type: "to", address: "buyer@example.test" },
  outcome: { type: "monthly_quota_exceeded" },
};

export async function mounts(element: string, action: CheckoutPaymentAction, setup: PaymentMethodSetupStart): Promise<void> {
  const mount = await mountCheckoutAction({ action, element });
  if (mount?.type === "simulator") mount.destroy();
  const card = await mountPaymentMethodSetup({ setup, element });
  const answer = await card.confirm({ return_url: "http://localhost:4173/account" });
  void answer.setup_intent_id;
}
