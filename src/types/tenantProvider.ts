import type { EpochMilliseconds } from "./time";
import type { ProviderEffectError } from "./common";
import type { MonriEnvironment, StripeWebhook } from "./payment";
import type { AssistantTool } from "./support";

export type TenantProviderStatus = "active" | "disabled";

export type SmsSender = { type: "name"; name: string } | { type: "number"; number: string };

export type NetworkTwilioSmsSender = { type: "name"; name: string } | { type: "line"; phone_number_id: string };

export type TenantSmsSender =
  | { type: "name"; name: string }
  | { type: "number"; number: string }
  | { type: "line"; phone_number_id: string };

export type StripeSecretKeyType = "standard" | "restricted";

export interface TenantStripeLogin {
  account_id: string;
  livemode: boolean;
  publishable_key: string;
  secret_key: StripeSecretKeyType;
  charges_enabled: boolean;
  account_checked_at: EpochMilliseconds;
  webhook: StripeWebhook;
}

export type ElevenLabsRegion = "global" | "us" | "eu" | "in" | "sg";

export interface ElevenLabsTools {
  confirm: string;
  transfer: string;
  request_callback: string;
  optional: Partial<Record<AssistantTool, string>>;
}

export type ElevenLabsSetup =
  | { type: "waiting" }
  | { type: "ready"; agent_id: string; tools: ElevenLabsTools; at: EpochMilliseconds }
  | { type: "failed"; error: ProviderEffectError; at: EpochMilliseconds };

export interface ArkyElevenLabsTools {
  confirm: string;
  transfer: string;
  request_callback: string;
  optional: Partial<Record<AssistantTool, string>>;
}

export type ArkyElevenLabsSetup =
  | { type: "waiting" }
  | { type: "ready"; agent_id: string; tools: ArkyElevenLabsTools; at: EpochMilliseconds }
  | { type: "failed"; error: ProviderEffectError; at: EpochMilliseconds };

export type CroatiaCertificate =
  | { type: "readable"; oib: string; expires_at: EpochMilliseconds }
  | { type: "unreadable" };

export type TenantProviderType =
  | { type: "resend"; webhook_id: string }
  | ({ type: "stripe" } & TenantStripeLogin)
  | { type: "monri"; environment: MonriEnvironment }
  | { type: "arky_resend" }
  | ({ type: "arky_stripe" } & TenantStripeLogin)
  | { type: "arky_monri"; environment: MonriEnvironment }
  | { type: "twilio"; account_sid: string; sms_sender: SmsSender }
  | { type: "arky_twilio"; account_sid: string; sms_sender: SmsSender }
  | { type: "network_twilio"; network_provider_id: string; sms_sender: NetworkTwilioSmsSender }
  | { type: "eleven_labs"; region: ElevenLabsRegion; setup: ElevenLabsSetup }
  | { type: "arky_eleven_labs"; setup: ArkyElevenLabsSetup }
  | { type: "croatia_cis"; certificate: CroatiaCertificate }
  | { type: "arky_croatia_cis"; certificate: CroatiaCertificate }
  | { type: "ofs_cloud" }
  | { type: "arky_ofs_cloud" };

export interface TenantProvider {
  id: string;
  tenant_id: string;
  type: TenantProviderType;
  status: TenantProviderStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type TenantProviderTypeName = TenantProviderType["type"];

export interface TenantProviderLogin {
  id: string;
  type: TenantProviderTypeName;
  status: TenantProviderStatus;
}

export type TenantNetworkLoginType = "resend" | "twilio" | "eleven_labs";

export type TenantNetworkLoginStatus = "active" | "disabled";

export interface TenantNetworkLogin {
  id: string;
  type: TenantNetworkLoginType;
  status: TenantNetworkLoginStatus;
}

export interface FindTenantProviderLoginsParams {
  tenant_id: string;
  limit?: number;
  cursor?: string | null;
}

export interface FindTenantNetworkLoginsParams {
  tenant_id: string;
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

export interface FindTenantProvidersParams {
  tenant_id: string;
  limit?: number;
  cursor?: string | null;
}

export interface GetTenantProviderParams {
  tenant_id: string;
  id: string;
}

export interface SetTenantProviderStatusParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  status: TenantProviderStatus;
}

export interface DeleteTenantProviderParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface ConnectResendTenantProviderParams {
  tenant_id: string;
  id: string;
  api_key: string;
  webhook_secret: string;
}

export interface ConnectArkyResendTenantProviderParams {
  tenant_id: string;
  id: string;
  domains: string[];
}

export interface ReplaceResendKeyParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  api_key: string;
  webhook_secret: string;
}

export interface ConnectTwilioTenantProviderParams {
  tenant_id: string;
  id: string;
  account_sid: string;
  auth_token: string;
  sms_sender: SmsSender;
}

export interface ConnectNetworkTwilioTenantProviderParams {
  tenant_id: string;
  id: string;
  sms_sender: NetworkTwilioSmsSender;
}

export interface ConnectArkyTwilioTenantProviderParams {
  tenant_id: string;
  id: string;
  sms_sender: SmsSender;
}

export interface ConnectElevenLabsTenantProviderParams {
  tenant_id: string;
  id: string;
  api_key: string;
  region: ElevenLabsRegion;
}

export interface ConnectArkyElevenLabsTenantProviderParams {
  tenant_id: string;
  id: string;
}

export interface SetUpTenantElevenLabsAgainParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface ReplaceTwilioAuthTokenParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  auth_token: string;
}

export interface SetTenantSmsSenderParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  sms_sender: TenantSmsSender;
}

export interface ConnectStripeTenantProviderParams {
  tenant_id: string;
  id: string;
  restricted_key: string;
  publishable_key: string;
}

export interface ConnectMonriTenantProviderParams {
  tenant_id: string;
  id: string;
  environment: MonriEnvironment;
  merchant_key: string;
  authenticity_token: string;
}

export interface ConnectArkyStripeTenantProviderParams {
  tenant_id: string;
  id: string;
}

export interface ConnectArkyMonriTenantProviderParams {
  tenant_id: string;
  id: string;
}

export interface ReplaceStripeKeysParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  restricted_key: string;
  publishable_key: string;
}

export interface SaveStripeWebhookSecretParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  signing_secret: string;
  previous_secret_expires_at: EpochMilliseconds | null;
}

export interface RefreshStripeTenantProviderParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface CheckStripeSetupParams {
  tenant_id: string;
  id: string;
}

export interface ReplaceMonriMerchantKeyParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  merchant_key: string;
}

export interface ConnectCroatiaCisTenantProviderParams {
  tenant_id: string;
  id: string;
  certificate_p12: string;
  password: string;
}

export interface ReplaceCroatiaCisCertificateParams {
  tenant_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  certificate_p12: string;
  password: string;
}

export interface ConnectArkyCroatiaCisTenantProviderParams {
  tenant_id: string;
  id: string;
}

export interface ConnectOfsCloudTenantProviderParams {
  tenant_id: string;
  id: string;
  api_key: string;
}

export interface ConnectArkyOfsCloudTenantProviderParams {
  tenant_id: string;
  id: string;
}

export interface FindResendDomainsParams {
  tenant_id: string;
  id: string;
}

export interface CheckResendSetupParams {
  tenant_id: string;
  id: string;
}
