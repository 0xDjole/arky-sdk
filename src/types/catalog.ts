import type { EpochMilliseconds } from "./time";

export interface CatalogReadOptions {
  company_id?: string;
  include_price?: boolean;
}

export type CatalogEditableStatus =
  { type: "draft" } | { type: "active" } | { type: "archived" };

export type CatalogStatus = CatalogEditableStatus | { type: "deleting" };

export interface Catalog {
  id: string;
  store_id: string;
  key: string;
  name: string;
  assortment_id: string | null;
  price_list_id: string | null;
  status: CatalogStatus;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CatalogUsage {
  entitlement_ids: string[];
  more_entitlements: boolean;
}

export interface CreateCatalogParams {
  store_id?: string;
  key: string;
  name: string;
  assortment_id: string | null;
  price_list_id: string | null;
  status: CatalogEditableStatus;
  starts_at?: EpochMilliseconds | null;
  ends_at?: EpochMilliseconds | null;
}

export interface GetCatalogParams {
  store_id?: string;
  id: string;
}

export interface UpdateCatalogParams extends GetCatalogParams {
  expected_updated_at: EpochMilliseconds;
  name: string;
  assortment_id: string | null;
  price_list_id: string | null;
  status: CatalogEditableStatus;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
}

export interface DeleteCatalogParams extends GetCatalogParams {
  expected_updated_at: EpochMilliseconds;
}

export interface FindCatalogsParams {
  store_id?: string;
  key?: string;
  limit?: number;
  cursor?: string;
}
