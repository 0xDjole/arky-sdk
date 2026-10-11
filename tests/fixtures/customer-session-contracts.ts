import { epochMilliseconds } from 'arky-sdk';
import type { ChangeCustomerEmailParams, CustomerEmailVerification, CustomerMe, CustomerSession, CustomerSessionIssued, CustomerSessionStatus, CustomerSessionType, IdentifyCustomerParams, UpdateCustomerMeParams } from 'arky-sdk';
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
  type: { type: 'visitor', expires_at: epochMilliseconds(10), email_verification: null },
  status: { type: 'superseded' }, last_seen_at: epochMilliseconds(5),
  created_at: epochMilliseconds(1), updated_at: epochMilliseconds(5),
};

export type CustomerSessionContracts = [
  Assert<Equal<CustomerSessionStatus['type'], 'active' | 'superseded' | 'revoked'>>,
  Assert<Accepts<CustomerSessionStatus, 'active'> extends false ? true : false>,
  Assert<Equal<Extract<CustomerSessionStatus, { type: 'revoked' }>, { type: 'revoked' }>>,
  Assert<Equal<Extract<CustomerSessionIssued, { type: 'visitor' }>['token'], string>>,
  Assert<Missing<Extract<CustomerSessionIssued, { type: 'visitor' }>, 'access_token' | 'refresh_token'>>,
  Assert<Equal<CustomerSessionType['type'], 'visitor' | 'email_authenticated'>>,
  Assert<Equal<keyof IdentifyCustomerParams, 'email'>>,
  Assert<Missing<StorefrontClient['customer'], 'captureEmail'>>,
  Assert<Missing<CustomerSession, 'superseded_at'>>,
  Assert<Missing<CustomerSession, 'revoked_at'>>,
  Assert<Equal<typeof record, CustomerSession>>,
  Assert<Equal<Extract<CustomerSessionType, { type: 'email_authenticated' }>['email_change'], CustomerEmailVerification | null>>,
  Assert<Equal<Extract<CustomerSessionType, { type: 'visitor' }>['email_verification'], CustomerEmailVerification | null>>,
  Assert<Equal<keyof ChangeCustomerEmailParams, 'code' | 'language'>>,
  Assert<Equal<Awaited<ReturnType<StorefrontClient['customer']['changeEmail']>>, CustomerMe>>,
  Assert<Equal<UpdateCustomerMeParams['email'], string | undefined>>,
];

void [status, visitor, record];
