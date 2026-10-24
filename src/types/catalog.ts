import type { EpochMilliseconds } from "./time";
import type { Block, BlockQuery } from "./block";
import type { CompanyPartyQuery, Currency, Money, Schedule, SortDirection, TaxMode } from "./common";
import type { CategoryEntry, CategoryQuery } from "./content";
import type { RecurringCadence } from "./customerGroup";

export type SellableRef =
  | { type: "product_variant"; variant_id: string }
  | { type: "booking_offering"; booking_offering_id: string }
  | { type: "customer_group"; customer_group_id: string };

export type PriceStatus = { type: "active" } | { type: "archived" };

export interface CatalogItemPriceChange {
  starts_at: EpochMilliseconds;
  amount: number;
  compare_at: number | null;
}

export interface CatalogItemPrice {
  id: string;
  store_id: string;
  catalog_item_id: string;
  sellable: SellableRef;
  amount: number;
  compare_at: number | null;
  changes: CatalogItemPriceChange[];
  schedule: Schedule;
  status: PriceStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CatalogItemPricePage {
  items: CatalogItemPrice[];
  cursor: string | null;
  repairing: number;
}

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
  schedule: Schedule;
  status: CatalogStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export type CatalogItemRef =
  | { type: "product"; product_id: string }
  | { type: "booking_service"; booking_service_id: string }
  | { type: "customer_group_offering"; customer_group_offering_id: string }
  | { type: "customer_group"; customer_group_id: string };

export type CatalogItemStatus = { type: "active" } | { type: "archived" };

export interface CatalogItem {
  id: string;
  store_id: string;
  catalog_id: string;
  item: CatalogItemRef;
  schedule: Schedule;
  status: CatalogItemStatus;
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
  items_skipped: number;
  prices_created: number;
  prices_kept: number;
  prices_skipped: number;
  cursor: string | null;
}

export type CatalogContext = CompanyPartyQuery & {
  catalog_id: string;
};

export type CatalogReadOptions = CatalogContext & {
  include_price?: boolean;
};

export interface StorefrontPrice {
  catalog_item_price_id: string;
  tax_mode: TaxMode;
  unit_price: Money;
  compare_at: number | null;
  priced_at: EpochMilliseconds;
}

export type CatalogListingType = "product" | "booking_service" | "customer_group" | "customer_group_offering";

export type CatalogListingSort = "catalog_order" | "relevance" | "starting_price";

export type CatalogPriceBasis =
  | { type: "product_unit" }
  | { type: "booking_option" }
  | { type: "permanent_agreement" }
  | { type: "recurring_agreement"; cadence: RecurringCadence };

export type CatalogPriceFilter =
  | { min_amount: number; max_amount?: number | null }
  | { min_amount?: number | null; max_amount: number };

export interface CatalogChoiceFilter {
  sku?: string;
  blocks?: BlockQuery[];
  price?: CatalogPriceFilter;
}

export interface CatalogListingSelection {
  types?: CatalogListingType[];
  text?: string;
  categories?: CategoryQuery[];
  blocks?: BlockQuery[];
  choice?: CatalogChoiceFilter;
  price_basis?: CatalogPriceBasis;
  sort?: CatalogListingSort;
  direction?: SortDirection;
}

export interface CatalogParentDefinition {
  key: string;
  slugs: Record<string, string>;
  blocks: Block[];
  categories: CategoryEntry[];
}

export interface CatalogChoiceDefinition {
  sku: string | null;
  blocks: Block[];
  basis: CatalogPriceBasis;
}

export type CatalogPriceSummary =
  | {
      type: "comparable";
      basis: CatalogPriceBasis;
      min_amount: number;
      max_amount: number;
      choice_count: number;
    }
  | { type: "different_bases"; choice_count: number };

export interface CatalogMatchingPrice {
  catalog_item_price_id: string;
  amount: number;
  basis: CatalogPriceBasis;
}

export interface CatalogListing {
  catalog_item_id: string;
  catalog_id: string;
  item: CatalogItemRef;
  position: number;
  content: CatalogParentDefinition;
  access: CatalogAccessLevel;
  currency: Currency | null;
  price_summary: CatalogPriceSummary | null;
  matching_price: CatalogMatchingPrice | null;
  catalog_item_price_id: string | null;
}

export interface CatalogListingDetails {
  catalog_item_id: string;
  catalog_id: string;
  item: CatalogItemRef;
  position: number;
  content: CatalogParentDefinition;
  access: CatalogAccessLevel;
}

export interface CatalogChoice {
  catalog_item_price_id: string;
  sellable: SellableRef;
  content: CatalogChoiceDefinition;
  price: StorefrontPrice | null;
}

export type FindStorefrontCatalogItemsParams = CatalogReadOptions & {
  selection?: CatalogListingSelection;
  limit?: number;
  cursor?: string | null;
};

export type GetStorefrontCatalogItemByParentParams = CatalogContext & {
  item: CatalogItemRef;
};

export type FindStorefrontCatalogItemPricesParams = CatalogReadOptions & {
  catalog_item_id: string;
  limit?: number;
  cursor?: string | null;
};

interface CatalogItemPriceListFilters {
  store_id: string;
  status?: PriceStatus["type"];
  sort_field?: "created_at" | "updated_at";
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string | null;
}

export type FindCatalogItemPricesParams = CatalogItemPriceListFilters &
  ({ catalog_item_id: string; sellable?: SellableRef } | { catalog_item_id?: string; sellable: SellableRef });

export interface GetCatalogItemPriceParams {
  store_id: string;
  id: string;
}

export interface CreateCatalogItemPriceParams {
  store_id: string;
  id: string;
  catalog_item_id: string;
  sellable: SellableRef;
  amount: number;
  compare_at: number | null;
  changes: CatalogItemPriceChange[];
  schedule: Schedule;
  status: PriceStatus;
}

export interface UpdateCatalogItemPriceParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  amount: number;
  compare_at: number | null;
  changes: CatalogItemPriceChange[];
  schedule: Schedule;
  status: PriceStatus;
}

export interface DeleteCatalogItemPriceParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export type CatalogItemPriceBatchOperation =
  | ({ type: "create" } & Omit<CreateCatalogItemPriceParams, "store_id">)
  | ({ type: "update" } & Omit<UpdateCatalogItemPriceParams, "store_id">)
  | { type: "delete"; id: string; expected_updated_at: EpochMilliseconds };

export interface BatchCatalogItemPricesParams {
  store_id: string;
  operations: CatalogItemPriceBatchOperation[];
}

export interface FindCatalogsParams {
  store_id: string;
  key?: string;
  market_id?: string;
  status?: CatalogStatus["type"];
  sort_field?: "created_at" | "updated_at";
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
  schedule: Schedule;
  status: CatalogEditableStatus;
}

export interface UpdateCatalogParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  schedule: Schedule;
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
  cursor?: string | null;
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
  schedule: Schedule;
  status: CatalogItemStatus;
}

export interface UpdateCatalogItemParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  position: number;
  schedule: Schedule;
  status: CatalogItemStatus;
}

export interface DeleteCatalogItemParams {
  store_id: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export type CatalogItemBatchOperation =
  | ({ type: "create" } & Omit<CreateCatalogItemParams, "store_id">)
  | ({ type: "update" } & Omit<UpdateCatalogItemParams, "store_id">)
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
