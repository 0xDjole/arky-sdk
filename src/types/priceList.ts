import type { EpochMilliseconds } from "./time";

export type PriceListEditableStatus =
  { type: "draft" } | { type: "active" } | { type: "archived" };
export type PriceListStatus = PriceListEditableStatus | { type: "deleting" };

export interface PriceList {
  id: string;
  store_id: string;
  key: string;
  name: string;
  priority: number;
  status: PriceListStatus;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface PriceListUsage {
  catalog_ids: string[];
  more_catalogs: boolean;
  price_ids: string[];
  more_prices: boolean;
}

export interface CreatePriceListParams {
  store_id?: string;
  key: string;
  name: string;
  priority: number;
  status: PriceListEditableStatus;
  starts_at?: EpochMilliseconds | null;
  ends_at?: EpochMilliseconds | null;
}

export interface GetPriceListParams {
  store_id?: string;
  id: string;
}

export interface UpdatePriceListParams extends GetPriceListParams {
  expected_updated_at: EpochMilliseconds;
  name: string;
  priority: number;
  status: PriceListEditableStatus;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
}

export interface DeletePriceListParams extends GetPriceListParams {
  expected_updated_at: EpochMilliseconds;
}

export interface FindPriceListsParams {
  store_id?: string;
  key?: string;
  limit?: number;
  cursor?: string;
}
