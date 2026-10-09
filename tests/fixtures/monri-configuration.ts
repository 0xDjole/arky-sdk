import type { createAdmin } from 'arky-sdk/admin';
import type { CreateMonriPaymentOptionParams, UpdatePaymentOptionParams, MonriEnvironment, PaymentOption } from 'arky-sdk';
type Admin = ReturnType<typeof createAdmin>;
type True<T extends true> = T;
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type MonriOption = Extract<PaymentOption['type'], { type: 'monri' }>;

export type MonriConfigurationContracts = [
  True<Same<Awaited<ReturnType<Admin['store']['paymentOption']['monri']['create']>>, PaymentOption>>,
  True<Same<Parameters<Admin['store']['paymentOption']['update']>[0], UpdatePaymentOptionParams>>,
  True<Same<Awaited<ReturnType<Admin['store']['paymentOption']['update']>>, PaymentOption>>,
  True<Missing<UpdatePaymentOptionParams, 'merchant_key'>>,
  True<Missing<MonriOption, 'merchant_key'>>,
  True<Missing<MonriOption, 'encrypted_merchant_key'>>,
  True<Missing<MonriOption, 'authenticity_token'>>,
  True<RequiredField<CreateMonriPaymentOptionParams, 'environment'>>,
  True<RequiredField<CreateMonriPaymentOptionParams, 'id'>>,
  True<Same<PaymentOption['status'], 'active' | 'disabled'>>,
];

export const input: CreateMonriPaymentOptionParams = {
  store_id: 'store', id: 'provider', key: 'cards', blocks: [], environment: 'test',
  merchant_key: 'submitted-secret', authenticity_token: 'submitted-token', status: 'disabled',
};
export const environment: MonriEnvironment = 'live';
export const config: PaymentOption['type'] = { type: 'monri', environment: 'test' };
export const filter: Parameters<Admin['store']['paymentOption']['list']>[0] = { store_id: 'store', type_name: 'monri', limit: 1 };
