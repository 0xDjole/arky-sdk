import type { EpochMilliseconds } from "./time";
import type { LoginAddress, LoginContact } from "./account";
import type { CustomerSessionIssued, StorefrontCustomer } from "./customer";

export type NetworkSignInReach = { type: "network" } | { type: "store"; store_id: string };

export interface PendingNetworkCustomerSignIn {
  session_id: string;
  code_expires_at: EpochMilliseconds;
}

export interface NetworkCustomerAuthToken {
  id: string;
  access_token: string;
  refresh_token: string;
  access_expires_at: EpochMilliseconds;
  refresh_expires_at: EpochMilliseconds;
  authenticated_at: EpochMilliseconds;
  reach: NetworkSignInReach;
}

export type NetworkCustomerLogin =
  | { type: "customer_email"; email: string; language: string; since: EpochMilliseconds }
  | { type: "customer_phone"; number: string; language: string; since: EpochMilliseconds };

export interface NetworkCustomerSession {
  id: string;
  reach: NetworkSignInReach;
  signed_in_with: LoginAddress;
  authenticated_at: EpochMilliseconds;
  access_expires_at: EpochMilliseconds;
  refresh_expires_at: EpochMilliseconds;
}

export interface NetworkCustomerMe {
  account_id: string;
  logins: NetworkCustomerLogin[];
  session: NetworkCustomerSession;
}

export interface LinkedStore {
  store_id: string;
  name: string;
}

export interface NetworkCustomerStoreKey {
  customer: StorefrontCustomer;
  session: CustomerSessionIssued;
}

export interface NetworkCustomerSignedIn {
  id: string;
  reach: NetworkSignInReach;
}

export interface NetworkCustomerStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface NetworkCustomerConfig {
  apiUrl: string;
  networkId: string;
  sessionStorage?: NetworkCustomerStorage;
}

export type NetworkCustomerLogoutResult =
  | { type: "ended"; session_id: string }
  | { type: "unconfirmed"; session_id: string }
  | { type: "local_only" };

export interface NetworkCustomerLinkRemoved {
  removed: true;
}

export interface NetworkCustomerAccountDeleted {
  deleted: true;
}

export interface RequestNetworkCustomerCodeParams {
  session_id: string;
  reach: NetworkSignInReach;
  contact: LoginContact;
}

export interface VerifyNetworkCustomerCodeParams {
  session_id: string;
  code: string;
}

export interface RequestNetworkCustomerLoginCodeParams {
  contact: LoginContact;
}

export interface VerifyNetworkCustomerLoginParams {
  address: LoginAddress;
  code: string;
  confirm_join: boolean;
}

export interface RemoveNetworkCustomerLoginParams {
  address: LoginAddress;
}

export interface FindLinkedStoresParams {
  limit?: number;
  cursor?: string | null;
}

export interface OpenNetworkCustomerStoreKeyParams {
  store_id: string;
  id: string;
  visitor_token: string | null;
}

export interface AcceptNetworkCustomerInviteParams {
  store_id: string;
  id: string;
  code: string;
  sent_to: LoginAddress;
}

export interface RemoveNetworkCustomerStoreLinkParams {
  store_id: string;
}
