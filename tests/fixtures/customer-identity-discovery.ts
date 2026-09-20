import type { createAdmin } from 'arky-sdk/admin';
import type { CustomerIdentity, CustomerIdentityCommandParams, FindCustomerIdentitiesParams, FindCustomersParams, PaginatedResponse } from 'arky-sdk';
type Admin = ReturnType<typeof createAdmin>;
type True<T extends true> = T;
type Same<A,B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
export type IdentityResponses = [
  True<Same<Awaited<ReturnType<Admin['customers']['identities']>>,PaginatedResponse<CustomerIdentity>>>,
  True<Same<Awaited<ReturnType<Admin['customers']['getIdentity']>>,CustomerIdentity>>,
  True<Same<Awaited<ReturnType<Admin['customers']['revokeIdentity']>>,CustomerIdentity>>
];
export const find: FindCustomerIdentitiesParams = { store_id:'store',customer_id:'customer',status:'revoked',verified:false,limit:20,cursor:'opaque' };
export const exact: CustomerIdentityCommandParams = { store_id:'store',customer_id:'customer',identity_id:'identity' };
export const customers: FindCustomersParams = { status:'archived' };
// @ts-expect-error The independent exact binding requires its parent Customer.
export const missingParent: CustomerIdentityCommandParams = { identity_id:'identity' };
// @ts-expect-error Verification is independent from Active/Revoked status.
export const falseStatus: FindCustomerIdentitiesParams = { customer_id:'customer',status:'verified' };
// @ts-expect-error Discovery filters are native scalar tags, not the root status object.
export const taggedFilter: FindCustomersParams = { status:{type:'active'} };
