import type { createAdmin } from 'arky-sdk/admin';
import type {
  CancelStripeConfigurationParams, ConfigureStripePaymentOptionParams, GetStripeConfigurationChangeParams,
  PaymentOption, StripeConfigurationChange, StripeConfigurationInput, StripeConfigurationResolution,
  StripeMerchantConfiguration, StripeMerchantSetup, StripeProviderConnection, StoreSubscriptionCheckoutAction,
  CheckoutPaymentAction,
} from 'arky-sdk';
type Admin = ReturnType<typeof createAdmin>;
type Stripe = Admin['store']['paymentOption']['stripe'];
type True<T extends true> = T;
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type StripeCheckout = Extract<CheckoutPaymentAction, { type: 'stripe_embedded_checkout' }>;
type BillingCheckout = Extract<StoreSubscriptionCheckoutAction, { type: 'stripe_embedded_checkout' }>;
export type MerchantConfigurationContracts = [
  True<Same<keyof Stripe, 'setup' | 'configure' | 'cancelConfiguration' | 'getConfigurationChange' | 'refresh'>>,
  True<Same<Awaited<ReturnType<Stripe['setup']>>, StripeMerchantSetup>>,
  True<Same<Parameters<Stripe['configure']>[0], ConfigureStripePaymentOptionParams>>,
  True<Same<Awaited<ReturnType<Stripe['configure']>>, StripeConfigurationChange>>,
  True<Same<Parameters<Stripe['getConfigurationChange']>[0], GetStripeConfigurationChangeParams>>,
  True<Same<Awaited<ReturnType<Stripe['getConfigurationChange']>>, StripeConfigurationChange>>,
  True<Same<Parameters<Stripe['cancelConfiguration']>[0], CancelStripeConfigurationParams>>,
  True<Same<Awaited<ReturnType<Stripe['cancelConfiguration']>>, StripeConfigurationResolution>>,
  True<Same<Awaited<ReturnType<Stripe['refresh']>>, PaymentOption>>,
  True<Same<keyof ConfigureStripePaymentOptionParams, 'store_id' | 'id' | 'request_id' | 'expected_updated_at' | 'configuration'>>,
  True<Same<StripeConfigurationInput['type'], 'access' | 'webhook'>>,
  True<Same<StripeProviderConnection['type'], 'unconfigured' | 'configured'>>,
  True<Same<StripeMerchantConfiguration['account_id'], string>>,
  True<Same<StripeCheckout['account_id'], string>>,
  True<'connected_account_id' extends keyof StripeCheckout ? false : true>,
  True<'account_id' extends keyof BillingCheckout ? false : true>,
  True<'stripe_account_id' extends keyof BillingCheckout ? false : true>,
];
export const request: ConfigureStripePaymentOptionParams = {
  store_id: 'store', id: 'provider', request_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', expected_updated_at: 1 as ConfigureStripePaymentOptionParams['expected_updated_at'],
  configuration: { type: 'access', restricted_key: 'rk_test', publishable_key: 'pk_test' },
};
// @ts-expect-error
export const noRequest: ConfigureStripePaymentOptionParams = { store_id: 'store', id: 'provider', expected_updated_at: request.expected_updated_at, configuration: request.configuration };
// @ts-expect-error
export const connectedAccount: ConfigureStripePaymentOptionParams = { ...request, connected_account_id: 'acct_platform' };
