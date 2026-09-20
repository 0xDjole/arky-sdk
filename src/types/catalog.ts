import type { EpochMilliseconds } from "./time";

export interface CatalogReadOptions {
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
  name: string;
  assortment_id: string;
  price_list_id: string | null;
  priority: number;
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
  assortment_id: string;
  price_list_id: string | null;
  priority?: number;
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
  assortment_id: string;
  price_list_id: string | null;
  priority?: number;
  status: CatalogEditableStatus;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
}

export interface DeleteCatalogParams extends GetCatalogParams {
  expected_updated_at: EpochMilliseconds;
}

export interface FindCatalogsParams {
  status?: CatalogStatus["type"];
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
  assortment_id?: string;
  price_list_id?: string;
  store_id?: string;
  key?: string;
  limit?: number;
  cursor?: string;
}
export interface GetCatalogByKeyParams {
  store_id?: string;
  key: string;
}
