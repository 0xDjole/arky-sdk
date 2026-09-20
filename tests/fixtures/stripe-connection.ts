import type { createAdmin } from 'arky-sdk/admin';
import type { ConnectStripePaymentProviderParams, PaymentProviderConnectResponse, StripeConnectionOperation } from 'arky-sdk';
type Admin = ReturnType<typeof createAdmin>;
type True<T extends true> = T;
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
export type ConnectionResponses = [
  True<Same<Awaited<ReturnType<Admin['store']['paymentProvider']['stripe']['connect']>>, PaymentProviderConnectResponse>>,
  True<Same<Awaited<ReturnType<Admin['store']['paymentProvider']['stripe']['getConnection']>>, StripeConnectionOperation>>,
  True<Same<PaymentProviderConnectResponse['operation'], StripeConnectionOperation>>,
  True<Same<StripeConnectionOperation['metadata_binding_status'], StripeConnectionOperation['account_creation_status'] | null>>
];
export const request: ConnectStripePaymentProviderParams = {
  store_id: 'store', payment_provider_id: 'provider', operation_id: 'operation',
  return_url: 'https://admin.test/return', refresh_url: 'https://admin.test/refresh', authorize_account_debits: false
};
// @ts-expect-error Connect requires an existing provider, not implicit configuration creation.
export const noProvider: ConnectStripePaymentProviderParams = { operation_id: 'operation', return_url: 'https://admin.test', refresh_url: 'https://admin.test', authorize_account_debits: false };
// @ts-expect-error The retired attempt_id is not an operation or compatibility alias.
export const retiredAttempt: ConnectStripePaymentProviderParams = { ...request, attempt_id: 'attempt' };
