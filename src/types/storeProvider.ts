import type { EpochMilliseconds } from "./time";
import type { ProviderEffectError } from "./common";
import type { MonriEnvironment, StripeWebhook } from "./payment";

export type StoreProviderStatus = "active" | "disabled";

export type SmsSender = { type: "name"; name: string } | { type: "number"; number: string };

export type StripeSecretKeyKind = "standard" | "restricted";

export interface StoreStripeLogin {
  account_id: string;
  livemode: boolean;
  publishable_key: string;
  secret_key: StripeSecretKeyKind;
  charges_enabled: boolean;
  account_checked_at: EpochMilliseconds;
  webhook: StripeWebhook;
}

export type ElevenLabsRegion = "global" | "us" | "eu" | "in" | "sg";

export type ElevenLabsSetup =
  | { type: "waiting" }
  | { type: "ready"; agent_id: string; tool_ids: string[]; at: EpochMilliseconds }
  | { type: "failed"; error: ProviderEffectError; at: EpochMilliseconds };

export type StoreProviderType =
  | { type: "resend"; webhook_id: string }
  | ({ type: "stripe" } & StoreStripeLogin)
  | { type: "monri"; environment: MonriEnvironment }
  | { type: "arky_resend" }
  | ({ type: "arky_stripe" } & StoreStripeLogin)
  | { type: "arky_monri"; environment: MonriEnvironment }
  | { type: "twilio"; account_sid: string; sms_sender: SmsSender }
  | { type: "arky_twilio"; account_sid: string; sms_sender: SmsSender }
  | { type: "network_twilio"; network_provider_id: string; sms_sender: SmsSender }
  | { type: "eleven_labs"; region: ElevenLabsRegion; setup: ElevenLabsSetup }
  | { type: "arky_eleven_labs"; region: ElevenLabsRegion; setup: ElevenLabsSetup };

export interface StoreProvider {
  id: string;
  store_id: string;
  type: StoreProviderType;
  status: StoreProviderStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type StoreProviderTypeName = StoreProviderType["type"];

export interface StoreProviderLogin {
  id: string;
  type: StoreProviderTypeName;
  status: StoreProviderStatus;
}

export type StoreNetworkLoginType = "resend" | "twilio" | "eleven_labs";

export type StoreNetworkLoginStatus = "active" | "disabled";

export interface StoreNetworkLogin {
  id: string;
  type: StoreNetworkLoginType;
  status: StoreNetworkLoginStatus;
}

export interface FindStoreProviderLoginsParams {
  store_id: string;
  limit?: number;
  cursor?: string | null;
}

export interface FindStoreNetworkLoginsParams {
  store_id: string;
}

export type ResendSetupProblem =
  | { type: "webhook_missing" }
  | { type: "webhook_duplicated"; webhook_ids: string[] }
  | { type: "webhook_secret_mismatch" }
  | { type: "webhook_disabled" }
  | { type: "webhook_events_missing"; events: string[] };

export interface ResendSetup {
  webhook_address: string;
  events: string[];
  webhook_id: string | null;
  problems: ResendSetupProblem[];
}

export type ResendDomainStatus =
  | "not_started"
  | "pending"
  | "verified"
  | "partially_verified"
  | "partially_failed"
  | "failed"
  | "temporary_failure"
  | "unknown";

export interface ResendDnsRecord {
  record: string;
  status: string;
  type: string;
  name: string;
  value: string;
  priority: number | null;
}

export interface ResendDomain {
  id: string;
  name: string;
  status: ResendDomainStatus;
  records: ResendDnsRecord[];
  sending_enabled: boolean;
  receiving_enabled: boolean;
}

export interface FindStoreProvidersParams {
  store_id: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetStoreProviderParams {
  store_id: string;
  id: string;
}

export interface SetStoreProviderStatusParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  status: StoreProviderStatus;
}

export interface DeleteStoreProviderParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface ConnectResendStoreProviderParams {
  store_id: string;
  id: string;
  api_key: string;
  webhook_secret: string;
}

export interface ConnectArkyResendStoreProviderParams {
  store_id: string;
  id: string;
  domains: string[];
}

export interface ReplaceResendKeyParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  api_key: string;
  webhook_secret: string;
}

export interface ConnectTwilioStoreProviderParams {
  store_id: string;
  id: string;
  account_sid: string;
  auth_token: string;
  sms_sender: SmsSender;
}

export interface ConnectNetworkTwilioStoreProviderParams {
  store_id: string;
  id: string;
  sms_sender: SmsSender;
}

export interface ConnectArkyTwilioStoreProviderParams {
  store_id: string;
  id: string;
  sms_sender: SmsSender;
}

export interface ConnectElevenLabsStoreProviderParams {
  store_id: string;
  id: string;
  api_key: string;
  region: ElevenLabsRegion;
}

export interface ConnectArkyElevenLabsStoreProviderParams {
  store_id: string;
  id: string;
}

export interface SetUpStoreElevenLabsAgainParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface ReplaceTwilioAuthTokenParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  auth_token: string;
}

export interface SetStoreSmsSenderParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  sms_sender: SmsSender;
}

export interface ConnectStripeStoreProviderParams {
  store_id: string;
  id: string;
  restricted_key: string;
  publishable_key: string;
}

export interface ConnectMonriStoreProviderParams {
  store_id: string;
  id: string;
  environment: MonriEnvironment;
  merchant_key: string;
  authenticity_token: string;
}

export interface ConnectArkyStripeStoreProviderParams {
  store_id: string;
  id: string;
}

export interface ConnectArkyMonriStoreProviderParams {
  store_id: string;
  id: string;
}

export interface ReplaceStripeKeysParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  restricted_key: string;
  publishable_key: string;
}

export interface SaveStripeWebhookSecretParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  signing_secret: string;
  previous_secret_expires_at: EpochMilliseconds | null;
}

export interface RefreshStripeStoreProviderParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface CheckStripeSetupParams {
  store_id: string;
  id: string;
}

export interface ReplaceMonriMerchantKeyParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  merchant_key: string;
}

export interface FindResendDomainsParams {
  store_id: string;
  id: string;
}

export interface CheckResendSetupParams {
  store_id: string;
  id: string;
}
