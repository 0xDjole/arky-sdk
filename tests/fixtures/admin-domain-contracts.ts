import { createAdmin } from 'arky-sdk';
import type { AdminLogoutResult, AdminSession, CreateAdminConfig, CreateStoreParams, RequestPendingAccountSessionParams } from 'arky-sdk';
import type * as Public from 'arky-sdk/types';

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type Admin = ReturnType<typeof createAdmin>;
type Tokens = Admin['account']['token'];

const store_id = 'a4219f3b-50b1-4a78-902b-d7264ae027a9';
const admin = createAdmin({ apiUrl: 'https://api.example.test' });
const session_id = '6f1d3b85-2c47-4e90-a8b3-5d7f9e1c3a62';
admin.account.auth.requestCode({ session_id, email: 'invited@example.test', store_id, language: 'bs' });
admin.account.auth.requestCode({ session_id, email: 'owner@example.test' });
admin.account.auth.verify({ session_id: 'pending', code: '123456', store_id });

export const tokenClient = createAdmin({ apiUrl: 'https://api.example.test', accountToken: 'arky_at_ttttttttttttttttttttttttttttttttttttttttttA' });
export const madeToken: Promise<Public.AccountTokenCreated> = admin.account.token.create({ id: '9c4e1a73-2b58-4d06-8f3a-7e1d5b9c2a64', name: 'CI', stores: { type: 'test_stores' }, permissions: [{ type: 'admin' }], expires_at: null });

export type AdminDomainContracts = [
  Assert<Equal<Public.ApiKeyCreated["type"], 'created' | 'existing'>>,
  Assert<Equal<Extract<Public.ApiKeyCreated, { value: string }>, never>>,
  Assert<Equal<keyof Extract<Public.ApiKeyCreated, { type: 'created' }>, 'type' | 'key'>>,
  Assert<Equal<Public.AccountTokenCreated["type"], 'secret_created' | 'existing'>>,
  Assert<Equal<Extract<Public.AccountTokenCreated, { value: string }>["type"], 'secret_created'>>,
  Assert<Equal<keyof Extract<Public.AccountTokenCreated, { type: 'secret_created' }>, 'type' | 'token' | 'value'>>,
  Assert<Equal<keyof Extract<Public.AccountTokenCreated, { type: 'existing' }>, 'type' | 'token'>>,
  Assert<Equal<keyof Public.AccountToken, 'id' | 'account_id' | 'name' | 'token_hint' | 'stores' | 'permissions' | 'expires_at' | 'status' | 'created_at' | 'updated_at'>>,
  Assert<Equal<Public.AccountTokenStores, { type: 'all' } | { type: 'only'; store_ids: string[] } | { type: 'test_stores' }>>,
  Assert<Equal<Public.AccountTokenStatus, { type: 'active' } | { type: 'revoked'; revoked_at: Public.EpochMilliseconds }>>,
  Assert<Equal<Public.AccountToken['permissions'], Public.StorePermission[]>>,
  Assert<Equal<Public.AccountToken['expires_at'], Public.EpochMilliseconds | null>>,
  Assert<Equal<Public.CreateAccountTokenParams, { id: string; name: string; stores: Public.AccountTokenStores; permissions: Public.StorePermission[]; expires_at: Public.EpochMilliseconds | null }>>,
  Assert<Equal<keyof Tokens, 'create' | 'find' | 'revoke' | 'delete'>>,
  Assert<Equal<Parameters<Tokens['create']>[0], Public.CreateAccountTokenParams>>,
  Assert<Equal<Awaited<ReturnType<Tokens['create']>>, Public.AccountTokenCreated>>,
  Assert<Equal<Parameters<Tokens['find']>[0], Public.FindAccountTokensParams | undefined>>,
  Assert<Equal<Public.FindAccountTokensParams, { limit?: number; cursor?: string | null }>>,
  Assert<Equal<Awaited<ReturnType<Tokens['find']>>, Public.PaginatedResponse<Public.AccountToken>>>,
  Assert<Equal<Parameters<Tokens['revoke']>[0], Public.RevokeAccountTokenParams>>,
  Assert<Equal<Public.RevokeAccountTokenParams, { id: string; expected_updated_at: Public.EpochMilliseconds }>>,
  Assert<Equal<Awaited<ReturnType<Tokens['revoke']>>, Public.AccountToken>>,
  Assert<Equal<Parameters<Tokens['delete']>[0], Public.DeleteAccountTokenParams>>,
  Assert<Equal<Public.DeleteAccountTokenParams, { id: string; expected_updated_at: Public.EpochMilliseconds }>>,
  Assert<Equal<Awaited<ReturnType<Tokens['delete']>>, void>>,
  Assert<Equal<Public.AccountCredentialType, { type: 'session' } | { type: 'account_token'; account_token_id: string }>>,
  Assert<Equal<CreateAdminConfig['accountToken'], string | undefined>>,
  Assert<Missing<CreateAdminConfig, 'secretKey'>>,
  Assert<Equal<AdminLogoutResult['type'], 'revoked' | 'unconfirmed' | 'local_only' | 'account_token'>>,
  Assert<Equal<Extract<AdminLogoutResult, { type: 'account_token' }>, { type: 'account_token' }>>,
  Assert<Equal<keyof AdminSession, 'id' | 'email'>>,
  Assert<Missing<AdminSession, 'scope'>>,
  Assert<Missing<CreateAdminConfig, 'storeId'>>,
  Assert<Missing<CreateAdminConfig, 'market'>>,
  Assert<Missing<CreateAdminConfig, 'locale'>>,
  Assert<Equal<RequestPendingAccountSessionParams, { session_id: string; email: string; store_id?: undefined } | { session_id: string; email: string; store_id: string; language: string }>>,
  Assert<Equal<Parameters<Admin['account']['auth']['requestCode']>[0], RequestPendingAccountSessionParams>>,
  Assert<Missing<Admin['store'], 'adminDomain'>>,
  Assert<Missing<Admin['store'], 'branding'>>,
  Assert<Missing<Admin['store'], 'customerWorkspace'>>,
  Assert<Missing<Admin['store'], 'commerce'>>,
  Assert<Missing<Admin, 'setStoreId'>>,
  Assert<Missing<Admin, 'getMarket'>>,
  Assert<Equal<keyof CreateStoreParams, 'id' | 'mode' | 'name' | 'timezone' | 'languages' | 'market' | 'sales_channel' | 'location_address'>>,
  Assert<Equal<CreateStoreParams, Public.CreateStoreParams>>,
  Assert<Missing<Public.Store, 'billing_email'>>,
  Assert<Missing<Public.Store, 'contact_email'>>,
  Assert<Missing<Public.Store, 'default_language'>>,
  Assert<Equal<Public.Store['languages'], string[]>>,
];
