import { epochMilliseconds } from 'arky-sdk';
import type { createAdmin } from 'arky-sdk/admin';
import type { ConnectMonriTenantProviderParams, CreateCardPaymentOptionParams, UpdatePaymentOptionParams, MonriEnvironment, PaymentOption, LocalizedMarkdown, ReplaceMonriMerchantKeyParams, EpochMilliseconds, TenantProvider, TenantProviderStatus } from 'arky-sdk';
type Admin = ReturnType<typeof createAdmin>;
type True<T extends true> = T;
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type RequiredField<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type MonriOption = Extract<PaymentOption['type'], { type: 'monri' }>;
type MonriLogin = Extract<TenantProvider['type'], { type: 'monri' }>;

export type MonriConfigurationContracts = [
  True<Same<Parameters<Admin['tenant']['provider']['connectMonri']>[0], ConnectMonriTenantProviderParams>>,
  True<Same<Awaited<ReturnType<Admin['tenant']['provider']['connectMonri']>>, TenantProvider>>,
  True<Same<ConnectMonriTenantProviderParams, { tenant_id: string; id: string; environment: MonriEnvironment; merchant_key: string; authenticity_token: string }>>,
  True<Same<MonriLogin, { type: 'monri'; environment: MonriEnvironment }>>,
  True<Same<Parameters<Admin['tenant']['paymentOption']['createMonri']>[0], CreateCardPaymentOptionParams>>,
  True<Same<Awaited<ReturnType<Admin['tenant']['paymentOption']['createMonri']>>, PaymentOption>>,
  True<Missing<Admin['tenant']['paymentOption'], 'monri'>>,
  True<Same<Parameters<Admin['tenant']['paymentOption']['update']>[0], UpdatePaymentOptionParams>>,
  True<Same<Awaited<ReturnType<Admin['tenant']['paymentOption']['update']>>, PaymentOption>>,
  True<Missing<UpdatePaymentOptionParams, 'merchant_key'>>,
  True<Missing<MonriOption, 'merchant_key'>>,
  True<Missing<MonriOption, 'encrypted_merchant_key'>>,
  True<Missing<MonriOption, 'authenticity_token'>>,
  True<Same<MonriOption['provider_id'], string>>,
  True<Same<MonriOption['provider_status'], TenantProviderStatus>>,
  True<Same<MonriOption['provider_updated_at'], EpochMilliseconds>>,
  True<RequiredField<CreateCardPaymentOptionParams, 'provider_id'>>,
  True<RequiredField<CreateCardPaymentOptionParams, 'id'>>,
  True<RequiredField<CreateCardPaymentOptionParams, 'saved_card_terms'>>,
  True<Missing<CreateCardPaymentOptionParams, 'environment' | 'merchant_key' | 'authenticity_token'>>,
  True<Same<CreateCardPaymentOptionParams['saved_card_terms'], LocalizedMarkdown>>,
  True<Same<MonriOption['saved_card_terms'], LocalizedMarkdown>>,
  True<RequiredField<UpdatePaymentOptionParams, 'saved_card_terms'>>,
  True<Same<UpdatePaymentOptionParams['saved_card_terms'], LocalizedMarkdown | null>>,
  True<Same<PaymentOption['status'], 'active' | 'disabled'>>,
  True<Same<Parameters<Admin['tenant']['provider']['replaceMonriMerchantKey']>[0], ReplaceMonriMerchantKeyParams>>,
  True<Same<ReplaceMonriMerchantKeyParams, { tenant_id: string; id: string; expected_updated_at: EpochMilliseconds; merchant_key: string }>>,
  True<Same<Awaited<ReturnType<Admin['tenant']['provider']['replaceMonriMerchantKey']>>, TenantProvider>>,
  True<Missing<ReplaceMonriMerchantKeyParams, 'authenticity_token' | 'environment'>>,
];

export const login: ConnectMonriTenantProviderParams = {
  tenant_id: 'tenant', id: 'provider', environment: 'test',
  merchant_key: 'submitted-secret', authenticity_token: 'submitted-token',
};
export const input: CreateCardPaymentOptionParams = {
  tenant_id: 'tenant', provider_id: 'provider', id: 'option', key: 'cards', blocks: [], status: 'disabled',
  saved_card_terms: { bs: 'Saglasnost za čuvanje kartice i ugovorene obnove.' },
};
export const environment: MonriEnvironment = 'live';
export const config: PaymentOption['type'] = {
  type: 'monri', provider_id: 'provider', provider_status: 'active', provider_updated_at: epochMilliseconds(1),
  environment: 'test', saved_card_terms: {},
};
export const filter: Parameters<Admin['tenant']['paymentOption']['find']>[0] = { tenant_id: 'tenant', type_name: 'monri', limit: 1 };
