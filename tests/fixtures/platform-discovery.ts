import { createAdmin } from "arky-sdk/admin";
import type { GetStoresParams, SearchAccountsParams } from "arky-sdk";
const stores: GetStoresParams = { query: "workspace", limit: 1, cursor: null, sort_field: "name", sort_direction: "desc" };
const accounts: SearchAccountsParams = { query: "operator", limit: 1, cursor: null, sort_field: "email", sort_direction: "asc" };
const admin = createAdmin({ baseUrl: "https://platform.test", storeId: "8ccad9a6-502e-440b-8373-b0fbaf36154c", market: "test", apiToken: "arky_account_access_type" });
void admin.store.find(stores);
void admin.account.search(accounts);
// @ts-expect-error Stores sort only by name.
const unsupportedSort: GetStoresParams = { sort_field: "timezone" };
// @ts-expect-error Store search is text, not an implicit numeric query.
const numericQuery: GetStoresParams = { query: 123 };
void [unsupportedSort, numericQuery];
