import type { Account, StoreMembership, AccountVerificationEmailStatus, FindOwnStoreMembershipsParams, GetOwnStoreMembershipParams, PaginatedResponse } from 'arky-sdk';
import type { createAdmin } from 'arky-sdk/admin';
type True<T extends true> = T;
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Admin = ReturnType<typeof createAdmin>;
export type MembershipDiscoveryContracts = [
  True<Same<ReturnType<Admin['store']['member']['getOwn']>, Promise<StoreMembership | null>>>,
  True<Same<ReturnType<Admin['store']['member']['findOwn']>, Promise<PaginatedResponse<StoreMembership>>>>,
  True<Same<NonNullable<Parameters<Admin['store']['member']['getOwn']>[0]>, GetOwnStoreMembershipParams>>,
  True<Same<NonNullable<Parameters<Admin['store']['member']['findOwn']>[0]>, FindOwnStoreMembershipsParams>>,
  True<Same<StoreMembership['status'], {type: 'invited' | 'active'}>>,
  True<Same<StoreMembership['invitation_email_status'], AccountVerificationEmailStatus | null>>,
  True<Same<Account['status'], {type: 'active' | 'deleting'}>>
];
