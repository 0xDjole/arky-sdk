import type { EpochMilliseconds } from "./time";
import type { LoginAddress, LoginContact } from "./account";
import type { UserSessionIssued, StorefrontUser } from "./user";

export type NetworkSignInReach = { type: "network" } | { type: "tenant"; tenant_id: string };

export interface PendingNetworkUserSignIn {
  session_id: string;
  code_expires_at: EpochMilliseconds;
}

export interface NetworkUserAuthToken {
  id: string;
  access_token: string;
  refresh_token: string;
  access_expires_at: EpochMilliseconds;
  refresh_expires_at: EpochMilliseconds;
  authenticated_at: EpochMilliseconds;
  reach: NetworkSignInReach;
}

export type NetworkUserLogin =
  | { type: "user_email"; email: string; language: string; since: EpochMilliseconds }
  | { type: "user_phone"; number: string; language: string; since: EpochMilliseconds };

export interface NetworkUserSession {
  id: string;
  reach: NetworkSignInReach;
  signed_in_with: LoginAddress;
  authenticated_at: EpochMilliseconds;
  access_expires_at: EpochMilliseconds;
  refresh_expires_at: EpochMilliseconds;
}

export interface NetworkUserMe {
  account_id: string;
  logins: NetworkUserLogin[];
  session: NetworkUserSession;
}

export interface LinkedTenant {
  tenant_id: string;
  name: string;
}

export interface NetworkUserTenantKey {
  user: StorefrontUser;
  session: UserSessionIssued;
}

export interface NetworkUserSignedIn {
  id: string;
  reach: NetworkSignInReach;
}

export interface NetworkUserStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface NetworkUserConfig {
  apiUrl: string;
  networkId: string;
  sessionStorage?: NetworkUserStorage;
}

export type NetworkUserLogoutResult =
  | { type: "ended"; session_id: string }
  | { type: "unconfirmed"; session_id: string }
  | { type: "local_only" };

export interface NetworkUserLinkRemoved {
  removed: true;
}

export interface NetworkUserAccountDeleted {
  deleted: true;
}

export interface RequestNetworkUserCodeParams {
  session_id: string;
  reach: NetworkSignInReach;
  contact: LoginContact;
}

export interface VerifyNetworkUserCodeParams {
  session_id: string;
  code: string;
}

export interface RequestNetworkUserLoginCodeParams {
  contact: LoginContact;
}

export interface VerifyNetworkUserLoginParams {
  address: LoginAddress;
  code: string;
  confirm_join: boolean;
}

export interface RemoveNetworkUserLoginParams {
  address: LoginAddress;
}

export interface FindLinkedTenantsParams {
  limit?: number;
  cursor?: string | null;
}

export interface OpenNetworkUserTenantKeyParams {
  tenant_id: string;
  id: string;
  visitor_token: string | null;
}

export interface AcceptNetworkUserInviteParams {
  tenant_id: string;
  id: string;
  code: string;
  sent_to: LoginAddress;
}

export interface RemoveNetworkUserTenantLinkParams {
  tenant_id: string;
}
