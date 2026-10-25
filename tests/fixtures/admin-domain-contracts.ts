import { createAdmin } from 'arky-sdk';
import type { AdminSession, CreateAdminConfig, CreateStoreParams, RequestPendingAccountSessionParams } from 'arky-sdk';
import type * as Public from 'arky-sdk/types';

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type Admin = ReturnType<typeof createAdmin>;

const store_id = 'a4219f3b-50b1-4a78-902b-d7264ae027a9';
const admin = createAdmin({ apiUrl: 'https://api.example.test' });
const session_id = '6f1d3b85-2c47-4e90-a8b3-5d7f9e1c3a62';
admin.account.auth.requestCode({ session_id, email: 'invited@example.test', store_id, language: 'bs' });
admin.account.auth.requestCode({ session_id, email: 'owner@example.test' });
admin.account.auth.verify({ session_id: 'pending', code: '123456', store_id });

export type AdminDomainContracts = [
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
  Assert<Equal<keyof CreateStoreParams, 'id' | 'name' | 'timezone' | 'languages' | 'market' | 'sales_channel' | 'location_address'>>,
  Assert<Equal<CreateStoreParams, Public.CreateStoreParams>>,
  Assert<Missing<Public.Store, 'billing_email'>>,
  Assert<Missing<Public.Store, 'contact_email'>>,
  Assert<Missing<Public.Store, 'default_language'>>,
  Assert<Equal<Public.Store['languages'], string[]>>,
];
