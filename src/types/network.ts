import type { AccountActor, Currency, EmailContact, ProviderEffectError } from "./common";
import type { Days, EpochMilliseconds } from "./time";
import type { FeatureType, Store } from "./store";
import type { NetworkStoreAddresses } from "./notification";
import type { StripeSecretKeyType } from "./storeProvider";
import type { AccountName } from "./account";
import type { NetworkPermissionType, NetworkRolePermission } from "./permission";
import type { AssistantTool } from "./support";

export type NetworkType = { type: "isolated" } | { type: "connected" };

export type NetworkStatus = { type: "active" } | { type: "deleting" };

export interface Network {
  id: string;
  name: string;
  type: NetworkType;
  status: NetworkStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface NetworkCustomerEmailText {
  language: string;
  code_subject: string;
  code_body: string;
  invite_subject: string;
  invite_body: string;
  login_changed_subject: string;
  login_changed_body: string;
}

export type NetworkCustomerEmailTexts =
  | { type: "off" }
  | { type: "on"; texts: NetworkCustomerEmailText[] };

export interface NetworkCustomerSmsText {
  language: string;
  code_body: string;
  invite_body: string;
  login_changed_body: string;
}

export type NetworkCustomerSmsTexts =
  | { type: "off" }
  | { type: "on"; sender_name: string; texts: NetworkCustomerSmsText[] };

export type NetworkProviderStatus = "active" | "disabled";

export type NetworkElevenLabsRegion = "global" | "us" | "eu" | "in" | "sg";

export interface NetworkElevenLabsTools {
  confirm: string;
  transfer: string;
  request_callback: string;
  optional: Partial<Record<AssistantTool, string>>;
}

export type NetworkElevenLabsSetup =
  | { type: "waiting" }
  | { type: "ready"; agent_id: string; tools: NetworkElevenLabsTools; at: EpochMilliseconds }
  | { type: "failed"; error: ProviderEffectError; at: EpochMilliseconds };

export type NetworkProviderType =
  | {
      type: "resend";
      webhook_id: string;
      from_name: string;
      from_address: string;
      sign_in_subject: string;
      sign_in_body: string;
      member_login_changed_subject: string;
      member_login_changed_body: string;
      store_addresses: NetworkStoreAddresses;
      customer_texts: NetworkCustomerEmailTexts;
    }
  | { type: "stripe"; account_id: string; publishable_key: string; secret_key: StripeSecretKeyType }
  | { type: "twilio"; account_sid: string; customer_texts: NetworkCustomerSmsTexts }
  | { type: "eleven_labs"; region: NetworkElevenLabsRegion; setup: NetworkElevenLabsSetup };

export interface NetworkProvider {
  id: string;
  network_id: string;
  type: NetworkProviderType;
  status: NetworkProviderStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type PlanLimit = { type: "unlimited" } | { type: "max"; count: number };
export type PlanFeatures = Record<FeatureType, PlanLimit>;
export type PlanTrial = { type: "none" } | { type: "days"; period: Days };
export type NetworkPlanPublicPrice =
  | { type: "free" }
  | { type: "lifetime"; amount: number; currency: Currency }
  | { type: "monthly"; amount: number; currency: Currency; months: number; trial: PlanTrial }
  | { type: "yearly"; amount: number; currency: Currency; years: number; trial: PlanTrial };
export type NetworkPlanNetworkPrice =
  | { type: "free" }
  | { type: "outside" }
  | { type: "lifetime"; amount: number; currency: Currency }
  | { type: "monthly"; amount: number; currency: Currency; months: number; trial: PlanTrial }
  | { type: "yearly"; amount: number; currency: Currency; years: number; trial: PlanTrial };
export type NetworkPlanAccess =
  | { type: "public"; price: NetworkPlanPublicPrice }
  | { type: "network_only"; price: NetworkPlanNetworkPrice };

export interface NetworkPlan {
  id: string;
  network_id: string;
  name: string;
  tier: number;
  access: NetworkPlanAccess;
  features: PlanFeatures;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface FindNetworksParams { limit?: number; cursor?: string | null }
export interface GetNetworkParams { id: string }
export interface CreateNetworkParams { id: string; name: string; type: NetworkType }
export interface UpdateNetworkParams {
  id: string;
  expected_updated_at: EpochMilliseconds;
  name?: string;
  type?: NetworkType;
}
export interface DeleteNetworkParams { id: string; expected_updated_at: EpochMilliseconds }
export interface FindNetworkPlansParams extends FindNetworksParams { network_id: string }
export interface CreateNetworkPlanParams {
  id: string;
  network_id: string;
  name: string;
  tier: number;
  access: NetworkPlanAccess;
  features: PlanFeatures;
}
export interface UpdateNetworkPlanParams {
  id: string;
  network_id: string;
  expected_updated_at: EpochMilliseconds;
  name?: string;
  tier?: number;
  access?: NetworkPlanAccess;
  features?: PlanFeatures;
}
export interface DeleteNetworkPlanParams extends DeleteNetworkParams { network_id: string }
export interface FindNetworkStoresParams extends FindNetworksParams { network_id: string }

export interface GetNetworkStoreParams { network_id: string; store_id: string }

export interface NameNetworkStoreOwnerParams {
  network_id: string;
  store_id: string;
  email: string;
  language: string;
  expected_updated_at: EpochMilliseconds;
}

export interface NetworkStoreCounts {
  members: number;
  customers: number;
}

export interface NetworkStore extends Store {
  owner_email: string;
  city: string | null;
  counts: NetworkStoreCounts;
}

export interface FindNetworkProvidersParams { network_id: string; limit?: number; cursor?: string | null }
export interface GetNetworkProviderParams { network_id: string; id: string }
export interface SetNetworkProviderStatusParams {
  network_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  status: NetworkProviderStatus;
}
export interface DeleteNetworkProviderParams {
  network_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}
export interface ConnectNetworkResendParams {
  network_id: string;
  id: string;
  api_key: string;
  from_name: string;
  from_address: string;
  sign_in_subject: string;
  sign_in_body: string;
  member_login_changed_subject: string;
  member_login_changed_body: string;
  store_addresses: NetworkStoreAddresses;
  customer_texts: NetworkCustomerEmailTexts;
}
export interface ReplaceNetworkEmailCustomerTextsParams {
  network_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  customer_texts: NetworkCustomerEmailTexts;
}
export interface ReplaceNetworkSmsCustomerTextsParams {
  network_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  customer_texts: NetworkCustomerSmsTexts;
}
export interface ReplaceNetworkResendKeyParams {
  network_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  api_key: string;
}
export interface UpdateNetworkResendParams {
  network_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  from_name: string;
  from_address: string;
  sign_in_subject: string;
  sign_in_body: string;
  store_addresses: NetworkStoreAddresses;
}
export interface ConnectNetworkStripeParams {
  network_id: string;
  id: string;
  publishable_key: string;
  secret_key: string;
  webhook_secret: string;
}
export interface ReplaceNetworkStripeKeysParams {
  network_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  publishable_key: string;
  secret_key: string;
  webhook_secret: string;
}
export interface ConnectNetworkTwilioParams {
  network_id: string;
  id: string;
  account_sid: string;
  auth_token: string;
  customer_texts: NetworkCustomerSmsTexts;
}
export interface ReplaceNetworkTwilioAuthTokenParams {
  network_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  auth_token: string;
}
export interface ConnectNetworkElevenLabsParams {
  network_id: string;
  id: string;
  api_key: string;
  region: NetworkElevenLabsRegion;
}
export interface SetUpNetworkElevenLabsAgainParams {
  network_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface NetworkRole {
  id: string;
  network_id: string;
  key: string;
  permissions: NetworkRolePermission[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface NetworkAccess {
  permissions: NetworkPermissionType[];
}

export type NetworkMembershipStatus =
  | { type: "invited"; contact: EmailContact }
  | { type: "active"; account_id: string }
  | { type: "disabled"; account_id: string };

export type NetworkMembershipEditableStatus = { type: "active" } | { type: "disabled" };

export interface NetworkMembership {
  id: string;
  network_id: string;
  role_ids: string[];
  status: NetworkMembershipStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface OwnNetworkMembership extends NetworkMembership {
  access: NetworkAccess;
}

export type NetworkMemberSecondFactor = "on" | "off";

export interface NetworkMemberAccount {
  id: string;
  email: string;
  name: AccountName | null;
  phone: string | null;
  second_factor: NetworkMemberSecondFactor;
}

export interface NetworkMember {
  account: NetworkMemberAccount | null;
  membership: NetworkMembership;
}

export interface StoreAgreement {
  id: string;
  network_id: string;
  store_id: string;
  document: string;
  accepted_by: AccountActor;
  accepted_at: EpochMilliseconds;
}

export interface CreateStoreAgreementInput {
  id: string;
  document: string;
}

export interface FindNetworkRolesParams { network_id: string; limit?: number; cursor?: string | null }
export interface GetNetworkRoleParams { network_id: string; id: string }
export interface CreateNetworkRoleParams {
  network_id: string;
  id: string;
  key: string;
  permissions: NetworkPermissionType[];
}
export interface UpdateNetworkRoleParams {
  network_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key: string;
  permissions: NetworkPermissionType[];
}
export interface DeleteNetworkRoleParams { network_id: string; id: string; expected_updated_at: EpochMilliseconds }

export interface FindNetworkMembersParams { network_id: string; limit?: number; cursor?: string | null }
export interface InviteNetworkMemberParams {
  network_id: string;
  id: string;
  contact: EmailContact;
  role_ids: string[];
}
export interface UpdateNetworkMemberRolesParams {
  network_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  role_ids: string[];
}
export interface ChangeNetworkMemberStatusParams {
  network_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  status: NetworkMembershipEditableStatus;
}
export interface RemoveNetworkMemberParams { network_id: string; id: string; expected_updated_at: EpochMilliseconds }
export interface GetOwnNetworkMembershipParams { network_id: string }
export interface ResetNetworkMemberSecondFactorParams { network_id: string; id: string }
export interface AcceptNetworkInviteParams { network_id: string; expected_updated_at: EpochMilliseconds }
export interface GetNetworkStoreAgreementParams { network_id: string; store_id: string }
export interface FindNetworkStoreSubscriptionsParams { network_id: string; ids: string[] }
