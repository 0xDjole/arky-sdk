import type { createAdmin } from "arky-sdk/admin";
import type { AccountSortField, FeatureType, FindStoresParams, FindTestStoresByLiveStoresParams, PaginatedResponse, FindAccountsParams, Store, StoreSearchStatus, StoreSearchType, NetworkPlan, PlanLimit, WebhookEventMetadata, WebhookEventScopeField } from "arky-sdk";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Admin = ReturnType<typeof createAdmin>;

export const stores: FindStoresParams = { query: "workspace", limit: 1, cursor: null, sort_field: "name", sort_direction: "desc" };
export const accounts: FindAccountsParams = { query: "operator", limit: 1, cursor: null, sort_field: "email", sort_direction: "asc" };

export type PlatformDiscoveryContracts = [
  Assert<Equal<NonNullable<FindStoresParams["sort_field"]>, "name">>,
  Assert<Equal<NonNullable<FindStoresParams["query"]>, string>>,
  Assert<Equal<NonNullable<FindStoresParams["type"]>, StoreSearchType>>,
  Assert<Equal<StoreSearchType, "live" | "test">>,
  Assert<Equal<NonNullable<FindStoresParams["status"]>, StoreSearchStatus>>,
  Assert<Equal<StoreSearchStatus, "active" | "suspended" | "wiping" | "wiping_suspended" | "deleting">>,
  Assert<Equal<Parameters<Admin["store"]["testStores"]["findByLiveStores"]>[0], FindTestStoresByLiveStoresParams>>,
  Assert<Equal<FindTestStoresByLiveStoresParams, { live_store_ids: string[]; limit?: number; cursor?: string | null }>>,
  Assert<Equal<Awaited<ReturnType<Admin["store"]["testStores"]["findByLiveStores"]>>, PaginatedResponse<Store>>>,
  Assert<Equal<AccountSortField, "email">>,
  Assert<Equal<NonNullable<Parameters<Admin["store"]["find"]>[0]>, FindStoresParams>>,
  Assert<Equal<Awaited<ReturnType<Admin["store"]["find"]>>, PaginatedResponse<Store>>>,
  Assert<Equal<Awaited<ReturnType<Admin["network"]["plan"]["find"]>>, PaginatedResponse<NetworkPlan>>>,
  Assert<Equal<NetworkPlan["features"], Record<FeatureType, PlanLimit>>>,
  Assert<Equal<Awaited<ReturnType<Admin["platform"]["findWebhookEvents"]>>, WebhookEventMetadata[]>>,
  Assert<Equal<Awaited<ReturnType<Admin["platform"]["findCurrencies"]>>, string[]>>,
  Assert<Equal<NonNullable<Parameters<Admin["account"]["find"]>[0]>, FindAccountsParams>>,
  Assert<Equal<WebhookEventMetadata["scopes"], WebhookEventScopeField[]>>,
  Assert<Equal<WebhookEventScopeField, { field: string }>>,
];
