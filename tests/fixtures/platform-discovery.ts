import type { createAdmin } from "arky-sdk/admin";
import type { AccountSortField, FeatureType, FindStoresParams, PaginatedResponse, FindAccountsParams, Store, StorePlan, StorePlanFeature, WebhookEventMetadata, WebhookEventScopeField } from "arky-sdk";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Admin = ReturnType<typeof createAdmin>;

export const stores: FindStoresParams = { query: "workspace", limit: 1, cursor: null, sort_field: "name", sort_direction: "desc" };
export const accounts: FindAccountsParams = { query: "operator", limit: 1, cursor: null, sort_field: "email", sort_direction: "asc" };

export type PlatformDiscoveryContracts = [
  Assert<Equal<NonNullable<FindStoresParams["sort_field"]>, "name">>,
  Assert<Equal<NonNullable<FindStoresParams["query"]>, string>>,
  Assert<Equal<AccountSortField, "email">>,
  Assert<Equal<NonNullable<Parameters<Admin["store"]["find"]>[0]>, FindStoresParams>>,
  Assert<Equal<Awaited<ReturnType<Admin["store"]["find"]>>, PaginatedResponse<Store>>>,
  Assert<Equal<Awaited<ReturnType<Admin["platform"]["findStorePlans"]>>, PaginatedResponse<StorePlan>>>,
  Assert<Equal<StorePlan["features"], Record<FeatureType, StorePlanFeature>>>,
  Assert<Equal<Awaited<ReturnType<Admin["platform"]["findWebhookEvents"]>>, PaginatedResponse<WebhookEventMetadata>>>,
  Assert<Equal<Awaited<ReturnType<Admin["platform"]["findCurrencies"]>>, PaginatedResponse<string>>>,
  Assert<Equal<NonNullable<Parameters<Admin["account"]["find"]>[0]>, FindAccountsParams>>,
  Assert<Equal<WebhookEventMetadata["scopes"], WebhookEventScopeField[]>>,
  Assert<Equal<WebhookEventScopeField, { field: string }>>,
];
