import type { createAdmin } from 'arky-sdk/admin';
import type { createStorefront } from 'arky-sdk/storefront';
import type { FindMarketsParams, FindStoreLocationsParams, ListPaymentProvidersParams, PaginatedResponse, Market, StoreLocation, PaymentProvider } from 'arky-sdk';
type Admin = ReturnType<typeof createAdmin>;
type Front = ReturnType<typeof createStorefront>;
type True<T extends true> = T;
type Same<A,B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
export type ConfigurationPages = [
  True<Same<Awaited<ReturnType<Admin['store']['market']['list']>>,PaginatedResponse<Market>>>,
  True<Same<Awaited<ReturnType<Admin['store']['location']['list']>>,PaginatedResponse<StoreLocation>>>,
  True<Same<Awaited<ReturnType<Admin['store']['paymentProvider']['list']>>,PaginatedResponse<PaymentProvider>>>
];
export const market: FindMarketsParams = {store_id:'store',currency:'eur',status:'deleting',limit:1,cursor:'opaque'};
export const location: FindStoreLocationsParams = {is_pickup_location:false,status:'archived',sort_field:'updated_at'};
export const provider: ListPaymentProvidersParams = {configuration_type:'stripe',status:'disabled',cursor:'opaque'};
export const exactMarket: Parameters<Admin['store']['market']['get']>[0] = {store_id:'store',id:'market'};
export const exactLocation: Parameters<Admin['store']['location']['get']>[0] = {store_id:'store',id:'location'};
// @ts-expect-error Exact reads use the explicit scope/id parameter object
export const unscopedLocationArgument: Parameters<Admin['store']['location']['get']>[0] = 'location';
// @ts-expect-error Market has no archived status
export const invalidMarket: FindMarketsParams = {status:'archived'};
// @ts-expect-error Public context supplies Store identity, not the query
export const publicStore: Parameters<Front['store']['market']['list']>[0] = {store_id:'foreign'};
// @ts-expect-error Public browsing only exposes active locations
export const publicStatus: Parameters<Front['store']['location']['list']>[0] = {status:'deleting'};
type Setup = Awaited<ReturnType<Front['getSetup']>>;
export type PublicMarketSelection = [
  True<Same<Setup['default_market'], Awaited<ReturnType<Front['store']['market']['getByKey']>> | null>>,
  True<Same<Setup['languages']['default'], string | null>>
];
declare const setup: Setup;
// @ts-expect-error Setup carries only its exact default, never an unbounded Market list.
setup.markets;
// @ts-expect-error Public setup never exposes Stripe connection/consent evidence.
setup.payment_providers[0].configuration;
// @ts-expect-error Exact public lookup takes only the key; Store comes from the public client.
export const scopedPublicKey: Parameters<Front['store']['market']['getByKey']>[0] = {store_id:'foreign',key:'retail'};
