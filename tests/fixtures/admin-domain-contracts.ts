import { createAdmin } from 'arky-sdk';
import type { AdminLogoutResult, AdminSession, CreateAdminConfig, CreateTenantParams, RequestPendingAccountSessionParams } from 'arky-sdk';
import type * as Public from 'arky-sdk/types';

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Missing<T, K extends PropertyKey> = K extends keyof T ? false : true;
type Admin = ReturnType<typeof createAdmin>;
type Tokens = Admin['account']['token'];

const tenant_id = 'a4219f3b-50b1-4a78-902b-d7264ae027a9';
const admin = createAdmin({ apiUrl: 'https://api.example.test' });
const session_id = '6f1d3b85-2c47-4e90-a8b3-5d7f9e1c3a62';
admin.account.auth.requestCode({ session_id, email: 'invited@example.test', tenant_id, language: 'bs' });
admin.account.auth.requestCode({ session_id, email: 'owner@example.test', network_id: tenant_id, language: 'bs' });
admin.account.auth.requestPlatformCode({ session_id, email: 'operator@example.test', language: 'en' });
admin.account.auth.verify({ session_id: 'pending', code: '123456', tenant_id });

export const tokenClient = createAdmin({ apiUrl: 'https://api.example.test', accountToken: 'arky_at_ttttttttttttttttttttttttttttttttttttttttttA' });
export const madeToken: Promise<Public.AccountTokenCreated> = admin.account.token.create({ id: '9c4e1a73-2b58-4d06-8f3a-7e1d5b9c2a64', name: 'CI', tenants: { type: 'ids', tenant_ids: [tenant_id] }, expiry: { type: 'never' } });

