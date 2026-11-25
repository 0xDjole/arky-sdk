import { epochMilliseconds } from 'arky-sdk';
import type { CustomerCode, CustomerInvite, CustomerMe, CustomerSession, CustomerSessionCode, CustomerSessionIssued, CustomerSessionResult, CustomerSessionStatus, CustomerSessionType, EpochMilliseconds, IdentifyCustomerParams, LoginAddress, NetworkCustomerStoreKeyStatus, StoreCustomerSignedInByEmailStatus, StoreCustomerSignedInByPhoneStatus, StorefrontCustomerSession, UpdateCustomerMeParams, UpdateOwnContactParams, VerifyOwnContactParams, VisitorStatus } from 'arky-sdk';
import type { StorefrontClient } from 'arky-sdk/storefront';

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type Accepts<T, V> = V extends T ? true : false;

const status: CustomerSessionStatus = { type: 'superseded' };
const revoked: CustomerSessionStatus = { type: 'revoked', revoked_at: epochMilliseconds(7) };
const visitor: CustomerSessionIssued = {
  id: 'session', customer_id: 'customer', type: 'visitor', status: { type: 'active' },
  token: 'customer_visitor_exact', expires_at: epochMilliseconds(10),
};
const signedIn: CustomerSessionIssued = {
  id: 'session', customer_id: 'customer', type: 'store_customer_signed_in_by_email', status: { type: 'active' },
  email: 'ana@example.test', access_token: 'customer_access_exact', refresh_token: 'customer_refresh_exact',
  access_expires_at: epochMilliseconds(10), refresh_expires_at: epochMilliseconds(20), authenticated_at: epochMilliseconds(1),
};
const storeKey: CustomerSessionIssued = {
  id: 'session', customer_id: 'customer', type: 'network_customer_store_key', status: { type: 'active' },
  access_token: 'customer_store_key_exact',
};
const record: CustomerSession = {
  id: 'session', store_id: 'store', customer_id: 'customer',
  type: { type: 'visitor', expires_at: epochMilliseconds(10), sign_in_codes: [] },
  status: { type: 'superseded' }, last_seen_at: epochMilliseconds(5),
  created_at: epochMilliseconds(1), updated_at: epochMilliseconds(5),
};

export type CustomerSessionContracts = [
  Assert<Equal<CustomerSessionStatus['type'], 'active' | 'superseded' | 'revoked'>>,
  Assert<Accepts<CustomerSessionStatus, 'active'> extends false ? true : false>,
  Assert<Equal<Extract<CustomerSessionStatus, { type: 'revoked' }>, { type: 'revoked'; revoked_at: EpochMilliseconds }>>,
  Assert<Equal<Extract<CustomerSessionIssued, { type: 'visitor' }>['token'], string>>,
  Assert<Missing<Extract<CustomerSessionIssued, { type: 'visitor' }>, 'access_token' | 'refresh_token' | 'email' | 'number'>>,
  Assert<Equal<CustomerSessionIssued['type'], 'visitor' | 'store_customer_signed_in_by_email' | 'store_customer_signed_in_by_phone' | 'network_customer_store_key'>>,
  Assert<Equal<Extract<CustomerSessionIssued, { type: 'store_customer_signed_in_by_email' }>['email'], string>>,
  Assert<Equal<Extract<CustomerSessionIssued, { type: 'store_customer_signed_in_by_phone' }>['number'], string>>,
  Assert<Missing<Extract<CustomerSessionIssued, { type: 'store_customer_signed_in_by_email' }>, 'login_id' | 'number'>>,
  Assert<Missing<Extract<CustomerSessionIssued, { type: 'network_customer_store_key' }>, 'refresh_token' | 'refresh_expires_at' | 'access_expires_at' | 'authenticated_at' | 'email' | 'number'>>,
  Assert<Equal<CustomerSessionType['type'], 'visitor' | 'store_customer_signed_in_by_email' | 'store_customer_signed_in_by_phone' | 'network_customer_store_key'>>,
  Assert<Equal<Extract<CustomerSessionType, { type: 'store_customer_signed_in_by_email' }>['email'], string>>,
  Assert<Equal<Extract<CustomerSessionType, { type: 'store_customer_signed_in_by_phone' }>['number'], string>>,
  Assert<Missing<Extract<CustomerSessionType, { type: 'network_customer_store_key' }>, 'refresh_expires_at' | 'access_expires_at' | 'authenticated_at' | 'new_login_codes'>>,
  Assert<Equal<CustomerInvite['code'], CustomerCode>>,
  Assert<Equal<CustomerInvite['sent_to'], LoginAddress>>,
  Assert<Equal<CustomerSessionCode['type'], 'email' | 'phone'>>,
  Assert<Equal<Extract<CustomerSessionCode, { type: 'email' }>['code'], CustomerCode>>,
  Assert<Equal<Extract<CustomerSessionCode, { type: 'phone' }>['code'], CustomerCode>>,
  Assert<Equal<keyof IdentifyCustomerParams, 'customer_id' | 'session_id'>>,
  Assert<Missing<StorefrontClient['customer'], 'captureEmail'>>,
  Assert<Missing<CustomerSession, 'superseded_at'>>,
  Assert<Missing<CustomerSession, 'revoked_at'>>,
  Assert<Equal<typeof record, Extract<CustomerSession, { type: { type: 'visitor' } }>>>,
  Assert<Equal<Extract<CustomerSessionType, { type: 'store_customer_signed_in_by_email' }>['new_login_codes'], CustomerSessionCode[]>>,
  Assert<Equal<Extract<CustomerSessionType, { type: 'visitor' }>['sign_in_codes'], CustomerSessionCode[]>>,
  Assert<Equal<keyof CustomerSessionResult, 'customer' | 'session'>>,
  Assert<Equal<keyof CustomerMe, 'customer' | 'session'>>,
  Assert<Equal<keyof StorefrontCustomerSession, 'customer' | 'id' | 'type' | 'status' | 'signed_in_with'>>,
  Assert<Equal<StorefrontCustomerSession['signed_in_with'], LoginAddress | null>>,
  Assert<Equal<keyof VerifyOwnContactParams, 'address' | 'code'>>,
  Assert<Equal<Awaited<ReturnType<StorefrontClient['customer']['verifyContact']>>, CustomerMe>>,
  Assert<Missing<StorefrontClient['customer'], 'changeEmail' | 'verifyNewLogin' | 'addLogin' | 'updateLogin' | 'deleteLogin'>>,
  Assert<Missing<UpdateCustomerMeParams, 'email'>>,
  Assert<Missing<UpdateCustomerMeParams, 'language'>>,
  Assert<Equal<UpdateOwnContactParams['language'], string | undefined>>,
  Assert<Equal<UpdateOwnContactParams['address'], LoginAddress>>,
  Assert<Equal<Parameters<StorefrontClient['customer']['updateMe']>[0], UpdateCustomerMeParams>>,
];

