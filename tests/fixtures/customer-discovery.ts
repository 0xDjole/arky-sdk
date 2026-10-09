import { createAdmin } from '../../dist/index.js';
import type { CustomerSearchSnapshot, FindCustomersParams } from '../../dist/index.js';

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;

declare const admin: ReturnType<typeof createAdmin>;
const filters: FindCustomersParams = {
  store_id: '9c2e5b74-1f38-4a6d-8b05-3e7f0a9d6c12', query: 'buyer', has_cart: false, has_customer_action: true, email_type: 'verified',
  sort_field: 'updated_at', sort_direction: 'asc', cursor: null, limit: 1,
};
const page: Promise<{ items: CustomerSearchSnapshot[]; cursor: string | null }> = admin.customers.find(filters);
void page;

export type CustomerDiscoveryContracts = [
  Assert<Equal<FindCustomersParams['sort_field'], 'created_at' | 'updated_at' | undefined>>,
  Assert<Equal<FindCustomersParams['query'], string | undefined>>,
  Assert<Equal<FindCustomersParams['status'], 'active' | 'archived' | undefined>>,
  Assert<Equal<FindCustomersParams['email_type'], 'no_email' | 'contact' | 'reserved' | 'verified' | undefined>>,
  Assert<Missing<FindCustomersParams, 'has_verified_email'>>,
  Assert<Equal<keyof CustomerSearchSnapshot, 'customer' | 'has_cart' | 'has_customer_action'>>,
];
