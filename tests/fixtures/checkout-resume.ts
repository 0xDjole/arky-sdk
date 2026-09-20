import type { createAdmin } from 'arky-sdk/admin';
import type { createStorefront, initialize } from 'arky-sdk/storefront';
import type { Checkout, GetCheckoutParams, OrderCheckoutResult, StorefrontDto } from 'arky-sdk';
type Admin = ReturnType<typeof createAdmin>;
type Storefront = ReturnType<typeof createStorefront>;
type Initialized = ReturnType<typeof initialize>;
type True<T extends true> = T;
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
export type CheckoutResumeContracts = [
  True<Same<Parameters<Admin['eshop']['checkout']['resumePayment']>[0], GetCheckoutParams>>,
  True<Same<Awaited<ReturnType<Admin['eshop']['checkout']['resumePayment']>>, OrderCheckoutResult>>,
  True<Same<Awaited<ReturnType<Storefront['eshop']['checkout']['get']>>, StorefrontDto<Checkout>>>,
  True<Same<Awaited<ReturnType<Storefront['eshop']['checkout']['resumePayment']>>, StorefrontDto<OrderCheckoutResult>>>,
  True<Same<Initialized['eshop']['checkout'], Storefront['eshop']['checkout']>>
];
// @ts-expect-error Storefront scope is server-resolved, not a caller-selected Store.
export const wrongStore: Parameters<Storefront['eshop']['checkout']['resumePayment']>[0] = { id: 'checkout', store_id: 'other' };
// @ts-expect-error Resume cannot substitute a new Payment or submitted Cart request.
export const replacement: Parameters<Admin['eshop']['checkout']['resumePayment']>[0] = { id: 'checkout', payment_id: 'replacement' };