export type AdminDomainContracts = [
  Assert<Missing<Public.Account, 'test_tenants' | 'access' | 'email'>>,
  Assert<Equal<Public.Account['type']['type'], 'platform' | 'network'>>,
  Assert<Equal<Extract<Public.AccountType, { type: 'network' }>['network_id'], string>>,
  Assert<Equal<Public.AccountMe['session_email'], string>>,
  Assert<Equal<Public.ListedAccount['type'], { type: 'platform' } | { type: 'network'; network_id: string }>>,
  Assert<Equal<Awaited<ReturnType<Admin['platform']['account']['add']>>, Public.ListedAccount>>,
  Assert<Equal<Public.AddPlatformAccountParams, { id: string; email: string }>>,
  Assert<Missing<Public.AccountToken, 'permissions'>>,
  Assert<Missing<Admin['tenant'], 'apiKey'>>,
  Assert<Missing<Admin['platform'], 'access'>>,
  Assert<Equal<keyof Admin['platform']['account'], 'find' | 'getMe' | 'add' | 'delete' | 'resetSecondFactor'>>,
  Assert<Equal<Parameters<Admin['platform']['account']['add']>[0], Public.AddPlatformAccountParams>>,
  Assert<Equal<keyof Admin['network'], 'create' | 'find' | 'get' | 'update' | 'delete' | 'provider' | 'plan' | 'tenant' | 'role' | 'member'>>,
  Assert<Equal<keyof Admin['network']['tenant'], 'find' | 'get' | 'findSubscriptions' | 'getAgreement' | 'nameOwner'>>,
  Assert<Equal<Awaited<ReturnType<Admin['network']['tenant']['nameOwner']>>, Public.Tenant>>,
  Assert<Equal<Awaited<ReturnType<Admin['network']['tenant']['find']>>, Public.PaginatedResponse<Public.NetworkTenant>>>,
  Assert<Equal<keyof Public.FindNetworkTenantsParams, 'network_id' | 'limit' | 'cursor'>>,
  Assert<Equal<Public.NetworkPlanAccess['type'], 'public' | 'network_only'>>,
  Assert<Equal<Extract<Public.NetworkPlanAccess, { type: 'public' }>['price'], Public.NetworkPlanPublicPrice>>,
  Assert<Equal<Extract<Public.NetworkPlanAccess, { type: 'network_only' }>['price'], Public.NetworkPlanNetworkPrice>>,
  Assert<Equal<Public.NetworkPlanPublicPrice['type'], 'free' | 'lifetime' | 'monthly' | 'yearly'>>,
  Assert<Equal<Public.NetworkPlanNetworkPrice['type'], 'free' | 'outside' | 'lifetime' | 'monthly' | 'yearly'>>,
  Assert<Equal<Public.PlanLimit, { type: 'unlimited' } | { type: 'max'; count: number }>>,
  Assert<Equal<Public.TenantSubscriptionPlan['type'], 'granted' | 'trialing' | 'active' | 'paid_lifetime' | 'past_due' | 'trial_cancellation_scheduled' | 'paid_cancellation_scheduled' | 'unpaid' | 'cancelled'>>,
  Assert<Equal<Extract<Public.TenantSubscriptionPlan, { type: 'active' }>['paid_until'], Public.EpochMilliseconds>>,
  Assert<Equal<keyof Admin['tenant']['subscription'], 'get' | 'changePlan' | 'createCardSetup' | 'setCard' | 'pendingPayment' | 'reportPayment' | 'findCharges' | 'cancel' | 'grant' | 'endGrant'>>,
  Assert<Equal<keyof Admin['tenant']['plan'], 'get'>>,
  Assert<Equal<Awaited<ReturnType<Admin['tenant']['plan']['get']>>, Public.TenantPlanSummary>>,
  Assert<Equal<keyof Public.TenantPlanSummary, 'tenant_id' | 'plan' | 'status'>>,
  Assert<Equal<Public.TenantPlanSummary['plan'], Public.NetworkPlan>>,
  Assert<Equal<Public.TenantPlanStatus['type'], 'granted' | 'trialing' | 'active' | 'paid_lifetime' | 'past_due' | 'cancellation_scheduled' | 'unpaid' | 'cancelled'>>,
  Assert<Equal<Extract<Public.TenantPlanStatus, { type: 'trialing' }>['trial_ends_at'], Public.EpochMilliseconds>>,
  Assert<Missing<Extract<Public.TenantPlanStatus, { type: 'active' }>, 'stripe_customer_id' | 'stripe_payment_method_id' | 'network_provider_id'>>,
  Assert<Equal<Awaited<ReturnType<Admin['tenant']['testTenants']['find']>>, Public.PaginatedResponse<Public.Tenant>>>,
  Assert<Equal<Awaited<ReturnType<Admin['tenant']['wipe']>>, Public.Tenant>>,
  Assert<Equal<Public.AccountTokenCreated["type"], 'secret_created' | 'existing'>>,
  Assert<Equal<Extract<Public.AccountTokenCreated, { value: string }>["type"], 'secret_created'>>,
  Assert<Equal<keyof Extract<Public.AccountTokenCreated, { type: 'secret_created' }>, 'type' | 'token' | 'value'>>,
  Assert<Equal<keyof Extract<Public.AccountTokenCreated, { type: 'existing' }>, 'type' | 'token'>>,
  Assert<Equal<keyof Public.AccountToken, 'id' | 'account_id' | 'email' | 'name' | 'token_hint' | 'tenants' | 'expiry' | 'status' | 'created_at' | 'updated_at'>>,
  Assert<Equal<Public.AccountTokenTenants, { type: 'all' } | { type: 'ids'; tenant_ids: string[] }>>,
  Assert<Equal<Public.AccountTokenStatus, { type: 'active' } | { type: 'revoked'; revoked_at: Public.EpochMilliseconds }>>,
  Assert<Equal<Public.AccountToken['expiry'], Public.AccountTokenExpiry>>,
  Assert<Equal<Public.AccountTokenExpiry, { type: 'never' } | { type: 'at'; expires_at: Public.EpochMilliseconds }>>,
  Assert<Missing<Public.AccountToken, 'expires_at'>>,
  Assert<Equal<Public.CreateAccountTokenParams, { id: string; name: string; tenants: Public.AccountTokenTenants; expiry: Public.AccountTokenExpiry }>>,
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
  Assert<Equal<Awaited<ReturnType<Tokens['delete']>>, Public.DeletedResponse>>,
  Assert<Equal<Public.AccountCredentialType, { type: 'session' } | { type: 'account_token'; account_token_id: string }>>,
  Assert<Equal<CreateAdminConfig['accountToken'], string | undefined>>,
  Assert<Missing<CreateAdminConfig, 'secretKey'>>,
  Assert<Equal<AdminLogoutResult['type'], 'revoked' | 'unconfirmed' | 'local_only' | 'account_token'>>,
  Assert<Equal<Extract<AdminLogoutResult, { type: 'account_token' }>, { type: 'account_token' }>>,
  Assert<Equal<keyof AdminSession, 'id' | 'email'>>,
  Assert<Missing<AdminSession, 'scope'>>,
  Assert<Missing<CreateAdminConfig, 'tenantId'>>,
  Assert<Missing<CreateAdminConfig, 'market'>>,
  Assert<Missing<CreateAdminConfig, 'locale'>>,
  Assert<Equal<RequestPendingAccountSessionParams, { session_id: string; email: string; network_id: string; language: string; tenant_id?: undefined } | { session_id: string; email: string; tenant_id: string; language: string }>>,
  Assert<Equal<Public.RequestPlatformAccountSessionParams, { session_id: string; email: string; language: string }>>,
  Assert<Equal<Parameters<Admin['account']['auth']['requestCode']>[0], RequestPendingAccountSessionParams>>,
  Assert<Missing<Admin['tenant'], 'adminDomain'>>,
  Assert<Missing<Admin['tenant'], 'branding'>>,
  Assert<Missing<Admin['tenant'], 'userWorkspace'>>,
  Assert<Missing<Admin['tenant'], 'commerce'>>,
  Assert<Missing<Admin, 'setTenantId'>>,
  Assert<Missing<Admin, 'getMarket'>>,
  Assert<Equal<keyof CreateTenantParams, 'id' | 'type' | 'name' | 'timezone' | 'languages' | 'market' | 'sales_channel' | 'location_address' | 'agreement'>>,
  Assert<Equal<CreateTenantParams, Public.CreateTenantParams>>,
  Assert<Missing<Public.Tenant, 'billing_email'>>,
  Assert<Missing<Public.Tenant, 'contact_email'>>,
  Assert<Missing<Public.Tenant, 'default_language'>>,
  Assert<Equal<Public.Tenant['languages'], string[]>>,
  Assert<Equal<Public.Tenant['invoicing'], Public.TenantInvoicing>>,
  Assert<Equal<Extract<Public.CreateTenantType, { type: 'live' }>['owner'], Public.CreateTenantOwner>>,
  Assert<Equal<Public.CreateTenantOwner, { type: 'caller' } | { type: 'email'; email: string; language: string }>>,
  Assert<Equal<ReturnType<Admin["getAccessToken"]>, string | null>>,
];
