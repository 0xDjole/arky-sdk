import type { Payment } from 'arky-sdk';

export const monri: Payment['provider'] = {
  type: 'monri_checkout', payment_provider_id: 'provider', environment: 'test',
  transaction_type: 'purchase', transaction_id: '18446744073709551615',
  authorization_void: null,
};
declare const payment: Payment;
if (payment.provider.type === 'monri_checkout') {
  const transaction: string | null = payment.provider.transaction_id;
  // @ts-expect-error Session ciphertext is never a general Payment response.
  payment.provider.session;
  // @ts-expect-error Client capabilities are never general Payment metadata.
  payment.provider.client_secret;
  // @ts-expect-error A Monri binding does not invent a Stripe account identity.
  payment.provider.connected_account_id;
}
