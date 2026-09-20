import type { EpochMilliseconds } from "./time";

export type ZoneMatch =
  | { type: "country"; country: string }
  | { type: "state"; country: string; state: string }
  | {
      type: "postal_code";
      country: string;
      state: string | null;
      postal_code: string;
    }
  | {
      type: "postal_code_prefix";
      country: string;
      state: string | null;
      prefix: string;
    };

export type ZoneEditableStatus = { type: "active" } | { type: "archived" };
export type ZoneStatus = ZoneEditableStatus | { type: "deleting" };

export interface Zone {
  id: string;
  store_id: string;
  key: string;
  includes: ZoneMatch[];
  excludes: ZoneMatch[];
  status: ZoneStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CreateZoneParams {
  store_id?: string;
  key: string;
  includes: ZoneMatch[];
  excludes: ZoneMatch[];
  status: ZoneEditableStatus;
}

export interface UpdateZoneParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  includes: ZoneMatch[];
  excludes: ZoneMatch[];
  status: ZoneEditableStatus;
}

export interface GetZoneParams {
  store_id?: string;
  id: string;
}

export interface FindZonesParams {
  store_id?: string;
  key?: string;
  status?: ZoneStatus["type"];
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
  limit?: number;
  cursor?: string;
}

export interface GetZoneByKeyParams {
  store_id?: string;
  key: string;
}

export interface DeleteZoneParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}

export type MarketZoneEditableStatus = { type: "active" } | { type: "archived" };
export type MarketZoneStatus = { type: "active" } | { type: "deleting" };

export interface MarketZone {
  id: string;
  store_id: string;
  market_id: string;
  zone_id: string;
  priority: number;
  status: MarketZoneStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CreateMarketZoneParams {
  store_id?: string;
  market_id: string;
  zone_id: string;
  priority: number;
}

export interface UpdateMarketZoneParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
  priority: number;
}

export interface GetMarketZoneParams {
  store_id?: string;
  id: string;
}

export interface FindMarketZonesParams {
  store_id?:string;
  market_id?:string;
  zone_id?:string;
  status?: "active"|"deleting";
  sort_field?: "created_at"|"updated_at";
  sort_direction?: "asc"|"desc";
  limit?:number;
  cursor?:string;
}

export interface GetMarketZoneByBindingParams {
  store_id?:string;
  market_id:string;
  zone_id:string;
}

export interface DeleteMarketZoneParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}
