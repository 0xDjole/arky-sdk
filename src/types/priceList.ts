import type { EpochMilliseconds } from "./time";

export type PriceListEditableStatus =
  { type: "draft" } | { type: "active" } | { type: "archived" };
export type PriceListStatus = PriceListEditableStatus | { type: "deleting" };

export interface PriceList {
  id: string;
  store_id: string;
  key: string;
  name: string;
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
  status: PriceListEditableStatus;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
}

export interface DeletePriceListParams extends GetPriceListParams {
  expected_updated_at: EpochMilliseconds;
}

export interface FindPriceListsParams {
  status?: PriceListStatus["type"];
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
  store_id?: string;
  key?: string;
  limit?: number;
  cursor?: string;
}
export interface GetPriceListByKeyParams {
  store_id?: string;
  key: string;
}
