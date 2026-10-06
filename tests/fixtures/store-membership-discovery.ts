import type { Account, Store, StoreMembership, StoreMembershipStatus, StoreMembershipWithStoreName, StoreAccess, StorePermission, StoreRole, LocationReach, AddMemberParams, UpdateStoreMemberRolesParams, FindOwnStoreMembershipsParams, GetOwnStoreMembershipParams, PaginatedResponse, TransferStoreOwnershipParams, ChangeStoreMemberStatusParams } from 'arky-sdk';
import type { createAdmin } from 'arky-sdk/admin';
type True<T extends true> = T;
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Admin = ReturnType<typeof createAdmin>;
export type MembershipDiscoveryContracts = [
  True<Same<ReturnType<Admin['store']['member']['getOwn']>, Promise<StoreMembershipWithStoreName | null>>>,
  True<Same<ReturnType<Admin['store']['member']['findOwn']>, Promise<PaginatedResponse<StoreMembershipWithStoreName>>>>,
  True<Same<NonNullable<Parameters<Admin['store']['member']['getOwn']>[0]>, GetOwnStoreMembershipParams>>,
  True<Same<NonNullable<Parameters<Admin['store']['member']['findOwn']>[0]>, FindOwnStoreMembershipsParams>>,
  True<Same<Parameters<Admin['store']['member']['updateRoles']>[0], UpdateStoreMemberRolesParams>>,
  True<Same<ReturnType<Admin['store']['member']['updateRoles']>, Promise<StoreMembership>>>,
  True<Same<StoreMembership['role_ids'], string[]>>,
  True<'access' extends keyof StoreMembership ? false : true>,
  True<Same<StoreMembershipWithStoreName['access'], StoreAccess>>,
  True<Same<StoreAccess['permissions'], StorePermission[]>>,
  True<Same<StoreMembershipWithStoreName['store_name'], string>>,
  True<'store_name' extends keyof StoreMembership ? false : true>,
  True<Same<AddMemberParams['role_ids'], string[]>>,
  True<{} extends Pick<AddMemberParams, 'role_ids'> ? false : true>,
  True<'access' extends keyof AddMemberParams ? false : true>,
  True<'role' extends keyof StoreMembership ? false : true>,
  True<'role' extends keyof AddMemberParams ? false : true>,
  True<Same<StorePermission['type'], 'admin' | 'catalog' | 'orders' | 'customers' | 'fulfillment' | 'inventory' | 'marketing' | 'content' | 'support' | 'automation' | 'analytics'>>,
  True<Same<Extract<StorePermission, { type: 'fulfillment' }>['locations'], LocationReach>>,
  True<Same<Extract<StorePermission, { type: 'inventory' }>['locations'], LocationReach>>,
  True<'locations' extends keyof Extract<StorePermission, { type: 'orders' }> ? false : true>,
  True<Same<LocationReach, { type: 'everywhere' } | { type: 'only'; store_location_ids: string[] }>>,
  True<Same<StoreRole['status'], { type: 'active' } | { type: 'deleting' }>>,
  True<Same<keyof Admin['store']['role'], 'create' | 'update' | 'get' | 'find' | 'delete'>>,
  True<Same<Parameters<Admin['store']['member']['transferOwnership']>[0], TransferStoreOwnershipParams>>,
  True<Same<ReturnType<Admin['store']['member']['transferOwnership']>, Promise<Store>>>,
  True<Same<Parameters<Admin['store']['member']['changeStatus']>[0], ChangeStoreMemberStatusParams>>,
  True<Same<ReturnType<Admin['store']['member']['changeStatus']>, Promise<StoreMembership>>>,
  True<Same<ChangeStoreMemberStatusParams['status'], {type: 'active'} | {type: 'disabled'}>>,
  True<Same<StoreMembership['status'], StoreMembershipStatus>>,
  True<Same<StoreMembershipStatus, {type: 'invited'} | {type: 'active'} | {type: 'disabled'}>>,
  True<Same<Store['owner_account_id'], string>>,
  True<'buildHook' extends keyof Admin['store'] ? false : true>,
  True<Same<StoreMembership['invitation_delivery_id'], string | null>>,
  True<'invitation_email_status' extends keyof StoreMembership ? false : true>,
  True<Same<Account['status'], {type: 'active' | 'deleting'}>>
];
