import type { createAdmin } from 'arky-sdk/admin';
import type {
    FindMarketZonesParams, FindMarketSalesChannelsParams, FindShippingMethodsParams, FindShippingRatesParams, FindTaxRulesParams,
    GetMarketZoneByBindingParams, GetMarketSalesChannelByBindingParams, GetShippingMethodByKeyParams,
    MarketZone, MarketSalesChannel, ShippingMethod, ShippingRate, TaxRule, UpdateShippingMethodParams, ShippingMethodType,
    CreateTaxRuleParams, UpdateTaxRuleParams, EpochMilliseconds
} from 'arky-sdk';
type True<T extends true> = T;
type Same<A,B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Api=ReturnType<typeof createAdmin>['store'];
type Page={store_id?:string;status?:'active'|'archived'|'deleting';sort_field?:'created_at'|'updated_at';sort_direction?:'asc'|'desc';limit?:number;cursor?:string};
type PairPage=Omit<Page,'status'>&{status?:'active'|'deleting'};
export type ShippingDiscoveryContract=[
 True<Same<FindMarketZonesParams,PairPage&{market_id?:string;zone_id?:string}>>,
 True<Same<FindMarketSalesChannelsParams,PairPage&{market_id?:string;sales_channel_id?:string}>>,
 True<Same<FindShippingMethodsParams,Page&{key?:string;location_id?:string;tax_category_id?:string}>>,
 True<Same<FindShippingRatesParams,Page&{market_zone_id?:string;shipping_method_id?:string;shipping_profile_id?:string}>>,
 True<Same<FindTaxRulesParams,Page&{market_zone_id?:string;tax_category_id?:string;default_only?:boolean}>>,
 True<Same<Parameters<Api['marketZone']['getByBinding']>[0],GetMarketZoneByBindingParams>>,
 True<Same<Parameters<Api['marketSalesChannel']['getByBinding']>[0],GetMarketSalesChannelByBindingParams>>,
 True<Same<Parameters<Api['shippingMethod']['getByKey']>[0],GetShippingMethodByKeyParams>>,
 True<Same<Awaited<ReturnType<Api['marketZone']['delete']>>,MarketZone|void>>,
 True<Same<Awaited<ReturnType<Api['marketSalesChannel']['remove']>>,MarketSalesChannel|void>>,
 True<Same<Awaited<ReturnType<Api['shippingMethod']['delete']>>,ShippingMethod|void>>,
 True<Same<Awaited<ReturnType<Api['shippingRate']['delete']>>,ShippingRate|void>>,
 True<Same<Awaited<ReturnType<Api['taxRule']['delete']>>,TaxRule|void>>,
 True<Same<UpdateShippingMethodParams['type'],ShippingMethodType>>,
 True<Same<Pick<CreateTaxRuleParams,'starts_at'|'ends_at'>,{starts_at:EpochMilliseconds|null;ends_at:EpochMilliseconds|null}>>,
 True<Same<Pick<UpdateTaxRuleParams,'starts_at'|'ends_at'>,{starts_at:EpochMilliseconds|null;ends_at:EpochMilliseconds|null}>>
];
