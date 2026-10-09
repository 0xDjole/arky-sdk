import { epochMilliseconds } from 'arky-sdk';
import type { CustomerSession, CustomerSessionIssued, CustomerSessionStatus, CustomerSessionType, IdentifyCustomerParams } from 'arky-sdk';
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
];

void [status, visitor, record];
