import { epochMilliseconds } from 'arky-sdk';
import type { UserCode, UserInvite, UserMe, UserSession, UserSessionCode, UserSessionIssued, UserSessionResult, UserSessionStatus, UserSessionType, EpochMilliseconds, IdentifyUserParams, LoginAddress, NetworkUserTenantKeyStatus, TenantUserSignedInByEmailStatus, TenantUserSignedInByPhoneStatus, StorefrontUserSession, UpdateUserMeParams, UpdateOwnContactParams, VerifyOwnContactParams, VisitorStatus } from 'arky-sdk';
import type { StorefrontClient } from 'arky-sdk/storefront';

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type Accepts<T, V> = V extends T ? true : false;

const status: UserSessionStatus = { type: 'superseded' };
const revoked: UserSessionStatus = { type: 'revoked', revoked_at: epochMilliseconds(7) };
const visitor: UserSessionIssued = {
  id: 'session', user_id: 'user', type: 'visitor', status: { type: 'active' },
  token: 'user_visitor_exact', expires_at: epochMilliseconds(10),
};
const signedIn: UserSessionIssued = {
  id: 'session', user_id: 'user', type: 'tenant_user_signed_in_by_email', status: { type: 'active' },
  email: 'ana@example.test', access_token: 'user_access_exact', refresh_token: 'user_refresh_exact',
  access_expires_at: epochMilliseconds(10), refresh_expires_at: epochMilliseconds(20), authenticated_at: epochMilliseconds(1),
};
const tenantKey: UserSessionIssued = {
  id: 'session', user_id: 'user', type: 'network_user_tenant_key', status: { type: 'active' },
  access_token: 'user_tenant_key_exact',
};
const record: UserSession = {
  id: 'session', tenant_id: 'tenant', user_id: 'user',
  type: { type: 'visitor', expires_at: epochMilliseconds(10), sign_in_codes: [] },
  status: { type: 'superseded' }, last_seen_at: epochMilliseconds(5),
  created_at: epochMilliseconds(1), updated_at: epochMilliseconds(5),
};

export type UserSessionContracts = [
  Assert<Equal<UserSessionStatus['type'], 'active' | 'superseded' | 'revoked'>>,
  Assert<Accepts<UserSessionStatus, 'active'> extends false ? true : false>,
  Assert<Equal<Extract<UserSessionStatus, { type: 'revoked' }>, { type: 'revoked'; revoked_at: EpochMilliseconds }>>,
  Assert<Equal<Extract<UserSessionIssued, { type: 'visitor' }>['token'], string>>,
  Assert<Missing<Extract<UserSessionIssued, { type: 'visitor' }>, 'access_token' | 'refresh_token' | 'email' | 'number'>>,
  Assert<Equal<UserSessionIssued['type'], 'visitor' | 'tenant_user_signed_in_by_email' | 'tenant_user_signed_in_by_phone' | 'network_user_tenant_key'>>,
  Assert<Equal<Extract<UserSessionIssued, { type: 'tenant_user_signed_in_by_email' }>['email'], string>>,
  Assert<Equal<Extract<UserSessionIssued, { type: 'tenant_user_signed_in_by_phone' }>['number'], string>>,
  Assert<Missing<Extract<UserSessionIssued, { type: 'tenant_user_signed_in_by_email' }>, 'login_id' | 'number'>>,
  Assert<Missing<Extract<UserSessionIssued, { type: 'network_user_tenant_key' }>, 'refresh_token' | 'refresh_expires_at' | 'access_expires_at' | 'authenticated_at' | 'email' | 'number'>>,
  Assert<Equal<UserSessionType['type'], 'visitor' | 'tenant_user_signed_in_by_email' | 'tenant_user_signed_in_by_phone' | 'network_user_tenant_key'>>,
  Assert<Equal<Extract<UserSessionType, { type: 'tenant_user_signed_in_by_email' }>['email'], string>>,
  Assert<Equal<Extract<UserSessionType, { type: 'tenant_user_signed_in_by_phone' }>['number'], string>>,
  Assert<Missing<Extract<UserSessionType, { type: 'network_user_tenant_key' }>, 'refresh_expires_at' | 'access_expires_at' | 'authenticated_at' | 'new_login_codes'>>,
  Assert<Equal<UserInvite['code'], UserCode>>,
  Assert<Equal<UserInvite['sent_to'], LoginAddress>>,
  Assert<Equal<UserSessionCode['type'], 'email' | 'phone'>>,
  Assert<Equal<Extract<UserSessionCode, { type: 'email' }>['code'], UserCode>>,
  Assert<Equal<Extract<UserSessionCode, { type: 'phone' }>['code'], UserCode>>,
  Assert<Equal<keyof IdentifyUserParams, 'user_id' | 'session_id'>>,
  Assert<Missing<StorefrontClient['user'], 'captureEmail'>>,
  Assert<Missing<UserSession, 'superseded_at'>>,
  Assert<Missing<UserSession, 'revoked_at'>>,
  Assert<Equal<typeof record, Extract<UserSession, { type: { type: 'visitor' } }>>>,
  Assert<Equal<Extract<UserSessionType, { type: 'tenant_user_signed_in_by_email' }>['new_login_codes'], UserSessionCode[]>>,
  Assert<Equal<Extract<UserSessionType, { type: 'visitor' }>['sign_in_codes'], UserSessionCode[]>>,
  Assert<Equal<keyof UserSessionResult, 'user' | 'session'>>,
  Assert<Equal<keyof UserMe, 'user' | 'session'>>,
  Assert<Equal<keyof StorefrontUserSession, 'user' | 'id' | 'type' | 'status' | 'signed_in_with'>>,
  Assert<Equal<StorefrontUserSession['signed_in_with'], LoginAddress | null>>,
  Assert<Equal<keyof VerifyOwnContactParams, 'address' | 'code'>>,
  Assert<Equal<Awaited<ReturnType<StorefrontClient['user']['verifyContact']>>, UserMe>>,
  Assert<Missing<StorefrontClient['user'], 'changeEmail' | 'verifyNewLogin' | 'addLogin' | 'updateLogin' | 'deleteLogin'>>,
  Assert<Missing<UpdateUserMeParams, 'email'>>,
  Assert<Missing<UpdateUserMeParams, 'language'>>,
  Assert<Equal<UpdateOwnContactParams['language'], string | undefined>>,
  Assert<Equal<UpdateOwnContactParams['address'], LoginAddress>>,
  Assert<Equal<Parameters<StorefrontClient['user']['updateMe']>[0], UpdateUserMeParams>>,
];

