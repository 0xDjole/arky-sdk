import type { AccountActor } from "./accountActor";
import type { PriceBilling } from "./commerce";
import type { Currency, Money } from "./index";
import type { SellableRef } from "./sellable";
import type { EpochMilliseconds } from "./time";

export type PriceEditableStatus = { type: "active" } | { type: "archived" };
export type PriceStatus = PriceEditableStatus | { type: "deleting" };

export interface Price {
  id: string;
  store_id: string;
  sellable: SellableRef;
  price_list_id: string | null;
  currency: Currency;
  amount: number;
  compare_at: number | null;
  billing: PriceBilling;
  min_quantity: number;
  max_quantity: number | null;
  status: PriceStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface ManualPriceInput {
  currency: Currency;
  amount: number;
  reason: string;
}

export interface ManualPrice {
  money: Money;
  reason: string;
  authorized_by: AccountActor;
}

export interface CreatePriceParams {
  store_id?: string;
  sellable: SellableRef;
  price_list_id?: string | null;
  currency: Currency;
  amount: number;
  compare_at?: number | null;
  billing: PriceBilling;
  min_quantity: number;
  max_quantity?: number | null;
  status: PriceEditableStatus;
}

export interface GetPriceParams {
  store_id?: string;
  id: string;
}

export interface UpdatePriceParams extends GetPriceParams {
  expected_updated_at: EpochMilliseconds;
  amount: number;
  compare_at: number | null;
  min_quantity: number;
  max_quantity: number | null;
  status: PriceEditableStatus;
}

export interface DeletePriceParams extends GetPriceParams {
  expected_updated_at: EpochMilliseconds;
}

export interface FindPricesParams {
  store_id?: string;
  limit?: number;
  cursor?: string;
  price_list_id?: string;
  sellable?: SellableRef;
}
