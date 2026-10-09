import type { createAdmin } from "arky-sdk/admin";
import type { AccountSortField, FindStoresParams, PaginatedResponse, SearchAccountsParams, Store, StorePlan } from "arky-sdk";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Admin = ReturnType<typeof createAdmin>;

export const stores: FindStoresParams = { query: "workspace", limit: 1, cursor: null, sort_field: "name", sort_direction: "desc" };
export const accounts: SearchAccountsParams = { query: "operator", limit: 1, cursor: null, sort_field: "email", sort_direction: "asc" };

export type PlatformDiscoveryContracts = [
  Assert<Equal<NonNullable<FindStoresParams["sort_field"]>, "name">>,
  Assert<Equal<NonNullable<FindStoresParams["query"]>, string>>,
  Assert<Equal<AccountSortField, "email">>,
  Assert<Equal<NonNullable<Parameters<Admin["store"]["find"]>[0]>, FindStoresParams>>,
  Assert<Equal<Awaited<ReturnType<Admin["store"]["find"]>>, PaginatedResponse<Store>>>,
  Assert<Equal<Awaited<ReturnType<Admin["platform"]["getStorePlans"]>>, PaginatedResponse<StorePlan>>>,
];
