import type { AccountActor } from "./accountActor";
import type { Currency, Money } from "./index";
import type { SellableRef } from "./sellable";
import type { EpochMilliseconds } from "./time";

export type PriceEditableStatus = { type: "active" } | { type: "archived" };
export type PriceStatus = PriceEditableStatus | { type: "deleting" };

export interface Price {
  id: string;
  store_id: string;
  catalog_id: string;
  sellable: SellableRef;
  amount: number;
  compare_at: number | null;
  min_quantity: number;
  max_quantity: number | null;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
  status: PriceStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface ManualPriceInput {
  allow_promotions: boolean;
  currency: Currency;
  amount: number;
  reason: string;
}

export interface ManualPrice {
  money: Money;
  reason: string;
  authorized_by: AccountActor;
  allow_promotions: boolean;
}

export interface CreatePriceParams {
  store_id: string;
  catalog_id: string;
  sellable: SellableRef;
  amount: number;
  compare_at: number | null;
  min_quantity: number;
  max_quantity: number | null;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
  status: PriceEditableStatus;
}

export interface GetPriceParams {
  store_id: string;
  id: string;
}

export interface UpdatePriceParams extends GetPriceParams {
  expected_updated_at: EpochMilliseconds;
  amount: number;
  compare_at: number | null;
  min_quantity: number;
  max_quantity: number | null;
  starts_at: EpochMilliseconds | null;
  ends_at: EpochMilliseconds | null;
  status: PriceEditableStatus;
}

export interface DeletePriceParams extends GetPriceParams {
  expected_updated_at: EpochMilliseconds;
}

export interface FindPricesParams {
  store_id: string;
  catalog_id?: string;
  sellable?: SellableRef;
  status?: PriceStatus["type"];
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
  limit?: number;
  cursor?: string;
}

export type PriceBatchOperation =
  | ({ type: "create" } & Omit<CreatePriceParams, "store_id">)
  | ({ type: "update" } & Omit<UpdatePriceParams, "store_id">)
  | { type: "delete"; id: string; expected_updated_at: EpochMilliseconds };

export interface BatchPricesParams {
  store_id: string;
  operations: PriceBatchOperation[];
}
