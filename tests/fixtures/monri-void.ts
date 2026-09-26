import type { EpochMilliseconds, MonriAuthorizationVoid, MonriVoidResult, MonriVoidStatus, Payment, ProviderOperationClaim } from 'arky-sdk';

declare const at: EpochMilliseconds;
declare const claim: ProviderOperationClaim;
export const result: MonriVoidResult = {
  claim,
  transaction_id: '18446744073709551615',
  amount: 100,
  currency: null,
  response_code: '0000',
  transaction_created_at: at,
  observed_at: at,
};
export const authorizationVoid: MonriAuthorizationVoid = {
  amount: 100,
  requested_at: at,
  status: { type: 'succeeded', result },
};
export const binding: Payment['provider'] = {
  type: 'monri_checkout',
  payment_option_id: 'provider',
  environment: 'test',
  transaction_type: 'authorize',
  transaction_id: '901',
  authorization_void: authorizationVoid,
};
export const states: MonriVoidStatus[] = [
  { type: 'requested' },
  { type: 'processing', claim },
  { type: 'succeeded', result },
  { type: 'rejected', result },
  { type: 'failed', error: { type: 'provider_call_not_started', message: 'not sent', at }, completed_at: at },
  { type: 'unknown', claim, error: { type: 'unknown_outcome', message: 'unknown', provider_code: null, provider_http_status: null, at }, observed_at: at },
];
// @ts-expect-error Native transaction identities are decimal strings, never JavaScript numbers.
export const unsafeIdentity: MonriVoidResult = { ...result, transaction_id: 992 };
// @ts-expect-error Success must carry its actual original response.
export const emptySuccess: MonriVoidStatus = { type: 'succeeded' };
// @ts-expect-error A missing response currency is explicit null, not an omitted field.
export const missingCurrency: MonriVoidResult = { claim, transaction_id: '992', amount: 100, response_code: '0000', transaction_created_at: at, observed_at: at };
