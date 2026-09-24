import type { createAdmin } from 'arky-sdk/admin';
import type { CreateMonriPaymentProviderParams, UpdatePaymentProviderParams, MonriEnvironment, PaymentProvider } from 'arky-sdk';
type Admin = ReturnType<typeof createAdmin>;
type True<T extends true> = T;
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
export type MonriResult = True<Same<Awaited<ReturnType<Admin['store']['paymentProvider']['monri']['create']>>, PaymentProvider>>;
export type AvailabilityInput = True<Same<Parameters<Admin['store']['paymentProvider']['update']>[0], UpdatePaymentProviderParams>>;
export type AvailabilityResult = True<Same<Awaited<ReturnType<Admin['store']['paymentProvider']['update']>>, PaymentProvider>>;
declare const update: UpdatePaymentProviderParams;
// @ts-expect-error Availability updates cannot replace merchant credentials.
update.merchant_key;
export const input: CreateMonriPaymentProviderParams = {
  id: 'provider', key: 'cards', blocks: [], environment: 'test',
  merchant_key: 'submitted-secret', authenticity_token: 'submitted-token', status: { type: 'disabled' },
};
export const environment: MonriEnvironment = 'live';
export const config: PaymentProvider['configuration'] = { type: 'monri', environment: 'test' };
export const filter: Parameters<Admin['store']['paymentProvider']['list']>[0] = { configuration_type: 'monri', limit: 1 };
declare const provider: PaymentProvider;
if (provider.configuration.type === 'monri') {
  // @ts-expect-error Merchant credentials are write-only API input, never a response.
  provider.configuration.merchant_key;
  // @ts-expect-error Ciphertext is not a public API field either.
  provider.configuration.encrypted_merchant_key;
}
// @ts-expect-error Environment selection is explicit and has no production default.
export const missing: CreateMonriPaymentProviderParams = { id: 'p', key: 'cards', blocks: [], merchant_key: 's', authenticity_token: 't', status: { type: 'active' } };
