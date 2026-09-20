import type { FindZonesParams, FindTaxCategoriesParams, FindSalesChannelsParams, GetZoneByKeyParams, GetTaxCategoryByKeyParams, GetSalesChannelByKeyParams } from 'arky-sdk';
import type { createAdmin } from 'arky-sdk/admin';
type True<T extends true> = T;
type Same<A,B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Admin = ReturnType<typeof createAdmin>;
type Filters = {store_id?:string;key?:string;status?:'active'|'archived'|'deleting';sort_field?:'created_at'|'updated_at';sort_direction?:'asc'|'desc';limit?:number;cursor?:string};
export type StoreDiscoveryContracts = [
 True<Same<FindZonesParams,Filters>>,
 True<Same<FindTaxCategoriesParams,Filters>>,
 True<Same<FindSalesChannelsParams,Filters>>,
 True<Same<Parameters<Admin['store']['zone']['getByKey']>[0],GetZoneByKeyParams>>,
 True<Same<Parameters<Admin['store']['taxCategory']['getByKey']>[0],GetTaxCategoryByKeyParams>>,
 True<Same<Parameters<Admin['store']['salesChannel']['getByKey']>[0],GetSalesChannelByKeyParams>>
];
