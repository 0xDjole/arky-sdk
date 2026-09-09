import type { EpochMilliseconds } from "./time";

export type CatalogEntitlementEditableStatus =
  { type: "draft" } | { type: "active" } | { type: "archived" };

export type CatalogEntitlementStatus =
  CatalogEntitlementEditableStatus | { type: "deleting" };

export interface CatalogEntitlement {
  id: string;
  store_id: string;
  catalog_id: string;
  conditions: CatalogCondition[];
  access: CatalogAccess;
  status: CatalogEntitlementStatus;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CreateCatalogEntitlementParams {
  store_id?: string;
  catalog_id: string;
  conditions: CatalogCondition[];
  access: CatalogAccess;
  status: CatalogEntitlementEditableStatus;
  starts_at?: EpochMilliseconds | null;
  ends_at?: EpochMilliseconds | null;
}

export interface GetCatalogEntitlementParams {
  store_id?: string;
  id: string;
}

export interface UpdateCatalogEntitlementParams extends GetCatalogEntitlementParams {
  expected_updated_at: EpochMilliseconds;
  conditions: CatalogCondition[];
  access: CatalogAccess;
  status: CatalogEntitlementEditableStatus;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
}

export interface DeleteCatalogEntitlementParams extends GetCatalogEntitlementParams {
  expected_updated_at: EpochMilliseconds;
}

export interface FindCatalogEntitlementsParams {
  store_id?: string;
  catalog_id: string;
  limit?: number;
  cursor?: string;
}

export type CatalogCondition =
  | { type: "customer"; ids: string[] }
  | { type: "company"; ids: string[] }
  | { type: "customer_group"; ids: string[] }
  | { type: "market"; ids: string[] }
  | { type: "sales_channel"; ids: string[] };

export interface CatalogAccess {
  view_products: boolean;
  view_prices: boolean;
  purchase: boolean;
}
