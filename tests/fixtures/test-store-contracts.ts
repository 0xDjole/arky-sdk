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
  ConnectArkyElevenLabsStoreProviderParams,
  ConnectArkyMonriStoreProviderParams,
  ConnectArkyResendStoreProviderParams,
  ConnectArkyStripeStoreProviderParams,
  ConnectArkyTwilioStoreProviderParams,
  ConnectElevenLabsStoreProviderParams,
  ElevenLabsRegion,
  ElevenLabsSetup,
  CreateCardPaymentOptionParams,
  CreateSimulatorPlannedOutcomeParams,
  CreateStoreParams,
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
  SetUpStoreElevenLabsAgainParams,
  SimulatorPaymentControlParams,
  SetSimulatedCallStatusParams,
  FindSimulatedCallConversationsParams,
  FinishSimulatedCallConversationParams,
  SimulateToolCallParams,
  SimulatedAssistantTool,
  SimulatedCall,
  SimulatedCallConversation,
  SimulatedCallStatus,
  SimulatedToolCall,
  SimulatedEmail,
  SimulatorMonriOperation,
  SimulatorPlannedOperation,
  SimulatorPlannedOutcome,
  SimulatorPlannedResult,
  SimulatorProvider,
  SimulatorResendOperation,
  SimulatorStripeOperation,
  SmsSender,
  StartSimulatedCallParams,
  Store,
  StoreMembershipWithStoreName,
  StoreProvider,
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
type Providers = Admin["store"]["provider"];
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

  Assert<Missing<PaymentOptions, "arkyStripe" | "arkyMonri">>,
  Assert<Equal<Parameters<Providers["connectArkyStripe"]>[0], ConnectArkyStripeStoreProviderParams>>,
  Assert<Equal<Parameters<Providers["connectArkyMonri"]>[0], ConnectArkyMonriStoreProviderParams>>,
  Assert<Equal<ConnectArkyStripeStoreProviderParams, { store_id: string; id: string }>>,
  Assert<Equal<ConnectArkyMonriStoreProviderParams, { store_id: string; id: string }>>,
  Assert<Equal<Awaited<ReturnType<Providers["connectArkyStripe"]>>, StoreProvider>>,
  Assert<Equal<Awaited<ReturnType<Providers["connectArkyMonri"]>>, StoreProvider>>,
  Assert<Equal<Parameters<PaymentOptions["createArkyStripe"]>[0], CreateCardPaymentOptionParams>>,
  Assert<Equal<Parameters<PaymentOptions["createArkyMonri"]>[0], CreateCardPaymentOptionParams>>,
  Assert<Equal<keyof CreateCardPaymentOptionParams, "store_id" | "provider_id" | "id" | "key" | "blocks" | "status" | "saved_card_terms">>,
  Assert<Equal<CreateCardPaymentOptionParams["saved_card_terms"], LocalizedMarkdown>>,
  Assert<Equal<Awaited<ReturnType<PaymentOptions["createArkyStripe"]>>, PaymentOption>>,
  Assert<Equal<Awaited<ReturnType<PaymentOptions["createArkyMonri"]>>, PaymentOption>>,

  Assert<Equal<Extract<StoreProvider["type"], { type: "arky_resend" }>, { type: "arky_resend" }>>,
  Assert<Equal<Extract<StoreProvider["type"], { type: "resend" }>["webhook_id"], string>>,
  Assert<Equal<Parameters<Providers["connectArkyResend"]>[0], ConnectArkyResendStoreProviderParams>>,
  Assert<Equal<ConnectArkyResendStoreProviderParams, { store_id: string; id: string; domains: string[] }>>,
  Assert<Equal<Awaited<ReturnType<Providers["connectArkyResend"]>>, StoreProvider>>,

  Assert<Equal<Extract<StoreProvider["type"], { type: "arky_twilio" }>, { type: "arky_twilio"; account_sid: string; sms_sender: SmsSender }>>,
  Assert<Equal<Extract<StoreProvider["type"], { type: "eleven_labs" }>, { type: "eleven_labs"; region: ElevenLabsRegion; setup: ElevenLabsSetup }>>,
  Assert<Equal<Extract<StoreProvider["type"], { type: "arky_eleven_labs" }>, { type: "arky_eleven_labs"; region: ElevenLabsRegion; setup: ElevenLabsSetup }>>,
  Assert<Equal<ElevenLabsRegion, "global" | "us" | "eu" | "in" | "sg">>,
  Assert<Equal<ElevenLabsSetup["type"], "waiting" | "ready" | "failed">>,
  Assert<Equal<Parameters<Providers["connectArkyTwilio"]>[0], ConnectArkyTwilioStoreProviderParams>>,
  Assert<Equal<ConnectArkyTwilioStoreProviderParams, { store_id: string; id: string; sms_sender: SmsSender }>>,
  Assert<Equal<Parameters<Providers["connectElevenLabs"]>[0], ConnectElevenLabsStoreProviderParams>>,
  Assert<Equal<ConnectElevenLabsStoreProviderParams, { store_id: string; id: string; api_key: string; region: ElevenLabsRegion }>>,
  Assert<Equal<Parameters<Providers["connectArkyElevenLabs"]>[0], ConnectArkyElevenLabsStoreProviderParams>>,
  Assert<Equal<ConnectArkyElevenLabsStoreProviderParams, { store_id: string; id: string }>>,
  Assert<Equal<Parameters<Providers["setUpElevenLabsAgain"]>[0], SetUpStoreElevenLabsAgainParams>>,
  Assert<Equal<SetUpStoreElevenLabsAgainParams, { store_id: string; id: string; expected_updated_at: EpochMilliseconds }>>,
  Assert<Equal<Awaited<ReturnType<Providers["connectArkyTwilio"]>>, StoreProvider>>,
  Assert<Equal<Awaited<ReturnType<Providers["connectElevenLabs"]>>, StoreProvider>>,
  Assert<Equal<Awaited<ReturnType<Providers["connectArkyElevenLabs"]>>, StoreProvider>>,
  Assert<Equal<Awaited<ReturnType<Providers["setUpElevenLabsAgain"]>>, StoreProvider>>,

  Assert<Equal<keyof Simulator, "payments" | "emails" | "sms" | "calls" | "plannedOutcomes">>,
  Assert<Equal<keyof Simulator["sms"], "find">>,
  Assert<Equal<keyof Simulator["calls"], "start" | "setStatus" | "findConversations" | "callTool" | "finishConversation">>,
  Assert<Equal<Parameters<Simulator["calls"]["start"]>[0], StartSimulatedCallParams>>,
  Assert<Equal<StartSimulatedCallParams, { store_id: string; to: string; from: string | null }>>,
  Assert<Equal<Awaited<ReturnType<Simulator["calls"]["start"]>>, SimulatedCall>>,
  Assert<Equal<SimulatedCall, { id: string; from: string | null; to: string; status: SimulatedCallStatus; created_at: EpochMilliseconds }>>,
  Assert<Equal<SimulatedCallStatus, "ringing" | "in-progress" | "completed" | "busy" | "no-answer" | "failed" | "canceled">>,
  Assert<Equal<Parameters<Simulator["calls"]["setStatus"]>[0], SetSimulatedCallStatusParams>>,
  Assert<Equal<SetSimulatedCallStatusParams, { store_id: string; call_sid: string; status: SimulatedCallStatus; duration_seconds: number | null }>>,
  Assert<Equal<Awaited<ReturnType<Simulator["calls"]["setStatus"]>>, SimulatedCall>>,
  Assert<Equal<Parameters<Simulator["calls"]["findConversations"]>[0], FindSimulatedCallConversationsParams>>,
  Assert<Equal<keyof FindSimulatedCallConversationsParams, "store_id" | "call_id" | "limit" | "cursor">>,
  Assert<Equal<Awaited<ReturnType<Simulator["calls"]["findConversations"]>>, PaginatedResponse<SimulatedCallConversation>>>,
  Assert<Equal<keyof SimulatedCallConversation, "id" | "call_id" | "from" | "to" | "status" | "created_at">>,
  Assert<Equal<SimulatedCallConversation["status"], "in-progress" | "done" | "deleted">>,
  Assert<Equal<Parameters<Simulator["calls"]["callTool"]>[0], SimulateToolCallParams>>,
  Assert<Equal<keyof SimulateToolCallParams, "store_id" | "conversation_id" | "tool" | "parameters" | "said">>,
  Assert<Equal<SimulatedAssistantTool, "find-slots" | "propose" | "confirm" | "request-callback" | "transfer" | "record-sms-consent">>,
  Assert<Equal<Awaited<ReturnType<Simulator["calls"]["callTool"]>>, SimulatedToolCall>>,
  Assert<Equal<SimulatedToolCall, { tool: SimulatedAssistantTool; answered: number | null; answer: unknown }>>,
  Assert<Equal<Parameters<Simulator["calls"]["finishConversation"]>[0], FinishSimulatedCallConversationParams>>,
  Assert<Equal<FinishSimulatedCallConversationParams["transcript"][number]["role"], "agent" | "user">>,
  Assert<Equal<Awaited<ReturnType<Simulator["calls"]["finishConversation"]>>, SimulatedCallConversation>>,
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
