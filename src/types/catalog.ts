import type { EpochMilliseconds } from "./time";
import type { CompanyPartyQuery, SortDirection } from "./common";

export type SellableRef =
  | { type: "product_variant"; product_id: string; variant_id: string }
  | { type: "booking_offering"; booking_offering_id: string }
  | { type: "customer_group"; customer_group_id: string };

export type PriceSchedule =
  | { type: "always" }
  | { type: "scheduled"; starts_at: EpochMilliseconds; ends_at: EpochMilliseconds | null };

export type PriceStatus = { type: "active" } | { type: "archived" };

export interface Price {
  id: string;
  store_id: string;
  catalog_id: string;
  sellable: SellableRef;
  amount: number;
  compare_at: number | null;
  min_quantity: number;
  max_quantity: number | null;
  schedule: PriceSchedule;
  status: PriceStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type CatalogSchedule =
  | { type: "always" }
  | { type: "scheduled"; starts_at: EpochMilliseconds; ends_at: EpochMilliseconds | null };

export type CatalogStatus =
  | { type: "draft" }
  | { type: "active" }
  | { type: "archived" }
  | { type: "deleting" };

export type CatalogEditableStatus = Exclude<CatalogStatus, { type: "deleting" }>;

export interface Catalog {
  id: string;
  store_id: string;
  key: string;
  market_id: string;
  schedule: CatalogSchedule;
  status: CatalogStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type CatalogItemRef =
  | { type: "product"; product_id: string }
  | { type: "booking_service"; booking_service_id: string }
  | { type: "customer_group_offering"; customer_group_offering_id: string }
  | { type: "customer_group"; customer_group_id: string };

export interface CatalogItem {
  id: string;
  store_id: string;
  catalog_id: string;
  item: CatalogItemRef;
  position: number;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type CatalogAudience =
  | { type: "everyone" }
  | { type: "customer_group"; customer_group_id: string }
  | { type: "customer_group_offering"; customer_group_offering_id: string }
  | { type: "customer"; customer_id: string }
  | { type: "all_companies" }
  | { type: "company"; company_id: string }
  | { type: "company_location"; company_location_id: string };

export type CatalogChannels =
  | { type: "all" }
  | { type: "only"; sales_channel_ids: string[] };

export type CatalogAccessLevel =
  | { type: "browse" }
  | { type: "see_prices" }
  | { type: "buy" };

export interface CatalogAccess {
  id: string;
  store_id: string;
  catalog_id: string;
  audience: CatalogAudience;
  channels: CatalogChannels;
  level: CatalogAccessLevel;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface StorefrontCatalog {
  id: string;
  key: string;
  level: CatalogAccessLevel;
}

export interface CatalogCopyResult {
  items_created: number;
  items_kept: number;
  prices_created: number;
  prices_kept: number;
}

export type CatalogReadOptions = CompanyPartyQuery & {
  catalog_id?: string;
  include_price?: boolean;
};

export interface FindPricesParams {
  store_id: string;
  catalog_id?: string;
  sellable?: SellableRef;
  status?: PriceStatus["type"];
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface GetPriceParams {
  store_id: string;
  id: string;
}

export interface CreatePriceParams {
  store_id: string;
  id: string;
  catalog_id: string;
  sellable: SellableRef;
  amount: number;
  compare_at: number | null;
  min_quantity: number;
  max_quantity: number | null;
  schedule: PriceSchedule;
  status: PriceStatus;
}

export interface UpdatePriceParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  amount: number;
  compare_at: number | null;
  min_quantity: number;
  max_quantity: number | null;
  schedule: PriceSchedule;
  status: PriceStatus;
}

export interface DeletePriceParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export type PriceBatchOperation =
  | ({ type: "create" } & Omit<CreatePriceParams, "store_id">)
  | ({ type: "update" } & Omit<UpdatePriceParams, "store_id">)
  | { type: "delete"; id: string; expected_updated_at: EpochMilliseconds };

export interface BatchPricesParams {
  store_id: string;
  operations: PriceBatchOperation[];
}

export interface FindCatalogsParams {
  store_id: string;
  key?: string;
  market_id?: string;
  status?: CatalogStatus["type"];
  sort_field?: "key" | "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface GetCatalogParams {
  store_id: string;
  id: string;
}

export interface GetCatalogByKeyParams {
  store_id: string;
  key: string;
}

export interface CreateCatalogParams {
  store_id: string;
  id: string;
  key: string;
  market_id: string;
  schedule: CatalogSchedule;
  status: CatalogEditableStatus;
}

export interface UpdateCatalogParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  schedule: CatalogSchedule;
  status: CatalogEditableStatus;
}

export interface DeleteCatalogParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export interface CopyCatalogParams {
  store_id: string;
  id: string;
  source_catalog_id: string;
}

export type FindPurchasableCatalogsParams = CompanyPartyQuery & {
  store_id: string;
  market_id: string;
  sales_channel_id: string;
  customer_id: string;
};

export type FindStorefrontCatalogsParams = CompanyPartyQuery;

export interface FindCatalogItemsParams {
  store_id: string;
  catalog_id: string;
  item?: CatalogItemRef;
  limit?: number;
  cursor?: string | null;
}

export interface GetCatalogItemParams {
  store_id: string;
  id: string;
}

export interface CreateCatalogItemParams {
  store_id: string;
  id: string;
  catalog_id: string;
  item: CatalogItemRef;
}

export interface UpdateCatalogItemParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  position: number;
}

export interface DeleteCatalogItemParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export type CatalogItemBatchOperation =
  | { type: "create"; id: string; catalog_id: string; item: CatalogItemRef }
  | { type: "update"; id: string; expected_updated_at: EpochMilliseconds; position: number }
  | { type: "delete"; id: string; expected_updated_at: EpochMilliseconds };

export interface BatchCatalogItemsParams {
  store_id: string;
  operations: CatalogItemBatchOperation[];
}

export interface FindCatalogAccessesParams {
  store_id: string;
  catalog_id: string;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export interface GetCatalogAccessParams {
  store_id: string;
  id: string;
}

export interface CreateCatalogAccessParams {
  store_id: string;
  id: string;
  catalog_id: string;
  audience: CatalogAudience;
  channels: CatalogChannels;
  level: CatalogAccessLevel;
}

export interface DeleteCatalogAccessParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}