const refreshedAway: CustomerSession = {
  id: 'session', store_id: 'store', customer_id: 'customer',
  type: {
    type: 'store_customer_signed_in_by_email', email: 'ana@example.test',
    access_expires_at: epochMilliseconds(10), refresh_expires_at: epochMilliseconds(20), authenticated_at: epochMilliseconds(1), new_login_codes: [],
  },
  status: { type: 'revoked', revoked_at: epochMilliseconds(6) }, last_seen_at: epochMilliseconds(5),
  created_at: epochMilliseconds(1), updated_at: epochMilliseconds(6),
};

type Revoked = { type: 'revoked'; revoked_at: EpochMilliseconds };
type SessionCommon = Omit<CustomerSession, 'type' | 'status'>;
type SignedInByEmail = Extract<CustomerSessionType, { type: 'store_customer_signed_in_by_email' }>;
type StoreKey = Extract<CustomerSessionType, { type: 'network_customer_store_key' }>;

export type CustomerSessionLifecycleContracts = [
  Assert<Equal<VisitorStatus, { type: 'active' } | { type: 'superseded' } | Revoked>>,
  Assert<Equal<StoreCustomerSignedInByEmailStatus, { type: 'active' } | Revoked>>,
  Assert<Equal<StoreCustomerSignedInByPhoneStatus, { type: 'active' } | Revoked>>,
  Assert<Equal<NetworkCustomerStoreKeyStatus, { type: 'active' } | Revoked>>,
  Assert<Equal<Extract<CustomerSession, { type: { type: 'visitor' } }>['status'], VisitorStatus>>,
  Assert<Equal<Extract<CustomerSession, { type: { type: 'store_customer_signed_in_by_email' } }>['status'], StoreCustomerSignedInByEmailStatus>>,
  Assert<Equal<Extract<CustomerSession, { type: { type: 'store_customer_signed_in_by_phone' } }>['status'], StoreCustomerSignedInByPhoneStatus>>,
  Assert<Equal<Extract<CustomerSession, { type: { type: 'network_customer_store_key' } }>['status'], NetworkCustomerStoreKeyStatus>>,
  Assert<Equal<CustomerSession['type'], CustomerSessionType>>,
  Assert<Accepts<CustomerSession, SessionCommon & { type: SignedInByEmail; status: { type: 'superseded' } }> extends false ? true : false>,
  Assert<Accepts<CustomerSession, SessionCommon & { type: StoreKey; status: { type: 'superseded' } }> extends false ? true : false>,
  Assert<Accepts<CustomerSession, SessionCommon & { type: SignedInByEmail; status: Revoked }>>,
  Assert<Equal<Extract<CustomerSessionIssued, { type: 'visitor' }>['status'], VisitorStatus>>,
  Assert<Equal<Extract<CustomerSessionIssued, { type: 'store_customer_signed_in_by_email' }>['status'], StoreCustomerSignedInByEmailStatus>>,
  Assert<Equal<Extract<CustomerSessionIssued, { type: 'store_customer_signed_in_by_phone' }>['status'], StoreCustomerSignedInByPhoneStatus>>,
  Assert<Equal<Extract<CustomerSessionIssued, { type: 'network_customer_store_key' }>['status'], NetworkCustomerStoreKeyStatus>>,
  Assert<Equal<Extract<StorefrontCustomerSession, { type: 'visitor' }>['status'], VisitorStatus>>,
  Assert<Equal<Extract<StorefrontCustomerSession, { type: 'store_customer_signed_in_by_email' }>['status'], StoreCustomerSignedInByEmailStatus>>,
  Assert<Equal<Extract<StorefrontCustomerSession, { type: 'store_customer_signed_in_by_phone' }>['status'], StoreCustomerSignedInByPhoneStatus>>,
  Assert<Equal<Extract<StorefrontCustomerSession, { type: 'network_customer_store_key' }>['status'], NetworkCustomerStoreKeyStatus>>,
  Assert<Equal<StorefrontCustomerSession['type'], CustomerSessionIssued['type']>>,
];

void [status, revoked, visitor, signedIn, storeKey, record, refreshedAway];
