import type { EpochMilliseconds } from "./time";

export type MarketPaymentOptionStatus =
  | { type: "active" }
  | { type: "deleting" };

export interface MarketPaymentOption {
  id: string;
  store_id: string;
  market_id: string;
  payment_option_id: string;
  status: MarketPaymentOptionStatus;
  created_at: EpochMilliseconds;
  updated_at: EpochMilliseconds;
}

export interface CreateMarketPaymentOptionParams {
  store_id?: string;
  market_id: string;
  payment_option_id: string;
}

export interface GetMarketPaymentOptionParams {
  store_id?: string;
  id: string;
}

export interface FindMarketPaymentOptionsParams {
  store_id?: string;
  market_id?: string;
  payment_option_id?: string;
  status?: "active" | "deleting";
  sort_field?: "created_at" | "updated_at";
  sort_direction?: "asc" | "desc";
  limit?: number;
  cursor?: string;
}

export interface LookupMarketPaymentOptionParams {
  store_id?: string;
  market_id: string;
  payment_option_id: string;
}

export interface RemoveMarketPaymentOptionParams {
  store_id?: string;
  id: string;
  expected_updated_at: EpochMilliseconds;
}
