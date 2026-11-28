import type { createAdmin } from "arky-sdk/admin";
import type { AccountSortField, FeatureType, FindTenantsParams, FindTestTenantsByLiveTenantsParams, PaginatedResponse, FindAccountsParams, Tenant, TenantSearchStatus, TenantSearchType, NetworkPlan, PlanLimit, WebhookEventMetadata, WebhookEventScopeField } from "arky-sdk";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Admin = ReturnType<typeof createAdmin>;

export const tenants: FindTenantsParams = { query: "workspace", limit: 1, cursor: null, sort_field: "name", sort_direction: "desc" };
export const accounts: FindAccountsParams = { query: "operator", limit: 1, cursor: null, sort_field: "email", sort_direction: "asc" };

export type PlatformDiscoveryContracts = [
  Assert<Equal<NonNullable<FindTenantsParams["sort_field"]>, "name">>,
  Assert<Equal<NonNullable<FindTenantsParams["query"]>, string>>,
  Assert<Equal<NonNullable<FindTenantsParams["type"]>, TenantSearchType>>,
  Assert<Equal<TenantSearchType, "live" | "test">>,
  Assert<Equal<NonNullable<FindTenantsParams["status"]>, TenantSearchStatus>>,
  Assert<Equal<TenantSearchStatus, "active" | "suspended" | "wiping" | "wiping_suspended" | "deleting">>,
  Assert<Equal<Parameters<Admin["tenant"]["testTenants"]["findByLiveTenants"]>[0], FindTestTenantsByLiveTenantsParams>>,
  Assert<Equal<FindTestTenantsByLiveTenantsParams, { live_tenant_ids: string[]; limit?: number; cursor?: string | null }>>,
  Assert<Equal<Awaited<ReturnType<Admin["tenant"]["testTenants"]["findByLiveTenants"]>>, PaginatedResponse<Tenant>>>,
  Assert<Equal<AccountSortField, "email">>,
  Assert<Equal<NonNullable<Parameters<Admin["tenant"]["find"]>[0]>, FindTenantsParams>>,
  Assert<Equal<Awaited<ReturnType<Admin["tenant"]["find"]>>, PaginatedResponse<Tenant>>>,
  Assert<Equal<Awaited<ReturnType<Admin["network"]["plan"]["find"]>>, PaginatedResponse<NetworkPlan>>>,
  Assert<Equal<NetworkPlan["features"], Record<FeatureType, PlanLimit>>>,
  Assert<Equal<Awaited<ReturnType<Admin["platform"]["findWebhookEvents"]>>, WebhookEventMetadata[]>>,
  Assert<Equal<Awaited<ReturnType<Admin["platform"]["findCurrencies"]>>, string[]>>,
  Assert<Equal<NonNullable<Parameters<Admin["account"]["find"]>[0]>, FindAccountsParams>>,
  Assert<Equal<WebhookEventMetadata["scopes"], WebhookEventScopeField[]>>,
  Assert<Equal<WebhookEventScopeField, { field: string }>>,
];
