import type { AccountActor, Currency, EmailContact, ProviderEffectError } from "./common";
import type { EpochMilliseconds } from "./time";
import type { FeatureType, Store } from "./store";
import type { NetworkStoreAddresses } from "./notification";
import type { StripeSecretKeyKind } from "./storeProvider";
import type { AccountName } from "./account";
import type { StorePermissionAccess } from "./storeRole";

export interface Network {
  id: string;
  name: string;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type NetworkProviderStatus = "active" | "disabled";

export type NetworkElevenLabsRegion = "global" | "us" | "eu" | "in" | "sg";

export type NetworkElevenLabsSetup =
  | { type: "waiting" }
  | { type: "ready"; agent_id: string; tool_ids: string[]; at: EpochMilliseconds }
  | { type: "failed"; error: ProviderEffectError; at: EpochMilliseconds };

export type NetworkProviderType =
  | {
      type: "resend";
      webhook_id: string;
      from_name: string;
      from_address: string;
      sign_in_subject: string;
      sign_in_body: string;
      store_addresses: NetworkStoreAddresses;
    }
  | { type: "stripe"; account_id: string; publishable_key: string; secret_key: StripeSecretKeyKind }
  | { type: "twilio"; account_sid: string }
  | { type: "open_ai"; project_id: string }
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
export type PlanPriceUnit = "store" | "staff_calendar";
export type NetworkPlanPrice =
  | { type: "free" }
  | { type: "lifetime"; amount: number; currency: Currency }
  | { type: "monthly"; amount: number; currency: Currency; months: number; per: PlanPriceUnit; trial_days: number | null }
  | { type: "yearly"; amount: number; currency: Currency; years: number; per: PlanPriceUnit; trial_days: number | null };

export interface NetworkPlan {
  id: string;
  network_id: string;
  name: string;
  tier: number;
  price: NetworkPlanPrice;
  features: PlanFeatures;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface FindNetworksParams { limit?: number; cursor?: string | null }
export interface GetNetworkParams { id: string }
export interface CreateNetworkParams { id: string; name: string }
export interface UpdateNetworkParams {
  id: string;
  expected_updated_at: EpochMilliseconds;
  name?: string;
}
export interface DeleteNetworkParams { id: string; expected_updated_at: EpochMilliseconds }
export interface FindNetworkPlansParams extends FindNetworksParams { network_id: string }
export interface CreateNetworkPlanParams {
  id: string;
  network_id: string;
  name: string;
  tier: number;
  price: NetworkPlanPrice;
  features: PlanFeatures;
}
export interface UpdateNetworkPlanParams {
  id: string;
  network_id: string;
  expected_updated_at: EpochMilliseconds;
  name?: string;
  tier?: number;
  price?: NetworkPlanPrice;
  features?: PlanFeatures;
}
export interface DeleteNetworkPlanParams extends DeleteNetworkParams { network_id: string }
export interface FindNetworkStoresParams extends FindNetworksParams { network_id: string }

export interface GetNetworkStoreParams { network_id: string; store_id: string }

export interface NetworkStoreCounts {
  staff_calendars: number;
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
  store_addresses: NetworkStoreAddresses;
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

export type NetworkPermission =
  | { type: "admin" }
  | { type: "stores"; access: StorePermissionAccess }
  | { type: "plans"; access: StorePermissionAccess }
  | { type: "logins" }
  | { type: "support" };

export type NetworkPermissionType = NetworkPermission["type"];

export interface NetworkRole {
  id: string;
  network_id: string;
  key: string;
  permissions: NetworkPermission[];
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface NetworkAccess {
  permissions: NetworkPermission[];
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
  permissions: NetworkPermission[];
}
export interface UpdateNetworkRoleParams {
  network_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  key: string;
  permissions: NetworkPermission[];
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
