import { MonriCheckoutError, mountCheckoutAction } from 'arky-sdk';
import type { CheckoutPaymentAction, EmbeddedCheckoutMount, MonriBuyerDetails, MonriComponentsAction } from 'arky-sdk';
import { mountCheckoutAction as mountStorefront } from 'arky-sdk/storefront';

type True<T extends true> = T;
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
export type MonriCheckoutContracts = [
  True<Same<Extract<CheckoutPaymentAction, { type: 'monri_components' }>, MonriComponentsAction>>,
  True<Same<Parameters<Extract<EmbeddedCheckoutMount, { type: 'monri_components' }>['confirm']>[0], MonriBuyerDetails>>,
  True<Same<typeof mountCheckoutAction, typeof mountStorefront>>
];

export function inspectMount(mount: EmbeddedCheckoutMount): void {
  if (mount.type === 'monri_components') {
    void mount.confirm({ fullName: 'Test Buyer', address: 'Test Street 1', city: 'Sarajevo', zip: '71000', phone: '+38761123456', country: 'BA', email: 'buyer@example.test' });
    // @ts-expect-error Monri does not expose a Stripe checkout instance.
    void mount.checkout;
  } else {
    void mount.checkout;
    // @ts-expect-error Stripe owns its hosted submission, not ARKY billing confirmation.
    void mount.confirm;
  }
  mount.destroy();
  mount.unmount();
}

export const invalid = new MonriCheckoutError('invalid_details', 'Check billing details');
// @ts-expect-error A Monri capability has no fabricated expiry.
export const expires: MonriComponentsAction['expires_at'] = 1;
