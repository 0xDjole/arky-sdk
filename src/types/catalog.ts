import type { CatalogAccessLevel } from "./catalogAccess";
import type { EpochMilliseconds } from "./time";

export interface CatalogReadOptions {
  catalog_id?: string;
  company_id?: string;
  company_location_id?: string;
  include_price?: boolean;
}

export type CatalogEditableStatus =
  { type: "draft" } | { type: "active" } | { type: "archived" };

export type CatalogStatus = CatalogEditableStatus | { type: "deleting" };

export interface Catalog {
  id: string;
  store_id: string;
  key: string;
  market_id: string;
  status: CatalogStatus;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CatalogSubscriptionBenefitUsage {
  entitlement_id: string;
  subscription_plan_id: string;
  subscription_offering_id: string;
}

export interface CatalogSubscriptionRevisionUsage {
  revision_id: string;
  subscription_id: string;
}

export interface CatalogUsage {
  catalog_access_ids: string[];
  more_catalog_accesses: boolean;
  catalog_item_ids: string[];
  more_catalog_items: boolean;
  price_ids: string[];
  more_prices: boolean;
  blocking_subscription_benefit: CatalogSubscriptionBenefitUsage | null;
  blocking_promotion_id: string | null;
  blocking_order_id: string | null;
  blocking_subscription_revision: CatalogSubscriptionRevisionUsage | null;
}

export interface CreateCatalogParams {
  store_id: string;
  key: string;
  market_id: string;
  status: CatalogEditableStatus;
  starts_at?: EpochMilliseconds | null;
  ends_at?: EpochMilliseconds | null;
}

export interface GetCatalogParams {
  store_id: string;
  id: string;
}

export interface UpdateCatalogParams extends GetCatalogParams {
  expected_updated_at: EpochMilliseconds;
  status: CatalogEditableStatus;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
}

export interface DeleteCatalogParams extends GetCatalogParams {
  expected_updated_at: EpochMilliseconds;
}

export interface FindCatalogsParams {
  store_id: string;
  market_id?: string;
  status?: CatalogStatus["type"];
  key?: string;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
  limit?: number;
  cursor?: string;
}

export interface GetCatalogByKeyParams {
  store_id: string;
  key: string;
}

export interface CopyCatalogParams {
  store_id: string;
  id: string;
  source_catalog_id: string;
}

export interface CatalogCopyResult {
  items_created: number;
  items_kept: number;
  prices_created: number;
  prices_kept: number;
}

export type FindPurchasableCatalogsParams = {
  store_id: string;
  market_id: string;
  sales_channel_id: string;
  customer_id: string;
} & (
  | { company_id?: never; company_location_id?: never }
  | { company_id: string; company_location_id: string }
);

export type FindStorefrontCatalogsParams =
  | { company_id?: never; company_location_id?: never }
  | { company_id: string; company_location_id: string };

export interface StorefrontCatalog {
  id: string;
  key: string;
  level: CatalogAccessLevel;
}