const refreshedAway: UserSession = {
  id: 'session', tenant_id: 'tenant', user_id: 'user',
  type: {
    type: 'tenant_user_signed_in_by_email', email: 'ana@example.test',
    access_expires_at: epochMilliseconds(10), refresh_expires_at: epochMilliseconds(20), authenticated_at: epochMilliseconds(1), new_login_codes: [],
  },
  status: { type: 'revoked', revoked_at: epochMilliseconds(6) }, last_seen_at: epochMilliseconds(5),
  created_at: epochMilliseconds(1), updated_at: epochMilliseconds(6),
};

type Revoked = { type: 'revoked'; revoked_at: EpochMilliseconds };
type SessionCommon = Omit<UserSession, 'type' | 'status'>;
type SignedInByEmail = Extract<UserSessionType, { type: 'tenant_user_signed_in_by_email' }>;
type TenantKey = Extract<UserSessionType, { type: 'network_user_tenant_key' }>;

export type UserSessionLifecycleContracts = [
  Assert<Equal<VisitorStatus, { type: 'active' } | { type: 'superseded' } | Revoked>>,
  Assert<Equal<TenantUserSignedInByEmailStatus, { type: 'active' } | Revoked>>,
  Assert<Equal<TenantUserSignedInByPhoneStatus, { type: 'active' } | Revoked>>,
  Assert<Equal<NetworkUserTenantKeyStatus, { type: 'active' } | Revoked>>,
  Assert<Equal<Extract<UserSession, { type: { type: 'visitor' } }>['status'], VisitorStatus>>,
  Assert<Equal<Extract<UserSession, { type: { type: 'tenant_user_signed_in_by_email' } }>['status'], TenantUserSignedInByEmailStatus>>,
  Assert<Equal<Extract<UserSession, { type: { type: 'tenant_user_signed_in_by_phone' } }>['status'], TenantUserSignedInByPhoneStatus>>,
  Assert<Equal<Extract<UserSession, { type: { type: 'network_user_tenant_key' } }>['status'], NetworkUserTenantKeyStatus>>,
  Assert<Equal<UserSession['type'], UserSessionType>>,
  Assert<Accepts<UserSession, SessionCommon & { type: SignedInByEmail; status: { type: 'superseded' } }> extends false ? true : false>,
  Assert<Accepts<UserSession, SessionCommon & { type: TenantKey; status: { type: 'superseded' } }> extends false ? true : false>,
  Assert<Accepts<UserSession, SessionCommon & { type: SignedInByEmail; status: Revoked }>>,
  Assert<Equal<Extract<UserSessionIssued, { type: 'visitor' }>['status'], VisitorStatus>>,
  Assert<Equal<Extract<UserSessionIssued, { type: 'tenant_user_signed_in_by_email' }>['status'], TenantUserSignedInByEmailStatus>>,
  Assert<Equal<Extract<UserSessionIssued, { type: 'tenant_user_signed_in_by_phone' }>['status'], TenantUserSignedInByPhoneStatus>>,
  Assert<Equal<Extract<UserSessionIssued, { type: 'network_user_tenant_key' }>['status'], NetworkUserTenantKeyStatus>>,
  Assert<Equal<Extract<StorefrontUserSession, { type: 'visitor' }>['status'], VisitorStatus>>,
  Assert<Equal<Extract<StorefrontUserSession, { type: 'tenant_user_signed_in_by_email' }>['status'], TenantUserSignedInByEmailStatus>>,
  Assert<Equal<Extract<StorefrontUserSession, { type: 'tenant_user_signed_in_by_phone' }>['status'], TenantUserSignedInByPhoneStatus>>,
  Assert<Equal<Extract<StorefrontUserSession, { type: 'network_user_tenant_key' }>['status'], NetworkUserTenantKeyStatus>>,
  Assert<Equal<StorefrontUserSession['type'], UserSessionIssued['type']>>,
];

void [status, revoked, visitor, signedIn, tenantKey, record, refreshedAway];
