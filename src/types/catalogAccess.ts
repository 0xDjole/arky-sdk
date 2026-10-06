import type { EpochMilliseconds } from "./time";

export type CatalogAudience =
  | { type: "everyone" }
  | { type: "customer_group"; customer_group_id: string }
  | { type: "customer"; customer_id: string }
  | { type: "all_companies" }
  | { type: "company"; company_id: string }
  | { type: "company_location"; company_location_id: string };

export type CatalogAudienceType = CatalogAudience["type"];

export type CatalogChannels =
  | { type: "all" }
  | { type: "only"; sales_channel_ids: string[] };

export type CatalogAccessLevel =
  | { type: "browse" }
  | { type: "see_prices" }
  | { type: "buy" };

export type CatalogAccessLevelType = CatalogAccessLevel["type"];

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

export interface CreateCatalogAccessParams {
  store_id: string;
  catalog_id: string;
  audience: CatalogAudience;
  channels: CatalogChannels;
  level: CatalogAccessLevel;
}

export interface GetCatalogAccessParams {
  store_id: string;
  id: string;
}

export interface DeleteCatalogAccessParams extends GetCatalogAccessParams {
  expected_updated_at: EpochMilliseconds;
}

export interface FindCatalogAccessesParams {
  store_id: string;
  catalog_id: string;
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
  limit?: number;
  cursor?: string;
}
