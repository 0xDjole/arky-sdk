import { epochMilliseconds } from 'arky-sdk';
import type { CustomerSessionIssued, CustomerSessionRecord, CustomerSessionStatus } from 'arky-sdk';

const status: CustomerSessionStatus = { type: 'superseded' };
const visitor: CustomerSessionIssued = {
  id: 'session', customer_id: 'customer', type: 'visitor', status: { type: 'active' },
  token: 'customer_visitor_exact', expires_at: epochMilliseconds(10),
};
const record: CustomerSessionRecord = {
  id: 'session', store_id: 'store', customer_id: 'customer', type: 'visitor',
  status: { type: 'superseded' }, superseded_at: epochMilliseconds(5), revoked_at: null,
  expires_at: epochMilliseconds(10), email_verification: null, last_seen_at: null,
  created_at: epochMilliseconds(1), updated_at: epochMilliseconds(5),
};
// @ts-expect-error Customer lifecycle status is tagged on the public wire.
const plainStatus: CustomerSessionStatus = 'active';
// @ts-expect-error An issued credential is always active.
const revokedIssued: CustomerSessionIssued = { ...visitor, status: { type: 'revoked' } };
// @ts-expect-error The response status tag contains no private lifecycle timestamp.
const timestampInTag: CustomerSessionStatus = { type: 'revoked', revoked_at: epochMilliseconds(5) };
export type CustomerSessionContracts = [typeof status, typeof visitor, typeof record];
