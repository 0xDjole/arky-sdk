import { epochMilliseconds } from 'arky-sdk';
import type { CustomerCode, CustomerLoginType, CustomerMe, CustomerSession, CustomerSessionCode, CustomerSessionIssued, CustomerSessionResult, CustomerSessionStatus, CustomerSessionType, IdentifyCustomerParams, StorefrontCustomerLogin, UpdateCustomerMeParams, UpdateOwnLoginParams, VerifyNewLoginParams } from 'arky-sdk';
import type { StorefrontClient } from 'arky-sdk/storefront';

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type Accepts<T, V> = V extends T ? true : false;

const status: CustomerSessionStatus = { type: 'superseded' };
const visitor: CustomerSessionIssued = {
  id: 'session', customer_id: 'customer', type: 'visitor', status: { type: 'active' },
  token: 'customer_visitor_exact', expires_at: epochMilliseconds(10),
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
  Assert<Equal<Extract<CustomerSessionStatus, { type: 'revoked' }>, { type: 'revoked' }>>,
  Assert<Equal<Extract<CustomerSessionIssued, { type: 'visitor' }>['token'], string>>,
  Assert<Missing<Extract<CustomerSessionIssued, { type: 'visitor' }>, 'access_token' | 'refresh_token'>>,
  Assert<Equal<Extract<CustomerSessionIssued, { type: 'logged_in' }>['login_id'], string>>,
  Assert<Missing<Extract<CustomerSessionIssued, { type: 'visitor' }>, 'login_id'>>,
  Assert<Equal<CustomerSessionType['type'], 'visitor' | 'logged_in'>>,
  Assert<Equal<Extract<CustomerSessionType, { type: 'logged_in' }>['login_id'], string>>,
  Assert<Equal<Extract<CustomerLoginType, { type: 'invited_email' }>['code'], CustomerCode>>,
  Assert<Equal<Extract<CustomerLoginType, { type: 'invited_phone' }>['code'], CustomerCode>>,
  Assert<Equal<CustomerSessionCode['type'], 'email' | 'phone'>>,
  Assert<Equal<Extract<CustomerSessionCode, { type: 'email' }>['code'], CustomerCode>>,
  Assert<Equal<Extract<CustomerSessionCode, { type: 'phone' }>['code'], CustomerCode>>,
  Assert<Equal<keyof IdentifyCustomerParams, 'customer_id' | 'session_id'>>,
  Assert<Missing<StorefrontClient['customer'], 'captureEmail'>>,
  Assert<Missing<CustomerSession, 'superseded_at'>>,
  Assert<Missing<CustomerSession, 'revoked_at'>>,
  Assert<Equal<typeof record, CustomerSession>>,
  Assert<Equal<Extract<CustomerSessionType, { type: 'logged_in' }>['new_login_codes'], CustomerSessionCode[]>>,
  Assert<Equal<Extract<CustomerSessionType, { type: 'visitor' }>['sign_in_codes'], CustomerSessionCode[]>>,
  Assert<Equal<CustomerSessionResult['login'], StorefrontCustomerLogin | null>>,
  Assert<Equal<keyof VerifyNewLoginParams, 'code'>>,
  Assert<Equal<Awaited<ReturnType<StorefrontClient['customer']['verifyNewLogin']>>, CustomerMe>>,
  Assert<Missing<StorefrontClient['customer'], 'changeEmail'>>,
  Assert<Missing<UpdateCustomerMeParams, 'email'>>,
  Assert<Missing<UpdateCustomerMeParams, 'language'>>,
  Assert<Equal<UpdateOwnLoginParams['language'], string | undefined>>,
  Assert<Equal<Parameters<StorefrontClient['customer']['updateMe']>[0], UpdateCustomerMeParams>>,
];

void [status, visitor, record];
