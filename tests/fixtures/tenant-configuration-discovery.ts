import type {
  FindSalesChannelsParams,
  FindTaxCategoriesParams,
  FindZonesParams,
  SalesChannelStatus,
  TenantRecordByKeyParams,
} from "arky-sdk";
import type { createAdmin } from "arky-sdk/admin";

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Admin = ReturnType<typeof createAdmin>;
type PageKeys = "tenant_id" | "key" | "sort_field" | "sort_direction" | "limit" | "cursor";

export type TenantDiscoveryContracts = [
  Assert<Equal<keyof FindZonesParams, PageKeys | "market_id">>,
  Assert<Equal<keyof FindTaxCategoriesParams, PageKeys>>,
  Assert<Equal<keyof FindSalesChannelsParams, PageKeys | "status">>,
  Assert<Equal<NonNullable<FindZonesParams["sort_field"]>, "created_at" | "updated_at">>,
  Assert<Equal<NonNullable<FindTaxCategoriesParams["sort_field"]>, "created_at" | "updated_at">>,
  Assert<Equal<NonNullable<FindSalesChannelsParams["sort_field"]>, "created_at" | "updated_at">>,
  Assert<Equal<NonNullable<FindSalesChannelsParams["status"]>, SalesChannelStatus["type"]>>,
  Assert<Equal<Parameters<Admin["tenant"]["zone"]["getByKey"]>[0], TenantRecordByKeyParams>>,
  Assert<Equal<Parameters<Admin["tenant"]["taxCategory"]["getByKey"]>[0], TenantRecordByKeyParams>>,
  Assert<Equal<Parameters<Admin["tenant"]["salesChannel"]["getByKey"]>[0], TenantRecordByKeyParams>>,
  Assert<Equal<Awaited<ReturnType<Admin["tenant"]["salesChannel"]["delete"]>>, { deleted: true }>>,
];
